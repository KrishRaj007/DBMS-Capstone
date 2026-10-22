"""
Stage 6: Load Module
Loads validated, cleaned, and deduplicated records into:
1. Cleaned Intermediate Layer (JSONL files in data/cleaned/)
2. Target Database Layer (SQLite and/or MySQL relational database with batching and transactions)
3. Backend JSON Data Bridge (enables instant querying by mockStore/Express API)
"""
import json
from pathlib import Path
import sqlite3
from typing import Dict, List, Optional, Any, Tuple
import os

from pipeline.config import (
    CLEANED_DIR,
    USERS_CLEANED_FILE,
    ARTISTS_CLEANED_FILE,
    GENRES_CLEANED_FILE,
    SONGS_CLEANED_FILE,
    LISTENING_CLEANED_FILE,
    REJECTED_RECORDS_FILE,
    METRICS_FILE,
    SQLITE_DB_PATH,
    MOCK_STORE_JSON_PATH,
    STANDARD_GENRES,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
)
from pipeline.transform import UserEntity, ArtistEntity, SongEntity

def ensure_cleaned_dir():
    CLEANED_DIR.mkdir(parents=True, exist_ok=True)
    if SQLITE_DB_PATH.parent:
        SQLITE_DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# ────────────────────────────────────────────────────────────
# 1. CLEANED INTERMEDIATE DATA WRITERS
# ────────────────────────────────────────────────────────────

def write_intermediate_genres():
    ensure_cleaned_dir()
    with open(GENRES_CLEANED_FILE, "w", encoding="utf-8") as f:
        for g in STANDARD_GENRES:
            f.write(json.dumps(g, ensure_ascii=False) + "\n")

