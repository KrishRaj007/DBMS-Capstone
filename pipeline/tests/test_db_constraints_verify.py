"""
Tests for:
1. Database constraints and referential relationships
2. Foreign key integrity between songs, artists, genres, users, and listening_history
3. Analytics SQL views execution
4. Verification auditor post-load audit suite
"""
import unittest
import sqlite3
import tempfile
import os
from pathlib import Path

from pipeline.load import adapt_sqlite_schema, load_to_sqlite
from pipeline.verify import run_verification
from pipeline.transform import UserEntity, ArtistEntity, SongEntity

class TestDbConstraintsAndVerify(unittest.TestCase):

    def setUp(self):
        self.db_file = tempfile.NamedTemporaryFile("w+", delete=False, suffix=".sqlite")
        self.db_path = Path(self.db_file.name)
        self.db_file.close()

        self.conn = sqlite3.connect(str(self.db_path))
        adapt_sqlite_schema(self.conn)
        cursor = self.conn.cursor()
        from pipeline.config import STANDARD_GENRES
        genre_rows = [(g["id"], g["name"], g["description"]) for g in STANDARD_GENRES]
        cursor.executemany("INSERT OR IGNORE INTO genres (id, name, description) VALUES (?, ?, ?)", genre_rows)
        self.conn.commit()

    def tearDown(self):
        self.conn.close()
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_referential_integrity_songs_to_artists_and_genres(self):
        cursor = self.conn.cursor()

        # Insert user
        cursor.execute("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u1', 'u1@test.com', 'hash123')")
        # Insert artist
        cursor.execute("INSERT INTO artists (id, name, genre_id) VALUES (10, 'Artist Ten', 1)")
        # Insert song referencing artist 10 and genre 1
        cursor.execute("INSERT INTO songs (id, title, artist_id, genre_id) VALUES (100, 'Song Hundred', 10, 1)")
        # Insert listening history referencing user 1 and song 100
        cursor.execute("INSERT INTO listening_history (id, user_id, song_id, listened_at) VALUES (1000, 1, 100, '2026-01-01 12:00:00')")
        self.conn.commit()

        # Check for orphan songs without artist
        cursor.execute("""
            SELECT COUNT(*) FROM songs s
            LEFT JOIN artists a ON s.artist_id = a.id
            WHERE a.id IS NULL
        """)
        orphan_artists = cursor.fetchone()[0]
        self.assertEqual(orphan_artists, 0)

        # Check for orphan songs without genre
        cursor.execute("""
            SELECT COUNT(*) FROM songs s
            LEFT JOIN genres g ON s.genre_id = g.id
            WHERE g.id IS NULL
        """)
        orphan_genres = cursor.fetchone()[0]
        self.assertEqual(orphan_genres, 0)

        # Check for orphan listening records
        cursor.execute("""
            SELECT COUNT(*) FROM listening_history lh
            LEFT JOIN users u ON lh.user_id = u.id
            LEFT JOIN songs s ON lh.song_id = s.id
            WHERE u.id IS NULL OR s.id IS NULL
        """)
        orphan_listens = cursor.fetchone()[0]
        self.assertEqual(orphan_listens, 0)

    def test_unique_user_constraints(self):
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO users (username, email, password_hash) VALUES ('alice', 'alice@test.com', 'hash123')")
        self.conn.commit()

        # Duplicate username or email should violate unique constraint
        with self.assertRaises(sqlite3.IntegrityError):
            cursor.execute("INSERT INTO users (username, email, password_hash) VALUES ('alice', 'different@test.com', 'hash123')")
            self.conn.commit()

        with self.assertRaises(sqlite3.IntegrityError):
            cursor.execute("INSERT INTO users (username, email, password_hash) VALUES ('bob', 'alice@test.com', 'hash123')")
            self.conn.commit()

    def test_analytics_views_operational(self):
        cursor = self.conn.cursor()
        # Seed test data
        cursor.execute("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'u1', 'u1@test.com', 'hash123')")
        cursor.execute("INSERT INTO artists (id, name, genre_id) VALUES (1, 'Top Artist', 1)")
        cursor.execute("INSERT INTO songs (id, title, artist_id, genre_id) VALUES (1, 'Hit Song', 1, 1)")
        cursor.execute("INSERT INTO listening_history (user_id, song_id, duration_listened) VALUES (1, 1, 200)")
        self.conn.commit()

        # Execute top_songs_view
        cursor.execute("SELECT * FROM top_songs_view WHERE id = 1")
        row = cursor.fetchone()
        self.assertIsNotNone(row)
        # title is second col
        self.assertEqual(row[1], 'Hit Song')

        # Execute genre_popularity_view
        cursor.execute("SELECT * FROM genre_popularity_view WHERE id = 1")
        g_row = cursor.fetchone()
        self.assertIsNotNone(g_row)
        self.assertEqual(g_row[1], 'Pop')

    def test_run_verification_suite(self):
        # Seed test data
        cursor = self.conn.cursor()
        cursor.execute("INSERT INTO users (id, username, email, password_hash) VALUES (1, 'audit_user', 'audit@test.com', 'hash123')")
        cursor.execute("INSERT INTO artists (id, name, genre_id) VALUES (1, 'Audit Artist', 2)")
        cursor.execute("INSERT INTO songs (id, title, artist_id, genre_id) VALUES (1, 'Audit Song', 1, 2)")
        cursor.execute("INSERT INTO listening_history (user_id, song_id, duration_listened) VALUES (1, 1, 180)")
        self.conn.commit()

        report = run_verification(self.db_path)
        self.assertGreater(report.total_checks, 0)
        # The key checks must pass
        check_dict = {c.name: c.passed for c in report.checks}
        self.assertTrue(check_dict["TABLES_POPULATED"])
        self.assertTrue(check_dict["REFERENTIAL_SONGS_TO_ARTISTS"])
        self.assertTrue(check_dict["REFERENTIAL_SONGS_TO_GENRES"])
        self.assertTrue(check_dict["REFERENTIAL_LISTENING_HISTORY"])
        self.assertTrue(check_dict["NO_HALLUCINATED_PLACEHOLDERS"])
        self.assertTrue(check_dict["ANALYTICS_VIEWS_OPERATIONAL"])

if __name__ == "__main__":
    unittest.main()
