"""
Tests for:
1. Duplicate detection across entities (Users, Artists, Songs, Scrobbles, Aggregated Plays)
2. MBID enrichment of pre-existing artists and tracks
3. Exact duplicate scrobble suppression
4. Aggregated count accumulation
"""
import unittest
from pipeline.deduplicate import DeduplicationEngine
from pipeline.transform import (
    UserEntity,
    ArtistEntity,
    SongEntity,
    ScrobbleEntity,
    AggregatedPlayEntity
)

class TestDeduplication(unittest.TestCase):

    def setUp(self):
        self.engine = DeduplicationEngine()

    def test_user_deduplication(self):
        u1 = UserEntity("user_001", "user_001", "user_001@lastfm.local", "m", 25, "UK", "2006-08-13", "user_001", {})
        u2 = UserEntity("user_001", "user_001", "user_001@lastfm.local", "f", 30, "USA", "2007-09-01", "user_001", {})
        u3 = UserEntity("user_002", "user_002", "user_002@lastfm.local", "f", 22, "DE", "2008-01-01", "user_002", {})

        is_new1, res1 = self.engine.process_user(u1)
        self.assertTrue(is_new1)
        self.assertEqual(res1.age, 25)

        # Duplicate submission of user_001
        is_new2, res2 = self.engine.process_user(u2)
        self.assertFalse(is_new2)
        self.assertEqual(res2.age, 25) # Preserved first valid record
        self.assertEqual(self.engine.stats.users_skipped_duplicate, 1)

        # Different user
        is_new3, res3 = self.engine.process_user(u3)
        self.assertTrue(is_new3)
        self.assertEqual(self.engine.stats.users_accepted, 2)

    def test_artist_deduplication_and_mbid_enrichment(self):
        # First: Artist without MBID
        a1 = ArtistEntity(
            name="Radiohead",
            mbid=None,
            original_credit="Radiohead",
            collaborators=[],
            genre_id=2,
            provenance={},
            source_namespace="lastfm",
            source_id="rh_hash"
        )
        id1, res1 = self.engine.process_artist(a1)
        self.assertEqual(self.engine.stats.artists_created, 1)
        self.assertIsNone(res1.mbid)

        # Second: Same artist with MBID -> enriches existing artist
        mbid_rh = "f82bcf78-5b69-4622-a5ef-73800768d9ac"
        a2 = ArtistEntity(
            name="Radiohead",
            mbid=mbid_rh,
            original_credit="Radiohead",
            collaborators=[],
            genre_id=2,
            provenance={},
            source_namespace="lastfm",
            source_id="rh_hash"
        )
        id2, res2 = self.engine.process_artist(a2)
        self.assertEqual(id1, id2)
        self.assertEqual(res2.mbid, mbid_rh)
        self.assertEqual(self.engine.stats.artists_updated_mbid, 1)
        self.assertEqual(self.engine.stats.artists_reused, 1)

        # Third: Look up artist directly by MBID
        a3 = ArtistEntity(
            name="Radiohead Alternative Spelling",
            mbid=mbid_rh,
            original_credit="Radiohead",
            collaborators=[],
            genre_id=2,
            provenance={},
            source_namespace="lastfm",
            source_id="rh_other"
        )
        id3, _ = self.engine.process_artist(a3)
        self.assertEqual(id1, id3)
        self.assertEqual(self.engine.stats.artists_created, 1) # Still only 1 created!

    def test_song_deduplication_scoped_to_artist(self):
        # Create Artist
        a = ArtistEntity("Nirvana", None, "Nirvana", [], 2, {})
        art_id, _ = self.engine.process_artist(a)

        s1 = SongEntity(
            title="Smells Like Teen Spirit",
            artist_name="Nirvana",
            artist_mbid=None,
            track_mbid=None,
            album=None,
            duration_seconds=301,
            release_date=None,
            genre_id=2,
            provenance={}
        )
        sid1, _ = self.engine.process_song(s1, art_id)
        self.assertEqual(self.engine.stats.songs_created, 1)

        # Re-processing same song under same artist reuses existing song_id
        s2 = SongEntity(
            title="smells like teen spirit",  # case-insensitive match
            artist_name="Nirvana",
            artist_mbid=None,
            track_mbid="56b464a4-4444-42b7-a859-99a380908b1a", # enriched with MBID
            album=None,
            duration_seconds=301,
            release_date=None,
            genre_id=2,
            provenance={}
        )
        sid2, res2 = self.engine.process_song(s2, art_id)
        self.assertEqual(sid1, sid2)
        self.assertEqual(self.engine.stats.songs_updated_mbid, 1)
        self.assertEqual(self.engine.stats.songs_reused, 1)
        self.assertEqual(self.engine.stats.songs_created, 1)

    def test_scrobble_duplicate_suppression(self):
        scrobble = ScrobbleEntity(
            user_id="user_000001",
            timestamp="2009-05-04 23:08:57",
            artist_name="Radiohead",
            artist_mbid=None,
            track_name="Karma Police",
            track_mbid=None,
            duration_listened=0,
            provenance={}
        )
        song_id = 101

        # First time: Accepted
        ok1, rec1 = self.engine.process_scrobble(scrobble, song_id)
        self.assertTrue(ok1)
        self.assertEqual(self.engine.stats.scrobbles_accepted, 1)

        # Duplicate: Exact same user, timestamp, and song_id -> Skipped
        ok2, rec2 = self.engine.process_scrobble(scrobble, song_id)
        self.assertFalse(ok2)
        self.assertEqual(self.engine.stats.scrobbles_skipped_duplicate, 1)
        self.assertEqual(self.engine.stats.scrobbles_accepted, 1)

    def test_aggregated_play_deduplication_and_accumulation(self):
        play1 = AggregatedPlayEntity(
            artist_name="Radiohead",
            play_count=50,
            user_id="user_000001",
            source_namespace="dataset"
        )
        ok1, rec1 = self.engine.process_aggregated_play(play1, artist_id=1, song_id=None)
        self.assertTrue(ok1)
        self.assertEqual(self.engine.stats.aggregated_plays_accepted, 1)

        # Duplicate key accumulates count
        play2 = AggregatedPlayEntity(
            artist_name="Radiohead",
            play_count=30,
            user_id="user_000001",
            source_namespace="dataset"
        )
        ok2, _ = self.engine.process_aggregated_play(play2, artist_id=1, song_id=None)
        self.assertFalse(ok2)
        self.assertEqual(self.engine.stats.aggregated_plays_skipped_duplicate, 1)
        # Check accumulated sum in registry
        key = ("dataset", "user_000001", 1, None)
        self.assertEqual(self.engine.aggregated_plays[key], 80)

if __name__ == "__main__":
    unittest.main()
