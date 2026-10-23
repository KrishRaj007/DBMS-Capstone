"""
Stage 4: Transform Module
Transforms cleaned raw inputs into structured domain entities:
Users, Artists, Genres, Songs, Scrobbles, and Aggregated Listening Counts.
Enriches with provenance tracking, source namespaces, and source identifiers to prevent ID collisions.
"""
from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
from typing import List, Optional, Dict, Any, Tuple
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
    source_namespace: str = "lastfm"

@dataclass
class ArtistEntity:
    name: str
    mbid: Optional[str]
    original_credit: str
    collaborators: List[str]
    genre_id: int
    provenance: Dict[str, Any]
    source_namespace: str = "lastfm"
    source_id: Optional[str] = None

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
    source_namespace: str = "lastfm"
    source_id: Optional[str] = None

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
    source_namespace: str = "lastfm"
    source_id: Optional[str] = None

@dataclass
class AggregatedPlayEntity:
    artist_name: str
    play_count: int
    user_id: Optional[str] = None
    artist_mbid: Optional[str] = None
    track_name: Optional[str] = None
    track_mbid: Optional[str] = None
    genre_id: Optional[int] = None
    source_namespace: str = "dataset"
    source_id: Optional[str] = None
    provenance: Dict[str, Any] = field(default_factory=dict)

def transform_profile_entity(sanitized: Dict[str, Any], source_file: str, line_number: int) -> UserEntity:
    """
    Transforms validated profile attributes into a UserEntity with source provenance and namespace.
    """
    uid = sanitized["user_id"]
    reg_clean = clean_date_string(sanitized.get("registered"))
    country_clean = normalize_text(sanitized.get("country"))

    provenance = {
        "source_system": "lastfm-dataset-1k",
        "source_file": source_file,
        "source_line": line_number,
        "extracted_at": datetime.now(timezone.utc).isoformat()
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
        source_namespace="lastfm",
        provenance=provenance
    )

def transform_scrobble_entity(
    sanitized: Dict[str, Any],
    source_file: str,
    line_number: int
) -> Tuple[ArtistEntity, SongEntity, ScrobbleEntity]:
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

    # Deterministic source IDs to avoid collisions across multiple data imports
    artist_source_id = art_mbid if art_mbid else hashlib.md5(credit.primary_artist.lower().encode("utf-8")).hexdigest()
    song_source_id = tra_mbid if tra_mbid else hashlib.md5(f"{credit.primary_artist}::{tra_title}".lower().encode("utf-8")).hexdigest()
    scrobble_source_id = hashlib.md5(f"{uid}::{ts_clean}::{song_source_id}".encode("utf-8")).hexdigest()

    artist_entity = ArtistEntity(
        name=credit.primary_artist,
        mbid=art_mbid,
        original_credit=credit.original_credit,
        collaborators=credit.collaborators,
        genre_id=genre_id,
        source_namespace="lastfm",
        source_id=artist_source_id,
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
        source_namespace="lastfm",
        source_id=song_source_id,
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
        source_namespace="lastfm",
        source_id=scrobble_source_id,
        provenance=provenance
    )

    return artist_entity, song_entity, scrobble_entity

def transform_aggregated_play_entity(
    sanitized: Dict[str, Any],
    source_file: str,
    line_number: int,
    source_namespace: str = "dataset"
) -> AggregatedPlayEntity:
    """
    Transforms aggregated listening count records (e.g. <user, artist, play_count>)
    without fabricating timestamps, fake user identities, or synthetic completion sessions.
    """
    artist_name = sanitized["artist_name"]
    play_count = int(sanitized["play_count"])
    user_id = sanitized.get("user_id")
    art_mbid = sanitized.get("artist_mbid")
    track_name = sanitized.get("track_name")
    track_mbid = sanitized.get("track_mbid")

    genre_id = infer_genre_id(artist_name, track_name)

    provenance = {
        "source_system": source_namespace,
        "source_file": source_file,
        "source_line": line_number,
        "aggregated": True
    }

    source_id = hashlib.md5(
        f"{user_id or ''}::{artist_name}::{track_name or ''}".lower().encode("utf-8")
    ).hexdigest()

    return AggregatedPlayEntity(
        artist_name=artist_name,
        play_count=play_count,
        user_id=user_id,
        artist_mbid=art_mbid,
        track_name=track_name,
        track_mbid=track_mbid,
        genre_id=genre_id,
        source_namespace=source_namespace,
        source_id=source_id,
        provenance=provenance
    )
