"""
Stage 5: Deduplicate Module
Deterministic, reliable entity deduplication using documented matching rules.
Guarantees:
- Never merges songs across different artists merely because their titles match.
- Avoids destructive fuzzy deduplication (preserves distinct live/acoustic/remix versions).
- Enriches existing artists/tracks when a MusicBrainz ID becomes available (updated count).
- Skips duplicate scrobbles with identical (user_id, timestamp, song_id) (skipped count).
"""
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional, Set, Any, List
from pipeline.transform import UserEntity, ArtistEntity, SongEntity, ScrobbleEntity

@dataclass
class DeduplicationStats:
    users_accepted: int = 0
    users_skipped_duplicate: int = 0
    artists_created: int = 0
    artists_updated_mbid: int = 0
    artists_reused: int = 0
    songs_created: int = 0
    songs_updated_mbid: int = 0
    songs_reused: int = 0
    scrobbles_accepted: int = 0
    scrobbles_skipped_duplicate: int = 0

class DeduplicationEngine:
    """
    Maintains in-memory canonical lookup registries for chunked and streaming ETL.
    """
    def __init__(self):
        self.stats = DeduplicationStats()

        # Users registry: user_id -> UserEntity
        self.users: Dict[str, UserEntity] = {}

        # Artists registry
        # artist_id -> ArtistEntity
        self.artists_by_id: Dict[int, ArtistEntity] = {}
        # mbid -> artist_id
        self.artist_mbid_to_id: Dict[str, int] = {}
        # normalized lowercase name -> artist_id
        self.artist_name_to_id: Dict[str, int] = {}
        self._next_artist_id: int = 1

        # Songs registry
        # song_id -> SongEntity
        self.songs_by_id: Dict[int, SongEntity] = {}
        # (artist_id, track_mbid) -> song_id
        self.song_mbid_to_id: Dict[Tuple[int, str], int] = {}
        # (artist_id, normalized_lowercase_title) -> song_id
        self.song_title_to_id: Dict[Tuple[int, str], int] = {}
        self._next_song_id: int = 1

        # Scrobbles deduplication key set: (user_id, timestamp, song_id)
        # Using a bounded or set-based registry
        self.seen_scrobbles: Set[Tuple[str, str, int]] = set()

    def process_user(self, user: UserEntity) -> Tuple[bool, UserEntity]:
        """
        Deduplicates user profiles.
        Rule: Unique by user_id. First valid profile preserved; subsequent duplicates skipped.
        """
        uid = user.user_id.lower()
        if uid in self.users:
            self.stats.users_skipped_duplicate += 1
            return False, self.users[uid]

        self.users[uid] = user
        self.stats.users_accepted += 1
        return True, user

    def process_artist(self, artist: ArtistEntity) -> Tuple[int, ArtistEntity]:
        """
        Deduplicates artists using documented matching rules:
        1. If MBID is present, lookup by MBID.
        2. Lookup by normalized lowercase name.
        3. If existing artist has no MBID but current record has one, enrich existing record (updated).
        """
        norm_name = artist.name.lower()
        art_id: Optional[int] = None

        if artist.mbid:
            art_id = self.artist_mbid_to_id.get(artist.mbid.lower())

        if art_id is None:
            art_id = self.artist_name_to_id.get(norm_name)

        if art_id is not None:
            # Existing artist found
            existing = self.artists_by_id[art_id]
            # Check if we can enrich missing MBID
            if not existing.mbid and artist.mbid:
                existing.mbid = artist.mbid.lower()
                self.artist_mbid_to_id[existing.mbid] = art_id
                self.stats.artists_updated_mbid += 1
            # Merge collaborators if new ones appear
            for col in artist.collaborators:
                if col not in existing.collaborators:
                    existing.collaborators.append(col)
            self.stats.artists_reused += 1
            return art_id, existing

        # New Artist
        art_id = self._next_artist_id
        self._next_artist_id += 1

        self.artists_by_id[art_id] = artist
        self.artist_name_to_id[norm_name] = art_id
        if artist.mbid:
            self.artist_mbid_to_id[artist.mbid.lower()] = art_id

        self.stats.artists_created += 1
        return art_id, artist

    def process_song(self, song: SongEntity, artist_id: int) -> Tuple[int, SongEntity]:
        """
        Deduplicates songs using documented matching rules:
        Strict rule: Do not merge different songs merely because their titles match.
        Matching is scoped to the specific artist (artist_id).
        1. If track_mbid present: lookup (artist_id, track_mbid).
        2. Fallback: lookup (artist_id, normalized_lowercase_title).
        3. If existing song lacks MBID and incoming record has it: enrich (updated).
        """
        norm_title = song.title.lower()
        song_id: Optional[int] = None

        if song.track_mbid:
            song_id = self.song_mbid_to_id.get((artist_id, song.track_mbid.lower()))

        if song_id is None:
            song_id = self.song_title_to_id.get((artist_id, norm_title))

        if song_id is not None:
            # Existing song found
            existing = self.songs_by_id[song_id]
            if not existing.track_mbid and song.track_mbid:
                existing.track_mbid = song.track_mbid.lower()
                self.song_mbid_to_id[(artist_id, existing.track_mbid)] = song_id
                self.stats.songs_updated_mbid += 1
            self.stats.songs_reused += 1
            return song_id, existing

        # New Song
        song_id = self._next_song_id
        self._next_song_id += 1

        self.songs_by_id[song_id] = song
        self.song_title_to_id[(artist_id, norm_title)] = song_id
        if song.track_mbid:
            self.song_mbid_to_id[(artist_id, song.track_mbid.lower())] = song_id

        self.stats.songs_created += 1
        return song_id, song

    def process_scrobble(self, scrobble: ScrobbleEntity, song_id: int) -> Tuple[bool, Dict[str, Any]]:
        """
        Deduplicates scrobbles.
        Rule: Unique by (user_id, timestamp, song_id). Exact duplicate scrobble events are skipped.
        """
        key = (scrobble.user_id.lower(), scrobble.timestamp, song_id)
        if key in self.seen_scrobbles:
            self.stats.scrobbles_skipped_duplicate += 1
            return False, {}

        self.seen_scrobbles.add(key)
        self.stats.scrobbles_accepted += 1

        record = {
            "user_id": scrobble.user_id,
            "song_id": song_id,
            "listened_at": scrobble.timestamp,
            "duration_listened": scrobble.duration_listened,
            "provenance": scrobble.provenance
        }
        return True, record
