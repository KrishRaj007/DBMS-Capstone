"""
Tests for:
1. Dataset parsing and column mapping
2. Multi-artist collaboration extraction
3. Date and timestamp format conversions
4. Entity domain transformation and provenance mapping
"""
import unittest
from pathlib import Path
import tempfile
import os

from pipeline.clean import (
    normalize_text,
    clean_date_string,
    clean_timestamp_string,
    parse_artist_credit,
    clean_track_title
)
from pipeline.transform import (
    infer_genre_id,
    transform_profile_entity,
    transform_scrobble_entity,
    transform_aggregated_play_entity,
    UserEntity,
    ArtistEntity,
    SongEntity,
    ScrobbleEntity,
    AggregatedPlayEntity
)
from pipeline.extract import (
    RawRecord,
    extract_profiles,
    extract_listening_chunks
)

class TestDatasetParsingAndMapping(unittest.TestCase):

    def test_text_normalization(self):
        # Unicode normalization (NFKC) & whitespace collapsing
        self.assertEqual(normalize_text("  Radiohead  "), "Radiohead")
        self.assertEqual(normalize_text("Daft\t\tPunk\n"), "Daft Punk")
        self.assertEqual(normalize_text("&amp;"), "&")
        self.assertIsNone(normalize_text(None))
        self.assertIsNone(normalize_text(""))
        self.assertIsNone(normalize_text("   "))
        self.assertIsNone(normalize_text("null"))
        self.assertIsNone(normalize_text("N/A"))

    def test_date_and_timestamp_parsing(self):
        # Multiple date formats to ISO YYYY-MM-DD
        self.assertEqual(clean_date_string("Aug 13, 2006"), "2006-08-13")
        self.assertEqual(clean_date_string("August 13, 2006"), "2006-08-13")
        self.assertEqual(clean_date_string("13 Aug 2006"), "2006-08-13")
        self.assertEqual(clean_date_string("2009-05-04"), "2009-05-04")
        self.assertEqual(clean_date_string("13/08/2006"), "2006-08-13")
        self.assertIsNone(clean_date_string("invalid-date"))
        self.assertIsNone(clean_date_string(None))

        # ISO 8601 UTC timestamp to SQL standard format
        self.assertEqual(clean_timestamp_string("2009-05-04T23:08:57Z"), "2009-05-04 23:08:57")
        self.assertEqual(clean_timestamp_string("2009-05-04T23:08:57"), "2009-05-04 23:08:57")
        self.assertIsNone(clean_timestamp_string("not-a-timestamp"))

    def test_multi_artist_collaboration_parsing(self):
        # Delimiters: feat, ft, featuring, vs, with, &
        credit1 = parse_artist_credit("Dark Globe Feat. Boy George")
        self.assertEqual(credit1.primary_artist, "Dark Globe")
        self.assertEqual(credit1.collaborators, ["Boy George"])
        self.assertEqual(credit1.original_credit, "Dark Globe Feat. Boy George")

        credit2 = parse_artist_credit("Queen & David Bowie")
        self.assertEqual(credit2.primary_artist, "Queen")
        self.assertEqual(credit2.collaborators, ["David Bowie"])

        credit3 = parse_artist_credit("Woolfy Vs. Projections")
        self.assertEqual(credit3.primary_artist, "Woolfy")
        self.assertEqual(credit3.collaborators, ["Projections"])

        credit4 = parse_artist_credit("Solo Artist")
        self.assertEqual(credit4.primary_artist, "Solo Artist")
        self.assertEqual(credit4.collaborators, [])

    def test_clean_track_title(self):
        self.assertEqual(clean_track_title('"Karma Police"'), "Karma Police")
        self.assertEqual(clean_track_title("'Creep (Live)'"), "Creep (Live)")
        self.assertEqual(clean_track_title("Paranoid Android [Remix]"), "Paranoid Android [Remix]")
        self.assertEqual(clean_track_title(""), "Untitled Track")
        self.assertEqual(clean_track_title(None), "Untitled Track")

    def test_genre_inference(self):
        # Keyword matching
        pop_id = infer_genre_id("Pop Star", "Dance Beat")
        self.assertEqual(pop_id, 1)  # Pop

        rock_id = infer_genre_id("Rock Band", "Guitar Solo")
        self.assertEqual(rock_id, 2)  # Rock

        metal_id = infer_genre_id("Iron Heavy", "Thrash Death")
        self.assertEqual(metal_id, 10) # Metal

        # Deterministic fallback when no keywords match
        fallback_id1 = infer_genre_id("Unknown Artist A")
        fallback_id2 = infer_genre_id("Unknown Artist A")
        self.assertTrue(1 <= fallback_id1 <= 10)
        self.assertEqual(fallback_id1, fallback_id2)

    def test_profile_entity_mapping(self):
        sanitized = {
            "user_id": "user_000001",
            "gender": "m",
            "age": 25,
            "country": "United Kingdom",
            "registered": "Aug 13, 2006"
        }
        user = transform_profile_entity(sanitized, "userid-profile.tsv", 2)
        self.assertIsInstance(user, UserEntity)
        self.assertEqual(user.user_id, "user_000001")
        self.assertEqual(user.username, "user_000001")
        self.assertEqual(user.email, "user_000001@lastfm.local")
        self.assertEqual(user.gender, "m")
        self.assertEqual(user.age, 25)
        self.assertEqual(user.country, "United Kingdom")
        self.assertEqual(user.registered_at, "2006-08-13")
        self.assertEqual(user.source_namespace, "lastfm")
        self.assertEqual(user.provenance["source_file"], "userid-profile.tsv")
        self.assertEqual(user.provenance["source_line"], 2)

    def test_scrobble_entity_mapping(self):
        sanitized = {
            "user_id": "user_000001",
            "timestamp": "2009-05-04T23:08:57Z",
            "artist_mbid": "f82bcf78-5b69-4622-a5ef-73800768d9ac",
            "artist_name": "Radiohead",
            "track_mbid": "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
            "track_name": "Karma Police"
        }
        artist, song, scrobble = transform_scrobble_entity(sanitized, "scrobbles.tsv", 42)

        self.assertIsInstance(artist, ArtistEntity)
        self.assertEqual(artist.name, "Radiohead")
        self.assertEqual(artist.mbid, "f82bcf78-5b69-4622-a5ef-73800768d9ac")
        self.assertEqual(artist.source_namespace, "lastfm")

        self.assertIsInstance(song, SongEntity)
        self.assertEqual(song.title, "Karma Police")
        self.assertEqual(song.track_mbid, "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d")
        self.assertIsNone(song.album)  # Not fabricated
        self.assertEqual(song.source_namespace, "lastfm")

        self.assertIsInstance(scrobble, ScrobbleEntity)
        self.assertEqual(scrobble.user_id, "user_000001")
        self.assertEqual(scrobble.timestamp, "2009-05-04 23:08:57")
        self.assertEqual(scrobble.source_namespace, "lastfm")

    def test_aggregated_play_entity_mapping(self):
        sanitized = {
            "artist_name": "Coldplay",
            "play_count": 1500,
            "user_id": "user_000002",
            "track_name": "Yellow"
        }
        agg = transform_aggregated_play_entity(sanitized, "counts.tsv", 1)
        self.assertIsInstance(agg, AggregatedPlayEntity)
        self.assertEqual(agg.artist_name, "Coldplay")
        self.assertEqual(agg.play_count, 1500)
        self.assertEqual(agg.source_namespace, "dataset")
        self.assertTrue(agg.provenance["aggregated"])

    def test_extract_profiles_file_parsing(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".tsv", encoding="utf-8") as tmp:
            tmp.write("#id\tgender\tage\tcountry\tregistered\n")
            tmp.write("user_000001\tm\t25\tUnited Kingdom\tAug 13, 2006\n")
            tmp.write("user_000002\tf\t30\tGermany\tSep 01, 2007\n")
            tmp_path = Path(tmp.name)

        try:
            records = list(extract_profiles(tmp_path))
            self.assertEqual(len(records), 2)
            self.assertEqual(records[0].line_number, 2)
            self.assertEqual(records[0].raw_fields[0], "user_000001")
            self.assertEqual(records[1].raw_fields[3], "Germany")
        finally:
            os.remove(tmp_path)

    def test_extract_listening_chunks_file_parsing(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".tsv", encoding="utf-8") as tmp:
            tmp.write("u1\t2009-05-04T23:08:57Z\tart1\tArtist 1\ttra1\tTrack 1\n")
            tmp.write("u1\t2009-05-04T23:12:00Z\tart1\tArtist 1\ttra2\tTrack 2\n")
            tmp.write("u2\t2009-05-04T23:15:00Z\tart2\tArtist 2\ttra3\tTrack 3\n")
            tmp_path = Path(tmp.name)

        try:
            chunks = list(extract_listening_chunks(tmp_path, chunk_size=2))
            self.assertEqual(len(chunks), 2)
            self.assertEqual(len(chunks[0]), 2)
            self.assertEqual(len(chunks[1]), 1)
            self.assertEqual(chunks[0][0].raw_fields[0], "u1")
            self.assertEqual(chunks[1][0].raw_fields[0], "u2")
        finally:
            os.remove(tmp_path)

if __name__ == "__main__":
    unittest.main()
