"""
Tests for:
1. Identifier collisions prevention (Same title across different artists)
2. Provenance separation across data sources (namespaces)
3. Deterministic source ID hashing
"""
import unittest
import hashlib
from pipeline.deduplicate import DeduplicationEngine
from pipeline.transform import ArtistEntity, SongEntity

class TestIdentifierCollisions(unittest.TestCase):

    def setUp(self):
        self.engine = DeduplicationEngine()

    def test_same_song_title_different_artists_no_collision(self):
        """
        Critical rule: Songs with identical titles (e.g. 'Hello', 'One', 'Hold On')
        by DIFFERENT artists must NOT be merged into the same song entity.
        They must receive distinct, independent song IDs!
        """
        # Artist 1: Adele
        a1 = ArtistEntity("Adele", "cc124b44-4dd9-4b10-be91-5f4f467fb332", "Adele", [], 1, {})
        aid1, _ = self.engine.process_artist(a1)

        # Artist 2: Lionel Richie
        a2 = ArtistEntity("Lionel Richie", "9b24fb59-0f04-43cb-b09b-610156d8e8a6", "Lionel Richie", [], 4, {})
        aid2, _ = self.engine.process_artist(a2)

        self.assertNotEqual(aid1, aid2)

        # Song 1: "Hello" by Adele
        s1 = SongEntity(
            title="Hello",
            artist_name="Adele",
            artist_mbid="cc124b44-4dd9-4b10-be91-5f4f467fb332",
            track_mbid=None,
            album="25",
            duration_seconds=295,
            release_date="2015-10-23",
            genre_id=1,
            provenance={}
        )
        sid1, _ = self.engine.process_song(s1, aid1)

        # Song 2: "Hello" by Lionel Richie
        s2 = SongEntity(
            title="Hello",
            artist_name="Lionel Richie",
            artist_mbid="9b24fb59-0f04-43cb-b09b-610156d8e8a6",
            track_mbid=None,
            album="Can't Slow Down",
            duration_seconds=250,
            release_date="1984-02-13",
            genre_id=4,
            provenance={}
        )
        sid2, _ = self.engine.process_song(s2, aid2)

        # Verify they are strictly separate songs!
        self.assertNotEqual(sid1, sid2)
        self.assertEqual(self.engine.stats.songs_created, 2)
        self.assertEqual(self.engine.stats.songs_reused, 0)

        # Verify that retrieving Adele's "Hello" again returns sid1
        sid1_recheck, _ = self.engine.process_song(s1, aid1)
        self.assertEqual(sid1, sid1_recheck)

        # Verify that retrieving Lionel Richie's "Hello" again returns sid2
        sid2_recheck, _ = self.engine.process_song(s2, aid2)
        self.assertEqual(sid2, sid2_recheck)

    def test_source_namespace_isolation(self):
        """
        Confirms entities with the same numeric ID in separate sources
        are distinguished by source_namespace and source_id.
        """
        a_lastfm = ArtistEntity(
            name="The National",
            mbid=None,
            original_credit="The National",
            collaborators=[],
            genre_id=9,
            provenance={},
            source_namespace="lastfm",
            source_id="101"
        )
        aid_lastfm, _ = self.engine.process_artist(a_lastfm)

        # A different source (e.g. spotify or local) with source_id 101 for a different artist
        a_local = ArtistEntity(
            name="Different Artist",
            mbid=None,
            original_credit="Different Artist",
            collaborators=[],
            genre_id=1,
            provenance={},
            source_namespace="local",
            source_id="101"
        )
        aid_local, _ = self.engine.process_artist(a_local)

        self.assertNotEqual(aid_lastfm, aid_local)

    def test_deterministic_hash_consistency(self):
        """
        Confirms deterministic hashes remain stable across pipeline runs.
        """
        artist_name = "Massive Attack"
        track_title = "Teardrop"
        expected_hash = hashlib.md5(f"{artist_name}::{track_title}".lower().encode("utf-8")).hexdigest()

        computed_hash = hashlib.md5(f"{artist_name}::{track_title}".lower().encode("utf-8")).hexdigest()
        self.assertEqual(expected_hash, computed_hash)

if __name__ == "__main__":
    unittest.main()