def write_intermediate_users(users: Dict[str, UserEntity]):
    ensure_cleaned_dir()
    with open(USERS_CLEANED_FILE, "w", encoding="utf-8") as f:
        for u in users.values():
            rec = {
                "user_id": u.user_id,
                "username": u.username,
                "email": u.email,
                "gender": u.gender,
                "age": u.age,
                "country": u.country,
                "registered_at": u.registered_at,
                "source_id": u.source_id,
                "provenance": u.provenance
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def write_intermediate_artists(artists: Dict[int, ArtistEntity]):
    ensure_cleaned_dir()
    with open(ARTISTS_CLEANED_FILE, "w", encoding="utf-8") as f:
        for aid, a in artists.items():
            rec = {
                "id": aid,
                "name": a.name,
                "mbid": a.mbid,
                "original_credit": a.original_credit,
                "collaborators": a.collaborators,
                "genre_id": a.genre_id,
                "provenance": a.provenance
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def write_intermediate_songs(songs: Dict[int, SongEntity], artists: Dict[int, ArtistEntity]):
    ensure_cleaned_dir()
    with open(SONGS_CLEANED_FILE, "w", encoding="utf-8") as f:
        for sid, s in songs.items():
            rec = {
                "id": sid,
                "title": s.title,
                "artist_name": s.artist_name,
                "artist_mbid": s.artist_mbid,
                "track_mbid": s.track_mbid,
                "album": s.album,
                "duration_seconds": s.duration_seconds,
                "release_date": s.release_date,
                "genre_id": s.genre_id,
                "provenance": s.provenance
            }
            f.write(json.dumps(rec, ensure_ascii=False) + "\n")

def append_intermediate_scrobbles(scrobbles: List[Dict[str, Any]], reset: bool = False):
    ensure_cleaned_dir()
    mode = "w" if reset else "a"
    with open(LISTENING_CLEANED_FILE, mode, encoding="utf-8") as f:
        for sc in scrobbles:
            f.write(json.dumps(sc, ensure_ascii=False) + "\n")

def append_rejected_records(rejected: List[Dict[str, Any]], reset: bool = False):
    ensure_cleaned_dir()
    mode = "w" if reset else "a"
    with open(REJECTED_RECORDS_FILE, mode, encoding="utf-8") as f:
        for r in rejected:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")

def write_pipeline_metrics(metrics: Dict[str, Any]):
    ensure_cleaned_dir()
    with open(METRICS_FILE, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2, ensure_ascii=False)

# ────────────────────────────────────────────────────────────
# 2. SQLITE TARGET LOADER
# ────────────────────────────────────────────────────────────

def init_sqlite_schema(conn: sqlite3.Connection):
    """Initializes tables, views, and indexes in SQLite matching schema.sql."""
    cursor = conn.cursor()
    cursor.executescript("""
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        country TEXT,
        avatar_url TEXT,
        source_id TEXT UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS genres (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS artists (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        mbid TEXT UNIQUE,
        original_credit TEXT,
        genre_id INTEGER,
        bio TEXT,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (genre_id) REFERENCES genres(id)
    );

    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        track_mbid TEXT,
        album TEXT,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        release_date DATE,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
        FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS listening_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        song_id INTEGER NOT NULL,
        listened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        duration_listened INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs (artist_id);
    CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs (genre_id);
    CREATE INDEX IF NOT EXISTS idx_lh_user ON listening_history (user_id);
    CREATE INDEX IF NOT EXISTS idx_lh_song ON listening_history (song_id);
    CREATE INDEX IF NOT EXISTS idx_lh_listened_at ON listening_history (listened_at);

    -- Analytic Views
    CREATE VIEW IF NOT EXISTS top_songs_view AS
    SELECT
        s.id,
        s.title,
        s.album,
        s.duration_seconds,
        s.cover_url,
        s.release_date,
        a.name AS artist_name,
        a.id AS artist_id,
        g.name AS genre_name,
        g.id AS genre_id,
        COUNT(lh.id) AS play_count
    FROM songs s
    JOIN artists a ON s.artist_id = a.id
    JOIN genres g ON s.genre_id = g.id
    LEFT JOIN listening_history lh ON s.id = lh.song_id
    GROUP BY s.id;

    CREATE VIEW IF NOT EXISTS genre_popularity_view AS
    SELECT
        g.id,
        g.name,
        g.description,
        COUNT(DISTINCT s.id) AS song_count,
        COUNT(lh.id) AS total_plays
    FROM genres g
    LEFT JOIN songs s ON g.id = s.genre_id
    LEFT JOIN listening_history lh ON s.id = lh.song_id
    GROUP BY g.id;

    CREATE VIEW IF NOT EXISTS user_analytics_view AS
    SELECT
        u.id AS user_id,
        u.username,
        COUNT(DISTINCT lh.id) AS total_listens,
        COUNT(DISTINCT lh.song_id) AS unique_songs,
        COALESCE(SUM(lh.duration_listened), 0) AS total_listen_seconds
    FROM users u
    LEFT JOIN listening_history lh ON u.id = lh.user_id
    GROUP BY u.id;
    """)
    conn.commit()

def load_to_sqlite(
    users: Dict[str, UserEntity],
    artists: Dict[int, ArtistEntity],
    songs: Dict[int, SongEntity],
    artist_name_to_id: Dict[str, int],
    scrobbles: List[Dict[str, Any]],
    db_path: Path = SQLITE_DB_PATH
) -> Dict[str, int]:
    """Loads all normalized and deduplicated entities into SQLite database."""
    ensure_cleaned_dir()
    conn = sqlite3.connect(str(db_path))
    init_sqlite_schema(conn)
    cursor = conn.cursor()

    counts = {"genres": 0, "users": 0, "artists": 0, "songs": 0, "listening_history": 0}

    try:
        # 1. Genres
        genre_rows = [(g["id"], g["name"], g["description"]) for g in STANDARD_GENRES]
        cursor.executemany("INSERT OR IGNORE INTO genres (id, name, description) VALUES (?, ?, ?)", genre_rows)
        counts["genres"] = len(genre_rows)

        # 2. Users
        user_rows = []
        user_id_map = {}  # username -> db_user_id
        for u in users.values():
            reg_date = u.registered_at or "2006-01-01 00:00:00"
            user_rows.append((
                u.username,
                u.email,
                "$2a$10$WkLzXmZ1w3m6wWlJkK8c6eM6mZ1w3m6wWlJkK8c6eM6mZ1w3m6wW", # dummy hash for seed
                u.gender,
                u.age,
                u.country,
                u.source_id,
                reg_date
            ))
        cursor.executemany("""
            INSERT OR IGNORE INTO users
            (username, email, password_hash, gender, age, country, source_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, user_rows)
        counts["users"] = len(user_rows)

        # Fetch inserted user IDs for mapping
        cursor.execute("SELECT id, username FROM users")
        for db_id, uname in cursor.fetchall():
            user_id_map[uname.lower()] = db_id

        # 3. Artists
        artist_rows = []
        for aid, a in artists.items():
            artist_rows.append((
                aid,
                a.name,
                a.mbid,
                a.original_credit,
                a.genre_id
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO artists (id, name, mbid, original_credit, genre_id)
            VALUES (?, ?, ?, ?, ?)
        """, artist_rows)
        counts["artists"] = len(artist_rows)

        # 4. Songs
        song_rows = []
        for sid, s in songs.items():
            art_id = artist_name_to_id.get(s.artist_name.lower(), 1)
            song_rows.append((
                sid,
                s.title,
                art_id,
                s.genre_id,
                s.track_mbid,
                s.album,
                s.duration_seconds,
                s.release_date
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO songs
            (id, title, artist_id, genre_id, track_mbid, album, duration_seconds, release_date)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, song_rows)
        counts["songs"] = len(song_rows)

        # 5. Listening History
        scrobble_rows = []
        for sc in scrobbles:
            u_id = user_id_map.get(sc["user_id"].lower())
            if u_id:
                scrobble_rows.append((
                    u_id,
                    sc["song_id"],
                    sc["listened_at"],
                    sc.get("duration_listened", 0)
                ))
        cursor.executemany("""
            INSERT INTO listening_history (user_id, song_id, listened_at, duration_listened)
            VALUES (?, ?, ?, ?)
        """, scrobble_rows)
        counts["listening_history"] = len(scrobble_rows)

        conn.commit()
    finally:
        conn.close()

    return counts

# ────────────────────────────────────────────────────────────
# 3. MYSQL TARGET LOADER (Optional / when connected)
# ────────────────────────────────────────────────────────────

def load_to_mysql(
    users: Dict[str, UserEntity],
    artists: Dict[int, ArtistEntity],
    songs: Dict[int, SongEntity],
    artist_name_to_id: Dict[str, int],
    scrobbles: List[Dict[str, Any]]
) -> Optional[Dict[str, int]]:
    """Attempts loading into MySQL database using pymysql if credentials allow."""
    try:
        import pymysql
    except ImportError:
        return None

    try:
        conn = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            charset="utf8mb4"
        )
    except Exception:
        # MySQL not reachable or credentials pending; gracefully return None
        return None

    counts = {"genres": 0, "users": 0, "artists": 0, "songs": 0, "listening_history": 0}
    try:
        with conn.cursor() as cursor:
            # Genres
            genre_rows = [(g["id"], g["name"], g["description"]) for g in STANDARD_GENRES]
            cursor.executemany("""
                INSERT INTO genres (id, name, description)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE description=VALUES(description)
            """, genre_rows)
            counts["genres"] = len(genre_rows)

            # Users
            user_rows = []
            for u in users.values():
                user_rows.append((
                    u.username,
                    u.email,
                    "$2a$10$WkLzXmZ1w3m6wWlJkK8c6eM6mZ1w3m6wWlJkK8c6eM6mZ1w3m6wW",
                    u.registered_at or "2006-01-01 00:00:00"
                ))
            cursor.executemany("""
                INSERT IGNORE INTO users (username, email, password_hash, created_at)
                VALUES (%s, %s, %s, %s)
            """, user_rows)
            counts["users"] = len(user_rows)

            # Fetch MySQL user IDs
            cursor.execute("SELECT id, username FROM users")
            user_id_map = {uname.lower(): uid for uid, uname in cursor.fetchall()}

            # Artists
            artist_rows = []
            for aid, a in artists.items():
                artist_rows.append((aid, a.name[:100], a.original_credit or a.name))
            cursor.executemany("""
                INSERT INTO artists (id, name, bio)
                VALUES (%s, %s, %s)
                ON DUPLICATE KEY UPDATE name=VALUES(name)
            """, artist_rows)
            counts["artists"] = len(artist_rows)

            # Songs
            song_rows = []
            for sid, s in songs.items():
                art_id = artist_name_to_id.get(s.artist_name.lower(), 1)
                song_rows.append((
                    sid,
                    s.title[:200],
                    art_id,
                    s.genre_id,
                    s.duration_seconds
                ))
            cursor.executemany("""
                INSERT INTO songs (id, title, artist_id, genre_id, duration_seconds)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE title=VALUES(title)
            """, song_rows)
            counts["songs"] = len(song_rows)

            # Listening History
            scrobble_rows = []
            for sc in scrobbles:
                u_id = user_id_map.get(sc["user_id"].lower())
                if u_id:
                    scrobble_rows.append((
                        u_id,
                        sc["song_id"],
                        sc["listened_at"],
                        sc.get("duration_listened", 0)
                    ))
            cursor.executemany("""
                INSERT INTO listening_history (user_id, song_id, listened_at, duration_listened)
                VALUES (%s, %s, %s, %s)
            """, scrobble_rows)
            counts["listening_history"] = len(scrobble_rows)

            conn.commit()
    except Exception as e:
        print(f"MySQL loading exception: {e}")
        return None
    finally:
        conn.close()

    return counts

# ────────────────────────────────────────────────────────────
# 4. BACKEND JSON BRIDGE
# ────────────────────────────────────────────────────────────

def sync_backend_json_bridge(
    users: Dict[str, UserEntity],
    artists: Dict[int, ArtistEntity],
    songs: Dict[int, SongEntity],
    artist_name_to_id: Dict[str, int],
    scrobbles: List[Dict[str, Any]]
):
    """
    Exports a lightweight, optimized JSON payload for Backend/db/mockStore.js
    so the web dashboard can immediately reflect newly ingested pipeline data.
    """
    if not MOCK_STORE_JSON_PATH.parent.exists():
        return

    payload = {
        "metadata": {
            "source": "Last.fm 1K Dataset Pipeline",
            "imported_users": len(users),
            "imported_artists": len(artists),
            "imported_songs": len(songs),
            "imported_scrobbles": len(scrobbles)
        },
        "users": [
            {
                "id": idx + 1,
                "username": u.username,
                "email": u.email,
                "gender": u.gender,
                "age": u.age,
                "country": u.country,
                "created_at": u.registered_at or "2006-01-01"
            }
            for idx, u in enumerate(list(users.values())[:500])
        ],
        "artists": [
            {
                "id": aid,
                "name": a.name,
                "mbid": a.mbid,
                "genre_id": a.genre_id,
                "bio": f"Artist credit: {a.original_credit}" if a.original_credit else None
            }
            for aid, a in list(artists.items())[:1000]
        ],
        "songs": [
            {
                "id": sid,
                "title": s.title,
                "artist_id": artist_name_to_id.get(s.artist_name.lower(), 1),
                "genre_id": s.genre_id,
                "album": s.album or "Single",
                "duration_seconds": s.duration_seconds or 210,
                "release_date": s.release_date or "2008-01-01"
            }
            for sid, s in list(songs.items())[:2000]
        ]
    }

    with open(MOCK_STORE_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
