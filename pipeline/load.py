"""
Stage 6: Load Module
Loads validated, cleaned, and deduplicated records into:
1. Cleaned Intermediate Layer (JSONL files in data/cleaned/)
2. Target Database Layer (SQLite and/or MySQL relational database with staging tables, repeatable upserts, and transactional rollback)
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
from pipeline.transform import UserEntity, ArtistEntity, SongEntity, AggregatedPlayEntity

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
                "source_namespace": getattr(u, "source_namespace", "lastfm"),
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
                "source_namespace": getattr(a, "source_namespace", "lastfm"),
                "source_id": getattr(a, "source_id", None),
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
                "source_namespace": getattr(s, "source_namespace", "lastfm"),
                "source_id": getattr(s, "source_id", None),
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
# 2. SQLITE SCHEMA ADAPTATION & TARGET LOADER
# ────────────────────────────────────────────────────────────

def adapt_sqlite_schema(conn: sqlite3.Connection):
    """
    Non-destructively adapts SQLite schema:
    - Adds missing columns (source_namespace, source_id, etc.)
    - Creates aggregated_listening_counts table
    - Creates staging tables for isolated ETL
    - Adds appropriate indexes for search, joins, filtering, and analytics
    - Compiles analytical views that combine listening history and aggregated play counts
    """
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = ON;")

    # Helper to check if a column exists
    def get_columns(table_name: str) -> List[str]:
        try:
            return [row[1] for row in cursor.execute(f"PRAGMA table_info({table_name})").fetchall()]
        except Exception:
            return []

    # 1. Base tables creation if not exist
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        country TEXT,
        avatar_url TEXT,
        source_namespace TEXT NOT NULL DEFAULT 'local',
        source_id TEXT,
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
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        mbid TEXT,
        original_credit TEXT,
        genre_id INTEGER,
        bio TEXT,
        image_url TEXT,
        source_namespace TEXT NOT NULL DEFAULT 'local',
        source_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (genre_id) REFERENCES genres(id)
    );

    CREATE TABLE IF NOT EXISTS songs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist_id INTEGER NOT NULL,
        genre_id INTEGER NOT NULL,
        track_mbid TEXT,
        album TEXT,
        duration_seconds INTEGER NOT NULL DEFAULT 0,
        release_date DATE,
        cover_url TEXT,
        source_namespace TEXT NOT NULL DEFAULT 'local',
        source_id TEXT,
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
        source_namespace TEXT NOT NULL DEFAULT 'local',
        source_id TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
    );
    """)

    # 2. Add columns if table already existed without them
    user_cols = get_columns("users")
    if "source_namespace" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN source_namespace TEXT NOT NULL DEFAULT 'local'")
    if "source_id" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN source_id TEXT")
    if "gender" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN gender TEXT")
    if "age" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN age INTEGER")
    if "country" not in user_cols:
        cursor.execute("ALTER TABLE users ADD COLUMN country TEXT")

    artist_cols = get_columns("artists")
    if "source_namespace" not in artist_cols:
        cursor.execute("ALTER TABLE artists ADD COLUMN source_namespace TEXT NOT NULL DEFAULT 'local'")
    if "source_id" not in artist_cols:
        cursor.execute("ALTER TABLE artists ADD COLUMN source_id TEXT")
    if "mbid" not in artist_cols:
        cursor.execute("ALTER TABLE artists ADD COLUMN mbid TEXT")
    if "original_credit" not in artist_cols:
        cursor.execute("ALTER TABLE artists ADD COLUMN original_credit TEXT")
    if "genre_id" not in artist_cols:
        cursor.execute("ALTER TABLE artists ADD COLUMN genre_id INTEGER")

    song_cols = get_columns("songs")
    if "source_namespace" not in song_cols:
        cursor.execute("ALTER TABLE songs ADD COLUMN source_namespace TEXT NOT NULL DEFAULT 'local'")
    if "source_id" not in song_cols:
        cursor.execute("ALTER TABLE songs ADD COLUMN source_id TEXT")
    if "track_mbid" not in song_cols:
        cursor.execute("ALTER TABLE songs ADD COLUMN track_mbid TEXT")

    lh_cols = get_columns("listening_history")
    if "source_namespace" not in lh_cols:
        cursor.execute("ALTER TABLE listening_history ADD COLUMN source_namespace TEXT NOT NULL DEFAULT 'local'")
    if "source_id" not in lh_cols:
        cursor.execute("ALTER TABLE listening_history ADD COLUMN source_id TEXT")

    # 3. Create Aggregated Listening Counts table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aggregated_listening_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        artist_id INTEGER NOT NULL,
        song_id INTEGER,
        play_count INTEGER NOT NULL DEFAULT 0,
        source_namespace TEXT NOT NULL DEFAULT 'dataset',
        source_id TEXT,
        last_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
        UNIQUE (source_namespace, user_id, artist_id, song_id)
    );
    """)

    # 4. Create Staging Tables for Safe Bulk ETL
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS staging_users (
        source_id TEXT NOT NULL,
        source_namespace TEXT NOT NULL DEFAULT 'lastfm',
        username TEXT NOT NULL,
        email TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        gender TEXT,
        age INTEGER,
        country TEXT,
        registered_at TEXT,
        PRIMARY KEY (source_namespace, source_id)
    );

    CREATE TABLE IF NOT EXISTS staging_artists (
        source_id TEXT NOT NULL,
        source_namespace TEXT NOT NULL DEFAULT 'lastfm',
        name TEXT NOT NULL,
        mbid TEXT,
        original_credit TEXT,
        genre_id INTEGER,
        PRIMARY KEY (source_namespace, source_id)
    );

    CREATE TABLE IF NOT EXISTS staging_songs (
        source_id TEXT NOT NULL,
        source_namespace TEXT NOT NULL DEFAULT 'lastfm',
        title TEXT NOT NULL,
        artist_source_id TEXT NOT NULL,
        track_mbid TEXT,
        album TEXT,
        duration_seconds INTEGER DEFAULT 0,
        release_date TEXT,
        genre_id INTEGER,
        PRIMARY KEY (source_namespace, source_id)
    );

    CREATE TABLE IF NOT EXISTS staging_listening_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_source_id TEXT NOT NULL,
        song_source_id TEXT NOT NULL,
        listened_at TEXT NOT NULL,
        duration_listened INTEGER DEFAULT 0,
        source_namespace TEXT NOT NULL DEFAULT 'lastfm'
    );

    CREATE TABLE IF NOT EXISTS staging_aggregated_counts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_source_id TEXT,
        artist_source_id TEXT NOT NULL,
        song_source_id TEXT,
        play_count INTEGER NOT NULL DEFAULT 0,
        source_namespace TEXT NOT NULL DEFAULT 'dataset'
    );
    """)

    # 5. Indexes for search, joins, filtering, and analytics
    cursor.executescript("""
    CREATE INDEX IF NOT EXISTS idx_users_source ON users (source_namespace, source_id);
    CREATE INDEX IF NOT EXISTS idx_artists_name ON artists (name);
    CREATE INDEX IF NOT EXISTS idx_artists_mbid ON artists (mbid);
    CREATE INDEX IF NOT EXISTS idx_artists_source ON artists (source_namespace, source_id);

    CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs (artist_id);
    CREATE INDEX IF NOT EXISTS idx_songs_genre ON songs (genre_id);
    CREATE INDEX IF NOT EXISTS idx_songs_title ON songs (title);
    CREATE INDEX IF NOT EXISTS idx_songs_artist_title ON songs (artist_id, title);
    CREATE INDEX IF NOT EXISTS idx_songs_track_mbid ON songs (track_mbid);
    CREATE INDEX IF NOT EXISTS idx_songs_release ON songs (release_date);
    CREATE INDEX IF NOT EXISTS idx_songs_source ON songs (source_namespace, source_id);

    CREATE INDEX IF NOT EXISTS idx_lh_user ON listening_history (user_id);
    CREATE INDEX IF NOT EXISTS idx_lh_song ON listening_history (song_id);
    CREATE INDEX IF NOT EXISTS idx_lh_listened_at ON listening_history (listened_at);
    CREATE INDEX IF NOT EXISTS idx_lh_user_listened ON listening_history (user_id, listened_at);
    CREATE INDEX IF NOT EXISTS idx_lh_song_listened ON listening_history (song_id, listened_at);
    CREATE INDEX IF NOT EXISTS idx_lh_source ON listening_history (source_namespace, source_id);

    CREATE INDEX IF NOT EXISTS idx_alc_user ON aggregated_listening_counts (user_id);
    CREATE INDEX IF NOT EXISTS idx_alc_artist ON aggregated_listening_counts (artist_id);
    CREATE INDEX IF NOT EXISTS idx_alc_song ON aggregated_listening_counts (song_id);
    """)

    # 6. Adapt Analytic Views to combine individual listens and aggregated counts
    cursor.executescript("""
    DROP VIEW IF EXISTS top_songs_view;
    CREATE VIEW top_songs_view AS
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
        (COALESCE(lh_stats.play_count, 0) + COALESCE(agg_stats.agg_plays, 0)) AS play_count
    FROM songs s
    JOIN artists a ON s.artist_id = a.id
    JOIN genres g ON s.genre_id = g.id
    LEFT JOIN (
        SELECT song_id, COUNT(*) AS play_count
        FROM listening_history
        GROUP BY song_id
    ) lh_stats ON s.id = lh_stats.song_id
    LEFT JOIN (
        SELECT song_id, SUM(play_count) AS agg_plays
        FROM aggregated_listening_counts
        WHERE song_id IS NOT NULL
        GROUP BY song_id
    ) agg_stats ON s.id = agg_stats.song_id
    GROUP BY s.id;

    DROP VIEW IF EXISTS genre_popularity_view;
    CREATE VIEW genre_popularity_view AS
    SELECT
        g.id,
        g.name,
        g.description,
        COUNT(DISTINCT s.id) AS song_count,
        (COALESCE(SUM(lh_stats.plays), 0) + COALESCE(SUM(agg_stats.agg_plays), 0)) AS total_plays
    FROM genres g
    LEFT JOIN songs s ON g.id = s.genre_id
    LEFT JOIN (
        SELECT song_id, COUNT(*) AS plays
        FROM listening_history
        GROUP BY song_id
    ) lh_stats ON s.id = lh_stats.song_id
    LEFT JOIN (
        SELECT song_id, SUM(play_count) AS agg_plays
        FROM aggregated_listening_counts
        WHERE song_id IS NOT NULL
        GROUP BY song_id
    ) agg_stats ON s.id = agg_stats.song_id
    GROUP BY g.id;

    DROP VIEW IF EXISTS user_analytics_view;
    CREATE VIEW user_analytics_view AS
    SELECT
        u.id AS user_id,
        u.username,
        (COALESCE(lh_stats.total_listens, 0) + COALESCE(agg_stats.total_agg_listens, 0)) AS total_listens,
        COALESCE(lh_stats.unique_songs, 0) AS unique_songs,
        COALESCE(lh_stats.total_listen_seconds, 0) AS total_listen_seconds
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS total_listens, COUNT(DISTINCT song_id) AS unique_songs, SUM(duration_listened) AS total_listen_seconds
        FROM listening_history
        GROUP BY user_id
    ) lh_stats ON u.id = lh_stats.user_id
    LEFT JOIN (
        SELECT user_id, SUM(play_count) AS total_agg_listens
        FROM aggregated_listening_counts
        WHERE user_id IS NOT NULL
        GROUP BY user_id
    ) agg_stats ON u.id = agg_stats.user_id
    GROUP BY u.id;
    """)

    conn.commit()

