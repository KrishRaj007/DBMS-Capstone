"""
Stage 4: Transform Module
Transforms cleaned raw inputs into structured domain entities:
Users, Artists, Genres, Songs, and Scrobbles.
Enriches with provenance tracking and assigns deterministic relational identifiers.
"""
from dataclasses import dataclass, field, asdict
from datetime import datetime
import hashlib
from typing import List, Optional, Dict, Any
from pipeline.clean import (
    normalize_text,
    clean_date_string,
    clean_timestamp_string,
    parse_artist_credit,
    clean_track_title
)
from pipeline.config import STANDARD_GENRES

# Genre matching keywords for mapping artists into the 10 standard database genres
GENRE_KEYWORDS = {
    1: ["pop", "disco", "dance", "synth", "euro", "idol"],          # Pop
    2: ["rock", "grunge", "punk", "guitar", "classic", "blues"],    # Rock
    3: ["hip-hop", "rap", "trap", "beats", "rhyme", "flow"],        # Hip-Hop
    4: ["r&b", "soul", "funk", "gospel", "motown", "groove"],       # R&B
    5: ["electro", "dj", "techno", "house", "trance", "ambient", "dubstep"], # Electronic
    6: ["jazz", "sax", "swing", "bebop", "brass", "fusion"],        # Jazz
    7: ["orchestra", "symphony", "philharmonic", "sonata", "concerto", "piano", "classical"], # Classical
    8: ["country", "acoustic", "folk", "bluegrass", "americana"],   # Country
    9: ["indie", "alternative", "dream", "shoegaze", "lo-fi"],      # Indie
    10: ["metal", "heavy", "thrash", "death", "doom", "black"]       # Metal
}

def infer_genre_id(artist_name: str, track_name: Optional[str] = None) -> int:
    """
    Infers the most appropriate genre ID (1-10) from artist and track metadata,
    defaulting deterministically based on name hashing if no keywords match.
    """
    text = f"{artist_name} {track_name or ''}".lower()
    for gid, kws in GENRE_KEYWORDS.items():
        if any(kw in text for kw in kws):
            return gid

    # Deterministic fallback between genres 1-10 using hash
    h = int(hashlib.md5(artist_name.encode("utf-8")).hexdigest(), 16)
    return (h % len(STANDARD_GENRES)) + 1

@dataclass
class UserEntity:
    user_id: str
    username: str
    email: str
    gender: Optional[str]
    age: Optional[int]
    country: Optional[str]
    registered_at: Optional[str]
    source_id: str
    provenance: Dict[str, Any]

@dataclass
class ArtistEntity:
    name: str
    mbid: Optional[str]
    original_credit: str
    collaborators: List[str]
    genre_id: int
    provenance: Dict[str, Any]

@dataclass
class SongEntity:
    title: str
    artist_name: str
    artist_mbid: Optional[str]
    track_mbid: Optional[str]
    album: Optional[str]
    duration_seconds: int
    release_date: Optional[str]
    genre_id: int
    provenance: Dict[str, Any]

@dataclass
class ScrobbleEntity:
    user_id: str
    timestamp: str
    artist_name: str
    artist_mbid: Optional[str]
    track_name: str
    track_mbid: Optional[str]
    duration_listened: int
    provenance: Dict[str, Any]

def transform_profile_entity(sanitized: Dict[str, Any], source_file: str, line_number: int) -> UserEntity:
    """
    Transforms validated profile attributes into a UserEntity with source provenance.
    """
    uid = sanitized["user_id"]
    reg_clean = clean_date_string(sanitized.get("registered"))
    country_clean = normalize_text(sanitized.get("country"))

    provenance = {
        "source_system": "lastfm-dataset-1k",
        "source_file": source_file,
        "source_line": line_number,
        "extracted_at": datetime.utcnow().isoformat() + "Z"
    }

    return UserEntity(
        user_id=uid,
        username=uid,
        email=f"{uid.lower()}@lastfm.local",
        gender=sanitized.get("gender"),
        age=sanitized.get("age"),
        country=country_clean,
        registered_at=reg_clean,
        source_id=uid,
        provenance=provenance
    )

def transform_scrobble_entity(sanitized: Dict[str, Any], source_file: str, line_number: int) -> Tuple[ArtistEntity, SongEntity, ScrobbleEntity]:
    """
    Transforms validated scrobble attributes into ArtistEntity, SongEntity, and ScrobbleEntity.
    """
    uid = sanitized["user_id"]
    ts_clean = clean_timestamp_string(sanitized["timestamp"]) or sanitized["timestamp"]

    # Artist credits
    credit = parse_artist_credit(sanitized.get("artist_name"))
    art_mbid = sanitized.get("artist_mbid")
    tra_mbid = sanitized.get("track_mbid")
    tra_title = clean_track_title(sanitized.get("track_name"))

    genre_id = infer_genre_id(credit.primary_artist, tra_title)

    provenance = {
        "source_system": "lastfm-dataset-1k",
        "source_file": source_file,
        "source_line": line_number,
        "scrobble_utc": ts_clean
    }

    artist_entity = ArtistEntity(
        name=credit.primary_artist,
        mbid=art_mbid,
        original_credit=credit.original_credit,
        collaborators=credit.collaborators,
        genre_id=genre_id,
        provenance=provenance
    )

    song_entity = SongEntity(
        title=tra_title,
        artist_name=credit.primary_artist,
        artist_mbid=art_mbid,
        track_mbid=tra_mbid,
        album=None,                 # No album in Last.fm raw TSV; do not invent values
        duration_seconds=0,         # No duration in raw scrobbles
        release_date=None,          # No release date in raw TSV
        genre_id=genre_id,
        provenance=provenance
    )

    scrobble_entity = ScrobbleEntity(
        user_id=uid,
        timestamp=ts_clean,
        artist_name=credit.primary_artist,
        artist_mbid=art_mbid,
        track_name=tra_title,
        track_mbid=tra_mbid,
        duration_listened=0,
        provenance=provenance
    )

    return artist_entity, song_entity, scrobble_entity
