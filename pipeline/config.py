"""
ETL Pipeline Configuration
Handles paths, database credentials, validation thresholds, and chunking parameters.
"""
from pathlib import Path
import os
import re

# Base paths
PIPELINE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = PIPELINE_DIR.parent

# Raw data source paths
DATASET_DIR = PROJECT_ROOT / "lastfm-dataset-1K" / "lastfm-dataset-1K"
RAW_PROFILES_FILE = DATASET_DIR / "userid-profile.tsv"
RAW_LISTENING_FILE = DATASET_DIR / "userid-timestamp-artid-artname-traid-traname.tsv"

# Intermediate cleaned data paths (Clear separation: Raw -> Cleaned Intermediate -> Database)
DATA_DIR = PROJECT_ROOT / "data"
CLEANED_DIR = DATA_DIR / "cleaned"
USERS_CLEANED_FILE = CLEANED_DIR / "users.jsonl"
ARTISTS_CLEANED_FILE = CLEANED_DIR / "artists.jsonl"
GENRES_CLEANED_FILE = CLEANED_DIR / "genres.jsonl"
SONGS_CLEANED_FILE = CLEANED_DIR / "songs.jsonl"
LISTENING_CLEANED_FILE = CLEANED_DIR / "listening_history.jsonl"
REJECTED_RECORDS_FILE = CLEANED_DIR / "rejected_records.jsonl"
METRICS_FILE = CLEANED_DIR / "pipeline_metrics.json"

# Target Database paths
SQLITE_DB_PATH = DATA_DIR / "music_analytics.sqlite"
MOCK_STORE_JSON_PATH = PROJECT_ROOT / "Backend" / "db" / "importedData.json"

# Load database settings from Backend/.env if available
def load_env_file(filepath: Path):
    config = {}
    if filepath.is_file():
        with open(filepath, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    config[k.strip()] = v.strip().strip("'\"")
    return config

ENV_CONFIG = load_env_file(PROJECT_ROOT / "Backend" / ".env")

DB_HOST = os.getenv("DB_HOST", ENV_CONFIG.get("DB_HOST", "localhost"))
DB_PORT = int(os.getenv("DB_PORT", ENV_CONFIG.get("DB_PORT", "3306")))
DB_USER = os.getenv("DB_USER", ENV_CONFIG.get("DB_USER", "root"))
DB_PASSWORD = os.getenv("DB_PASSWORD", ENV_CONFIG.get("DB_PASSWORD", ""))
DB_NAME = os.getenv("DB_NAME", ENV_CONFIG.get("DB_NAME", "music_analytics"))

# Validation parameters & thresholds
MIN_AGE = 5
MAX_AGE = 120
ALLOWED_GENDERS = {"m", "f"}

# Regex for UUID v4 / hex formats
UUID_REGEX = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$",
    re.IGNORECASE
)

# Standard Genre Taxonomy
STANDARD_GENRES = [
    {"id": 1, "name": "Pop", "description": "Popular mainstream music with catchy melodies"},
    {"id": 2, "name": "Rock", "description": "Guitar-driven music with powerful rhythms"},
    {"id": 3, "name": "Hip-Hop", "description": "Rhythmic music with spoken-word vocals"},
    {"id": 4, "name": "R&B", "description": "Rhythm and blues with soulful vocals"},
    {"id": 5, "name": "Electronic", "description": "Synthesizer-based music and beats"},
    {"id": 6, "name": "Jazz", "description": "Improvisational music with complex harmonies"},
    {"id": 7, "name": "Classical", "description": "Orchestral and composed instrumental music"},
    {"id": 8, "name": "Country", "description": "Story-driven music with acoustic instruments"},
    {"id": 9, "name": "Indie", "description": "Independent alternative music"},
    {"id": 10, "name": "Metal", "description": "Heavy, amplified rock music"},
]

# Processing limits & chunk defaults
DEFAULT_CHUNK_SIZE = 50000
DEFAULT_DEV_LIMIT = 100000  # Default scrobbles to process for standard run (use --limit 0 for full 19M)
PROGRESS_INTERVAL = 25000