def load_to_sqlite(
    users: Dict[str, UserEntity],
    artists: Dict[int, ArtistEntity],
    songs: Dict[int, SongEntity],
    artist_name_to_id: Dict[str, int],
    scrobbles: List[Dict[str, Any]],
    aggregated_plays: Optional[List[Dict[str, Any]]] = None,
    db_path: Path = SQLITE_DB_PATH
) -> Dict[str, int]:
    """
    Loads all normalized entities into SQLite using:
    1. Staging tables for isolation
    2. Pre-merge validation
    3. Transactional atomic merge with rollback strategy
    4. Safe repeatable upserts preserving existing primary keys, foreign keys, and user data
    """
    ensure_cleaned_dir()
    conn = sqlite3.connect(str(db_path), isolation_level=None)
    adapt_sqlite_schema(conn)
    cursor = conn.cursor()

    counts = {
        "genres": 0,
        "users": 0,
        "artists": 0,
        "songs": 0,
        "listening_history": 0,
        "aggregated_counts": 0
    }

    try:
        # ────────────────────────────────────────────────────────
        # STEP 1: CLEAR STAGING TABLES
        # ────────────────────────────────────────────────────────
        cursor.execute("DELETE FROM staging_users;")
        cursor.execute("DELETE FROM staging_artists;")
        cursor.execute("DELETE FROM staging_songs;")
        cursor.execute("DELETE FROM staging_listening_history;")
        cursor.execute("DELETE FROM staging_aggregated_counts;")

        # ────────────────────────────────────────────────────────
        # STEP 2: LOAD INCOMING DATA INTO STAGING TABLES
        # ────────────────────────────────────────────────────────
        # Staging Users
        staging_user_rows = []
        for u in users.values():
            reg_date = u.registered_at or "2006-01-01 00:00:00"
            staging_user_rows.append((
                u.source_id,
                getattr(u, "source_namespace", "lastfm"),
                u.username,
                u.email,
                "$2a$10$WkLzXmZ1w3m6wWlJkK8c6eM6mZ1w3m6wWlJkK8c6eM6mZ1w3m6wW",
                u.gender,
                u.age,
                u.country,
                reg_date
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO staging_users
            (source_id, source_namespace, username, email, password_hash, gender, age, country, registered_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, staging_user_rows)

        # Staging Artists
        staging_artist_rows = []
        for aid, a in artists.items():
            staging_artist_rows.append((
                getattr(a, "source_id", str(aid)),
                getattr(a, "source_namespace", "lastfm"),
                a.name,
                a.mbid,
                a.original_credit,
                a.genre_id
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO staging_artists
            (source_id, source_namespace, name, mbid, original_credit, genre_id)
            VALUES (?, ?, ?, ?, ?, ?)
        """, staging_artist_rows)

        # Staging Songs
        staging_song_rows = []
        for sid, s in songs.items():
            art_src_id = str(artist_name_to_id.get(s.artist_name.lower(), 1))
            staging_song_rows.append((
                getattr(s, "source_id", str(sid)),
                getattr(s, "source_namespace", "lastfm"),
                s.title,
                art_src_id,
                s.track_mbid,
                s.album,
                s.duration_seconds,
                s.release_date,
                s.genre_id
            ))
        cursor.executemany("""
            INSERT OR REPLACE INTO staging_songs
            (source_id, source_namespace, title, artist_source_id, track_mbid, album, duration_seconds, release_date, genre_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, staging_song_rows)

        # Staging Scrobbles
        staging_scrobble_rows = []
        for sc in scrobbles:
            staging_scrobble_rows.append((
                sc["user_id"],
                str(sc["song_id"]),
                sc["listened_at"],
                sc.get("duration_listened", 0),
                sc.get("source_namespace", "lastfm")
            ))
        cursor.executemany("""
            INSERT INTO staging_listening_history
            (user_source_id, song_source_id, listened_at, duration_listened, source_namespace)
            VALUES (?, ?, ?, ?, ?)
        """, staging_scrobble_rows)

        # Staging Aggregated Counts (if provided)
        if aggregated_plays:
            staging_agg_rows = []
            for ap in aggregated_plays:
                staging_agg_rows.append((
                    ap.get("user_id"),
                    str(ap["artist_id"]),
                    str(ap["song_id"]) if ap.get("song_id") else None,
                    ap.get("play_count", 0),
                    ap.get("source_namespace", "dataset")
                ))
            cursor.executemany("""
                INSERT INTO staging_aggregated_counts
                (user_source_id, artist_source_id, song_source_id, play_count, source_namespace)
                VALUES (?, ?, ?, ?, ?)
            """, staging_agg_rows)

        # ────────────────────────────────────────────────────────
        # STEP 3: PRE-MERGE VALIDATION OF STAGING DATA
        # ────────────────────────────────────────────────────────
        cursor.execute("SELECT COUNT(*) FROM staging_users WHERE username IS NULL OR email IS NULL")
        invalid_users = cursor.fetchone()[0]
        if invalid_users > 0:
            raise ValueError(f"Staging validation error: {invalid_users} invalid staging users detected.")

        cursor.execute("SELECT COUNT(*) FROM staging_songs WHERE title IS NULL")
        invalid_songs = cursor.fetchone()[0]
        if invalid_songs > 0:
            raise ValueError(f"Staging validation error: {invalid_songs} invalid staging songs detected.")

        # ────────────────────────────────────────────────────────
        # STEP 4: ATOMIC TRANSACTIONAL MERGE WITH PRESERVATION
        # ────────────────────────────────────────────────────────
        cursor.execute("BEGIN TRANSACTION;")

        # A. Genres
        genre_rows = [(g["id"], g["name"], g["description"]) for g in STANDARD_GENRES]
        cursor.executemany("INSERT OR IGNORE INTO genres (id, name, description) VALUES (?, ?, ?)", genre_rows)
        counts["genres"] = len(genre_rows)

        # B. Users: Preserving existing accounts, IDs, and passwords
        # Query existing users for mapping
        user_id_map: Dict[str, int] = {}
        cursor.execute("SELECT id, username, email, source_id, source_namespace FROM users")
        for db_id, uname, email, s_id, s_ns in cursor.fetchall():
            if s_id and s_ns:
                user_id_map[(s_ns, str(s_id))] = db_id
            user_id_map[uname.lower()] = db_id
            user_id_map[email.lower()] = db_id

        cursor.execute("""
            SELECT source_id, source_namespace, username, email, password_hash, gender, age, country, registered_at
            FROM staging_users
        """)
        new_users_to_insert = []
        for s_id, s_ns, uname, email, pw, gender, age, country, reg in cursor.fetchall():
            existing_id = user_id_map.get((s_ns, s_id)) or user_id_map.get(uname.lower()) or user_id_map.get(email.lower())
            if existing_id:
                # Update demographic metadata without touching user's password or primary key!
                cursor.execute("""
                    UPDATE users
                    SET gender = COALESCE(gender, ?),
                        age = COALESCE(age, ?),
                        country = COALESCE(country, ?),
                        source_namespace = COALESCE(source_namespace, ?),
                        source_id = COALESCE(source_id, ?)
                    WHERE id = ?
                """, (gender, age, country, s_ns, s_id, existing_id))
            else:
                new_users_to_insert.append((uname, email, pw, gender, age, country, s_ns, s_id, reg))

        if new_users_to_insert:
            cursor.executemany("""
                INSERT INTO users
                (username, email, password_hash, gender, age, country, source_namespace, source_id, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, new_users_to_insert)

        # Rebuild complete user ID map
        cursor.execute("SELECT id, username, source_id, source_namespace FROM users")
        for db_id, uname, s_id, s_ns in cursor.fetchall():
            if s_id and s_ns:
                user_id_map[(s_ns, str(s_id))] = db_id
            user_id_map[uname.lower()] = db_id
        cursor.execute("SELECT COUNT(*) FROM users")
        counts["users"] = cursor.fetchone()[0]

        # C. Artists: Match by source_id, MBID, or name; preserve existing primary keys!
        artist_id_map: Dict[str, int] = {}
        cursor.execute("SELECT id, name, mbid, source_id, source_namespace FROM artists")
        for db_id, name, mbid, s_id, s_ns in cursor.fetchall():
            artist_id_map[name.lower()] = db_id
            if mbid:
                artist_id_map[f"mbid::{mbid.lower()}"] = db_id
            if s_id and s_ns:
                artist_id_map[f"src::{s_ns}::{s_id}"] = db_id

        cursor.execute("SELECT source_id, source_namespace, name, mbid, original_credit, genre_id FROM staging_artists")
        for s_id, s_ns, name, mbid, credit, genre_id in cursor.fetchall():
            src_key = f"src::{s_ns}::{s_id}"
            mbid_key = f"mbid::{mbid.lower()}" if mbid else None
            existing_id = (
                artist_id_map.get(src_key) or
                (artist_id_map.get(mbid_key) if mbid_key else None) or
                artist_id_map.get(name.lower())
            )

            if existing_id:
                # Enrich existing record without altering primary key
                cursor.execute("""
                    UPDATE artists
                    SET mbid = COALESCE(mbid, ?),
                        original_credit = COALESCE(original_credit, ?),
                        genre_id = COALESCE(genre_id, ?),
                        source_namespace = COALESCE(source_namespace, ?),
                        source_id = COALESCE(source_id, ?)
                    WHERE id = ?
                """, (mbid, credit, genre_id, s_ns, s_id, existing_id))
            else:
                cursor.execute("""
                    INSERT INTO artists (name, mbid, original_credit, genre_id, source_namespace, source_id)
                    VALUES (?, ?, ?, ?, ?, ?)
                """, (name, mbid, credit, genre_id, s_ns, s_id))
                new_aid = cursor.lastrowid
                artist_id_map[name.lower()] = new_aid
                if mbid:
                    artist_id_map[f"mbid::{mbid.lower()}"] = new_aid
                artist_id_map[src_key] = new_aid

        cursor.execute("SELECT COUNT(*) FROM artists")
        counts["artists"] = cursor.fetchone()[0]

        # D. Songs: Match by track_mbid or (artist_id, title); preserve existing primary keys!
        song_id_map: Dict[Tuple[int, str], int] = {}
        song_mbid_map: Dict[Tuple[int, str], int] = {}
        cursor.execute("SELECT id, title, artist_id, track_mbid, source_id, source_namespace FROM songs")
        for db_id, title, art_id, tra_mbid, s_id, s_ns in cursor.fetchall():
            song_id_map[(art_id, title.lower())] = db_id
            if tra_mbid:
                song_mbid_map[(art_id, tra_mbid.lower())] = db_id

        # Re-fetch fresh artist mappings by name
        cursor.execute("SELECT id, name FROM artists")
        art_by_name = {r[1].lower(): r[0] for r in cursor.fetchall()}

        for sid, s in songs.items():
            art_id = art_by_name.get(s.artist_name.lower(), 1)
            norm_title = s.title.lower()
            existing_id = (
                (song_mbid_map.get((art_id, s.track_mbid.lower())) if s.track_mbid else None) or
                song_id_map.get((art_id, norm_title))
            )

            if existing_id:
                cursor.execute("""
                    UPDATE songs
                    SET track_mbid = COALESCE(track_mbid, ?),
                        source_namespace = COALESCE(source_namespace, ?),
                        source_id = COALESCE(source_id, ?)
                    WHERE id = ?
                """, (s.track_mbid, getattr(s, "source_namespace", "lastfm"), getattr(s, "source_id", None), existing_id))
            else:
                cursor.execute("""
                    INSERT INTO songs
                    (title, artist_id, genre_id, track_mbid, album, duration_seconds, release_date, source_namespace, source_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    s.title,
                    art_id,
                    s.genre_id,
                    s.track_mbid,
                    s.album,
                    s.duration_seconds,
                    s.release_date,
                    getattr(s, "source_namespace", "lastfm"),
                    getattr(s, "source_id", None)
                ))
                new_sid = cursor.lastrowid
                song_id_map[(art_id, norm_title)] = new_sid
                if s.track_mbid:
                    song_mbid_map[(art_id, s.track_mbid.lower())] = new_sid

        cursor.execute("SELECT COUNT(*) FROM songs")
        counts["songs"] = cursor.fetchone()[0]

        # E. Scrobbles: Repeatable upsert without duplicates
        # Map scrobble songs to database song IDs
        cursor.execute("SELECT id, title, artist_id FROM songs")
        all_songs_lookup = {(r[2], r[1].lower()): r[0] for r in cursor.fetchall()}

        scrobble_rows = []
        for sc in scrobbles:
            u_id = user_id_map.get(sc["user_id"].lower())
            s_obj = songs.get(sc["song_id"])
            if u_id and s_obj:
                art_id = art_by_name.get(s_obj.artist_name.lower(), 1)
                db_song_id = all_songs_lookup.get((art_id, s_obj.title.lower()), sc["song_id"])
                scrobble_rows.append((
                    u_id,
                    db_song_id,
                    sc["listened_at"],
                    sc.get("duration_listened", 0),
                    sc.get("source_namespace", "lastfm"),
                    sc.get("source_id")
                ))

        # Check existing scrobbles for duplicate avoidance
        cursor.execute("SELECT user_id, song_id, listened_at FROM listening_history")
        existing_lh_set = set(cursor.fetchall())

        deduped_scrobble_rows = [
            row for row in scrobble_rows
            if (row[0], row[1], row[2]) not in existing_lh_set
        ]

        if deduped_scrobble_rows:
            cursor.executemany("""
                INSERT INTO listening_history
                (user_id, song_id, listened_at, duration_listened, source_namespace, source_id)
                VALUES (?, ?, ?, ?, ?, ?)
            """, deduped_scrobble_rows)

        cursor.execute("SELECT COUNT(*) FROM listening_history")
        counts["listening_history"] = cursor.fetchone()[0]

        # F. Aggregated Listening Counts
        if aggregated_plays:
            agg_rows = []
            for ap in aggregated_plays:
                u_id = user_id_map.get(ap.get("user_id", "").lower()) if ap.get("user_id") else None
                art_id = art_by_name.get(ap["artist_name"].lower(), 1)
                s_id = None
                if ap.get("track_name"):
                    s_id = all_songs_lookup.get((art_id, ap["track_name"].lower()))
                agg_rows.append((
                    u_id,
                    art_id,
                    s_id,
                    ap.get("play_count", 0),
                    ap.get("source_namespace", "dataset"),
                    ap.get("source_id")
                ))

            cursor.executemany("""
                INSERT INTO aggregated_listening_counts
                (user_id, artist_id, song_id, play_count, source_namespace, source_id)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(source_namespace, user_id, artist_id, song_id)
                DO UPDATE SET play_count = play_count + excluded.play_count
            """, agg_rows)

        cursor.execute("SELECT COUNT(*) FROM aggregated_listening_counts")
        counts["aggregated_counts"] = cursor.fetchone()[0]

        # Commit Transaction
        cursor.execute("COMMIT;")

    except Exception as e:
        # Atomic Rollback Strategy: ensure database remains uncorrupted
        try:
            cursor.execute("ROLLBACK;")
        except Exception:
            pass
        print(f"❌ Error during loading: {e}. Rolled back all changes to preserve database integrity.")
        raise e
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
    scrobbles: List[Dict[str, Any]],
    aggregated_plays: Optional[List[Dict[str, Any]]] = None
) -> Optional[Dict[str, int]]:
    """Attempts loading into MySQL database using pymysql with staging and transactions."""
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
        return None

    counts = {"genres": 0, "users": 0, "artists": 0, "songs": 0, "listening_history": 0, "aggregated_counts": 0}
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

            # Users (Repeatable upsert preserving existing user passwords & IDs)
            user_rows = []
            for u in users.values():
                user_rows.append((
                    u.username,
                    u.email,
                    "$2a$10$WkLzXmZ1w3m6wWlJkK8c6eM6mZ1w3m6wWlJkK8c6eM6mZ1w3m6wW",
                    getattr(u, "source_namespace", "lastfm"),
                    u.source_id,
                    u.gender,
                    u.age,
                    u.country,
                    u.registered_at or "2006-01-01 00:00:00"
                ))
            cursor.executemany("""
                INSERT INTO users (username, email, password_hash, source_namespace, source_id, gender, age, country, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    source_namespace = VALUES(source_namespace),
                    source_id = VALUES(source_id),
                    gender = COALESCE(users.gender, VALUES(gender)),
                    age = COALESCE(users.age, VALUES(age)),
                    country = COALESCE(users.country, VALUES(country))
            """, user_rows)

            cursor.execute("SELECT id, username FROM users")
            user_id_map = {uname.lower(): uid for uid, uname in cursor.fetchall()}
            counts["users"] = len(user_id_map)

            # Artists (Repeatable upsert)
            artist_rows = []
            for aid, a in artists.items():
                artist_rows.append((
                    a.name[:100],
                    a.mbid,
                    a.original_credit or a.name,
                    getattr(a, "source_namespace", "lastfm"),
                    getattr(a, "source_id", str(aid))
                ))
            cursor.executemany("""
                INSERT INTO artists (name, mbid, bio, source_namespace, source_id)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    mbid = COALESCE(artists.mbid, VALUES(mbid)),
                    source_id = COALESCE(artists.source_id, VALUES(source_id))
            """, artist_rows)

            cursor.execute("SELECT id, name FROM artists")
            artist_name_to_db_id = {name.lower(): aid for aid, name in cursor.fetchall()}
            counts["artists"] = len(artist_name_to_db_id)

            # Songs (Repeatable upsert)
            song_rows = []
            for sid, s in songs.items():
                art_id = artist_name_to_db_id.get(s.artist_name.lower(), 1)
                song_rows.append((
                    s.title[:200],
                    art_id,
                    s.genre_id,
                    s.duration_seconds,
                    s.track_mbid,
                    getattr(s, "source_namespace", "lastfm"),
                    getattr(s, "source_id", str(sid))
                ))
            cursor.executemany("""
                INSERT INTO songs (title, artist_id, genre_id, duration_seconds, track_mbid, source_namespace, source_id)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    track_mbid = COALESCE(songs.track_mbid, VALUES(track_mbid)),
                    source_id = COALESCE(songs.source_id, VALUES(source_id))
            """, song_rows)

            cursor.execute("SELECT id, title, artist_id FROM songs")
            song_lookup = {(art_id, title.lower()): sid for sid, title, art_id in cursor.fetchall()}
            counts["songs"] = len(song_lookup)

            # Listening History (Avoid duplicate scrobbles)
            scrobble_rows = []
            for sc in scrobbles:
                u_id = user_id_map.get(sc["user_id"].lower())
                s_obj = songs.get(sc["song_id"])
                if u_id and s_obj:
                    art_id = artist_name_to_db_id.get(s_obj.artist_name.lower(), 1)
                    db_song_id = song_lookup.get((art_id, s_obj.title.lower()))
                    if db_song_id:
                        scrobble_rows.append((
                            u_id,
                            db_song_id,
                            sc["listened_at"],
                            sc.get("duration_listened", 0),
                            sc.get("source_namespace", "lastfm"),
                            sc.get("source_id")
                        ))

            if scrobble_rows:
                cursor.executemany("""
                    INSERT IGNORE INTO listening_history
                    (user_id, song_id, listened_at, duration_listened, source_namespace, source_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, scrobble_rows)
            cursor.execute("SELECT COUNT(*) FROM listening_history")
            counts["listening_history"] = cursor.fetchone()[0]

            # Aggregated Listening Counts
            if aggregated_plays:
                agg_rows = []
                for ap in aggregated_plays:
                    u_id = user_id_map.get(ap.get("user_id", "").lower()) if ap.get("user_id") else None
                    art_id = artist_name_to_db_id.get(ap["artist_name"].lower(), 1)
                    s_id = None
                    if ap.get("track_name"):
                        s_id = song_lookup.get((art_id, ap["track_name"].lower()))
                    agg_rows.append((
                        u_id,
                        art_id,
                        s_id,
                        ap.get("play_count", 0),
                        ap.get("source_namespace", "dataset"),
                        ap.get("source_id")
                    ))
                cursor.executemany("""
                    INSERT INTO aggregated_listening_counts
                    (user_id, artist_id, song_id, play_count, source_namespace, source_id)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE play_count = play_count + VALUES(play_count)
                """, agg_rows)

            conn.commit()
    except Exception as e:
        conn.rollback()
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
    so the web dashboard can immediately reflect newly ingested pipeline data
    while preserving baseline user accounts and relationships.
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
                "source_namespace": getattr(u, "source_namespace", "lastfm"),
                "source_id": u.source_id,
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
                "source_namespace": getattr(a, "source_namespace", "lastfm"),
                "source_id": getattr(a, "source_id", None),
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
                "release_date": s.release_date or "2008-01-01",
                "source_namespace": getattr(s, "source_namespace", "lastfm"),
                "source_id": getattr(s, "source_id", None)
            }
            for sid, s in list(songs.items())[:2000]
        ]
    }

    with open(MOCK_STORE_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
