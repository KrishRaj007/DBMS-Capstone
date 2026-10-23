"""
Stage 5: Deduplicate Module
Deterministic, reliable entity deduplication using documented matching rules.
Guarantees:
- Never merges songs across different artists merely because their titles match.
- Avoids destructive fuzzy deduplication (preserves distinct live/acoustic/remix versions).
- Enriches existing artists/tracks when a MusicBrainz ID becomes available (updated count).
- Skips duplicate scrobbles with identical (user_id, timestamp, song_id) (skipped count).
- Primes from existing database to preserve existing primary keys and foreign keys.
- Handles aggregated play counts without synthesizing fake timestamps or sessions.
"""
from dataclasses import dataclass, field
from typing import Dict, Tuple, Optional, Set, Any, List
import sqlite3
from pipeline.transform import UserEntity, ArtistEntity, SongEntity, ScrobbleEntity, AggregatedPlayEntity

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
    aggregated_plays_accepted: int = 0
    aggregated_plays_skipped_duplicate: int = 0

class DeduplicationEngine:
    """
    Maintains in-memory canonical lookup registries for chunked and streaming ETL.
    Can be primed with existing database records to preserve pre-existing entity IDs.
    """
    def __init__(self):
        self.stats = DeduplicationStats()

        # Users registry: user_id -> UserEntity
        self.users: Dict[str, UserEntity] = {}

        # Artists registry
        self.artists_by_id: Dict[int, ArtistEntity] = {}
        self.artist_mbid_to_id: Dict[str, int] = {}
        self.artist_name_to_id: Dict[str, int] = {}
        self.artist_source_to_id: Dict[Tuple[str, str], int] = {}
        self._next_artist_id: int = 1

        # Songs registry
        self.songs_by_id: Dict[int, SongEntity] = {}
        self.song_mbid_to_id: Dict[Tuple[int, str], int] = {}
        self.song_title_to_id: Dict[Tuple[int, str], int] = {}
        self.song_source_to_id: Dict[Tuple[str, str], int] = {}
        self._next_song_id: int = 1

        # Scrobbles deduplication key set: (user_id, timestamp, song_id)
        self.seen_scrobbles: Set[Tuple[str, str, int]] = set()

        # Aggregated plays registry: (source_namespace, user_id, artist_id, song_id) -> play_count
        self.aggregated_plays: Dict[Tuple[str, Optional[str], int, Optional[int]], int] = {}

    def prime_from_database(self, conn: sqlite3.Connection):
        """
        Loads existing artists, songs, and users from the database into the deduplication registries.
        Preserves existing primary keys and foreign keys across pipeline runs!
        """
        cursor = conn.cursor()

        # 1. Prime existing artists
        try:
            cursor.execute("SELECT id, name, mbid, source_namespace, source_id FROM artists")
            for aid, name, mbid, src_ns, src_id in cursor.fetchall():
                aid = int(aid)
                norm_name = name.lower()
                self.artist_name_to_id[norm_name] = aid
                if mbid:
                    self.artist_mbid_to_id[mbid.lower()] = aid
                if src_ns and src_id:
                    self.artist_source_to_id[(src_ns, str(src_id))] = aid
                if aid >= self._next_artist_id:
                    self._next_artist_id = aid + 1
        except Exception:
            pass

        # 2. Prime existing songs
        try:
            cursor.execute("SELECT id, title, artist_id, track_mbid, source_namespace, source_id FROM songs")
            for sid, title, art_id, tra_mbid, src_ns, src_id in cursor.fetchall():
                sid = int(sid)
                art_id = int(art_id)
                norm_title = title.lower()
                self.song_title_to_id[(art_id, norm_title)] = sid
                if tra_mbid:
                    self.song_mbid_to_id[(art_id, tra_mbid.lower())] = sid
                if src_ns and src_id:
                    self.song_source_to_id[(src_ns, str(src_id))] = sid
                if sid >= self._next_song_id:
                    self._next_song_id = sid + 1
        except Exception:
            pass

        # 3. Prime existing scrobbles to prevent duplication on re-run
        try:
            cursor.execute("""
                SELECT u.username, lh.listened_at, lh.song_id
                FROM listening_history lh
                JOIN users u ON lh.user_id = u.id
            """)
            for uname, l_at, song_id in cursor.fetchall():
                self.seen_scrobbles.add((uname.lower(), str(l_at), int(song_id)))
        except Exception:
            pass

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
        1. If source_namespace + source_id is present, lookup by source.
        2. If MBID is present, lookup by MBID.
        3. Lookup by normalized lowercase name.
        4. If existing artist has no MBID but current record has one, enrich existing record (updated).
        """
        norm_name = artist.name.lower()
        art_id: Optional[int] = None

        if artist.source_namespace and artist.source_id:
            art_id = self.artist_source_to_id.get((artist.source_namespace, str(artist.source_id)))

        if art_id is None and artist.mbid:
            art_id = self.artist_mbid_to_id.get(artist.mbid.lower())

        if art_id is None:
            art_id = self.artist_name_to_id.get(norm_name)

        if art_id is not None:
            # Existing artist found
            existing = self.artists_by_id.get(art_id)
            if existing:
                if not existing.mbid and artist.mbid:
                    existing.mbid = artist.mbid.lower()
                    self.artist_mbid_to_id[existing.mbid] = art_id
                    self.stats.artists_updated_mbid += 1
                if not existing.source_id and artist.source_id:
                    existing.source_id = artist.source_id
                    self.artist_source_to_id[(artist.source_namespace, str(artist.source_id))] = art_id
                for col in artist.collaborators:
                    if col not in existing.collaborators:
                        existing.collaborators.append(col)
                self.stats.artists_reused += 1
                return art_id, existing
            else:
                # Primed from DB without full Entity in memory yet
                self.artists_by_id[art_id] = artist
                self.stats.artists_reused += 1
                return art_id, artist

        # New Artist
        art_id = self._next_artist_id
        self._next_artist_id += 1

        self.artists_by_id[art_id] = artist
        self.artist_name_to_id[norm_name] = art_id
        if artist.mbid:
            self.artist_mbid_to_id[artist.mbid.lower()] = art_id
        if artist.source_namespace and artist.source_id:
            self.artist_source_to_id[(artist.source_namespace, str(artist.source_id))] = art_id

        self.stats.artists_created += 1
        return art_id, artist

    def process_song(self, song: SongEntity, artist_id: int) -> Tuple[int, SongEntity]:
        """
        Deduplicates songs using documented matching rules:
        Strict rule: Do not merge different songs merely because their titles match.
        Matching is scoped to the specific artist (artist_id).
        1. If source_namespace + source_id is present: lookup by source.
        2. If track_mbid present: lookup (artist_id, track_mbid).
        3. Fallback: lookup (artist_id, normalized_lowercase_title).
        4. If existing song lacks MBID and incoming record has it: enrich (updated).
        """
        norm_title = song.title.lower()
        song_id: Optional[int] = None

        if song.source_namespace and song.source_id:
            song_id = self.song_source_to_id.get((song.source_namespace, str(song.source_id)))

        if song_id is None and song.track_mbid:
            song_id = self.song_mbid_to_id.get((artist_id, song.track_mbid.lower()))

        if song_id is None:
            song_id = self.song_title_to_id.get((artist_id, norm_title))

        if song_id is not None:
            # Existing song found
            existing = self.songs_by_id.get(song_id)
            if existing:
                if not existing.track_mbid and song.track_mbid:
                    existing.track_mbid = song.track_mbid.lower()
                    self.song_mbid_to_id[(artist_id, existing.track_mbid)] = song_id
                    self.stats.songs_updated_mbid += 1
                if not existing.source_id and song.source_id:
                    existing.source_id = song.source_id
                    self.song_source_to_id[(song.source_namespace, str(song.source_id))] = song_id
                self.stats.songs_reused += 1
                return song_id, existing
            else:
                self.songs_by_id[song_id] = song
                self.stats.songs_reused += 1
                return song_id, song

        # New Song
        song_id = self._next_song_id
        self._next_song_id += 1

        self.songs_by_id[song_id] = song
        self.song_title_to_id[(artist_id, norm_title)] = song_id
        if song.track_mbid:
            self.song_mbid_to_id[(artist_id, song.track_mbid.lower())] = song_id
        if song.source_namespace and song.source_id:
            self.song_source_to_id[(song.source_namespace, str(song.source_id))] = song_id

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
            "source_namespace": scrobble.source_namespace,
            "source_id": scrobble.source_id,
            "provenance": scrobble.provenance
        }
        return True, record

    def process_aggregated_play(
        self,
        play: AggregatedPlayEntity,
        artist_id: int,
        song_id: Optional[int]
    ) -> Tuple[bool, Dict[str, Any]]:
        """
        Stores aggregated listening counts appropriately without synthesizing fake individual sessions.
        """
        key = (play.source_namespace, play.user_id, artist_id, song_id)
        if key in self.aggregated_plays:
            self.aggregated_plays[key] += play.play_count
            self.stats.aggregated_plays_skipped_duplicate += 1
            return False, {}

        self.aggregated_plays[key] = play.play_count
        self.stats.aggregated_plays_accepted += 1

        record = {
            "user_id": play.user_id,
            "artist_id": artist_id,
            "song_id": song_id,
            "play_count": play.play_count,
            "source_namespace": play.source_namespace,
            "source_id": play.source_id,
            "provenance": play.provenance
        }
        return True, record
