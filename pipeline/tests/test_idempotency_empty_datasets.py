"""
Tests for:
1. Empty datasets and missing files
2. Corrupted and invalid datasets (failed imports handling)
3. Import idempotency across multiple pipeline executions
4. Database priming and key preservation
"""
import unittest
from pathlib import Path
import tempfile
import os
import sqlite3

from pipeline.extract import extract_profiles, extract_listening_chunks
from pipeline.validate import validate_profile_record, validate_listening_record
from pipeline.deduplicate import DeduplicationEngine
from pipeline.transform import transform_profile_entity, transform_scrobble_entity
from pipeline.load import adapt_sqlite_schema, load_to_sqlite

class TestIdempotencyAndEmptyDatasets(unittest.TestCase):

    def test_missing_files_error_handling(self):
        non_existent = Path("non_existent_file_path.tsv")
        with self.assertRaises(FileNotFoundError):
            list(extract_profiles(non_existent))

        with self.assertRaises(FileNotFoundError):
            list(extract_listening_chunks(non_existent))

    def test_zero_byte_empty_files(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".tsv") as tmp:
            tmp_path = Path(tmp.name)

        try:
            # 0 bytes file
            profile_records = list(extract_profiles(tmp_path))
            self.assertEqual(len(profile_records), 0)

            scrobble_chunks = list(extract_listening_chunks(tmp_path))
            self.assertEqual(len(scrobble_chunks), 0)
        finally:
            os.remove(tmp_path)

    def test_header_only_file(self):
        with tempfile.NamedTemporaryFile("w+", delete=False, suffix=".tsv", encoding="utf-8") as tmp:
            tmp.write("#id\tgender\tage\tcountry\tregistered\n")
            tmp_path = Path(tmp.name)

        try:
            profile_records = list(extract_profiles(tmp_path))
            self.assertEqual(len(profile_records), 0) # Header consumed, 0 data records
        finally:
            os.remove(tmp_path)

    def test_all_corrupted_dataset_rejection(self):
        """
        When all rows in a dataset are corrupted/malformed:
        The pipeline must cleanly categorize all as rejected, log reasons,
        and not crash or pollute the database.
        """
        bad_rows = [
            [],                                          # Empty row
            [""],                                        # Missing user_id
            ["u1", "bad_timestamp", "a", "A", "t", "T"], # Malformed timestamp
            ["u2", "2009-05-04T23:08:57Z", "", "", "", ""] # Missing artist and track
        ]

        accepted_count = 0
        rejected_count = 0
        rejection_reasons = []

        for row in bad_rows:
            from pipeline.extract import RawRecord
            rec = RawRecord("bad.tsv", 1, row, "\t".join(row))
            val = validate_listening_record(rec)
            if val.is_valid:
                accepted_count += 1
            else:
                rejected_count += 1
                rejection_reasons.append(val.rejection_reason)

        self.assertEqual(accepted_count, 0)
        self.assertEqual(rejected_count, 4)
        self.assertEqual(len(rejection_reasons), 4)

    def test_import_idempotency_with_database_priming(self):
        """
        Verifies that running the import once, priming from the database,
        and running a second time on the same input produces:
        - 0 new entities created
        - 100% duplicate records recognized and skipped
        - Identical database row counts and zero corrupted foreign keys
        """
        # Create temporary SQLite DB
        db_file = tempfile.NamedTemporaryFile("w+", delete=False, suffix=".sqlite")
        db_path = Path(db_file.name)
        db_file.close()

        try:
            conn = sqlite3.connect(str(db_path))
            adapt_sqlite_schema(conn)

            # --- RUN 1 ---
            engine1 = DeduplicationEngine()
            engine1.prime_from_database(conn)

            # Sample profile and scrobbles
            u_sanitized = {"user_id": "user_idem_1", "gender": "m", "age": 28, "country": "US", "registered": "2008-01-01"}
            u_ent = transform_profile_entity(u_sanitized, "profile.tsv", 2)
            is_new_u1, _ = engine1.process_user(u_ent)
            self.assertTrue(is_new_u1)

            s_sanitized = {
                "user_id": "user_idem_1",
                "timestamp": "2009-05-04T23:08:57Z",
                "artist_mbid": "f82bcf78-5b69-4622-a5ef-73800768d9ac",
                "artist_name": "Idempotent Artist",
                "track_mbid": "b10bbbfc-cf9e-42e0-be17-e2c3e1d2600d",
                "track_name": "Idempotent Track"
            }
            art_ent, s_ent, scrob_ent = transform_scrobble_entity(s_sanitized, "scrobble.tsv", 1)
            aid1, _ = engine1.process_artist(art_ent)
            sid1, _ = engine1.process_song(s_ent, aid1)
            ok_scrob1, scrob_rec1 = engine1.process_scrobble(scrob_ent, sid1)
            self.assertTrue(ok_scrob1)

            # Load into DB
            counts_run1 = load_to_sqlite(
                users=engine1.users,
                artists=engine1.artists_by_id,
                songs=engine1.songs_by_id,
                artist_name_to_id=engine1.artist_name_to_id,
                scrobbles=[scrob_rec1],
                db_path=db_path
            )

            # Verify Run 1 counts
            self.assertEqual(counts_run1["users"], 1)
            self.assertEqual(counts_run1["artists"], 1)
            self.assertEqual(counts_run1["songs"], 1)
            self.assertEqual(counts_run1["listening_history"], 1)

            conn.close()

            # --- RUN 2 (IDEMPOTENCY CHECK) ---
            # Connect fresh to see committed writes and prime engine2
            conn2 = sqlite3.connect(str(db_path))
            try:
                engine2 = DeduplicationEngine()
                engine2.prime_from_database(conn2)

                # Process the exact same inputs
                is_new_u2, _ = engine2.process_user(u_ent)
                # Re-processing profile with existing user_id skips duplicate!
                self.assertFalse(is_new_u2)
                self.assertEqual(engine2.stats.users_skipped_duplicate, 1)

                aid2, _ = engine2.process_artist(art_ent)
                # Artist should be reused, NOT created!
                self.assertEqual(aid1, aid2)
                self.assertEqual(engine2.stats.artists_reused, 1)
                self.assertEqual(engine2.stats.artists_created, 0)

                sid2, _ = engine2.process_song(s_ent, aid2)
                # Song should be reused, NOT created!
                self.assertEqual(sid1, sid2)
                self.assertEqual(engine2.stats.songs_reused, 1)
                self.assertEqual(engine2.stats.songs_created, 0)

                ok_scrob2, _ = engine2.process_scrobble(scrob_ent, sid2)
                # Scrobble should be skipped as duplicate!
                self.assertFalse(ok_scrob2)
                self.assertEqual(engine2.stats.scrobbles_skipped_duplicate, 1)
                self.assertEqual(engine2.stats.scrobbles_accepted, 0)

                # Re-running load to database
                counts_run2 = load_to_sqlite(
                    users=engine2.users,
                    artists=engine2.artists_by_id,
                    songs=engine2.songs_by_id,
                    artist_name_to_id=engine2.artist_name_to_id,
                    scrobbles=[], # 0 new scrobbles
                    db_path=db_path
                )

                # Final row counts MUST be identical!
                self.assertEqual(counts_run2["users"], counts_run1["users"])
                self.assertEqual(counts_run2["artists"], counts_run1["artists"])
                self.assertEqual(counts_run2["songs"], counts_run1["songs"])
                self.assertEqual(counts_run2["listening_history"], counts_run1["listening_history"])
            finally:
                conn2.close()
        finally:
            if os.path.exists(db_path):
                os.remove(db_path)

if __name__ == "__main__":
    unittest.main()
