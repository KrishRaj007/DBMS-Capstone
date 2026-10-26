"""
Tests for:
1. Missing and malformed values
2. Column structure validation and error categorizations
3. Value boundary checks (age, gender, timestamp, UUID)
4. Null sentinel sanitization without inventing placeholder data
"""
import unittest
from pipeline.extract import RawRecord
from pipeline.validate import (
    validate_profile_record,
    validate_listening_record,
    ValidationResult
)
from pipeline.clean import normalize_text, clean_track_title

class TestValidationMalformed(unittest.TestCase):

    # ── User Profile Validation ──
    def test_profile_empty_record(self):
        rec = RawRecord("test.tsv", 1, [], "")
        val = validate_profile_record(rec)
        self.assertFalse(val.is_valid)
        self.assertEqual(val.rejection_reason, "MALFORMED_EMPTY_ROW")

    def test_profile_missing_mandatory_userid(self):
        rec = RawRecord("test.tsv", 2, ["", "m", "25", "UK", "2006-08-13"], "\tm\t25\tUK\t2006-08-13")
        val = validate_profile_record(rec)
        self.assertFalse(val.is_valid)
        self.assertEqual(val.rejection_reason, "MISSING_MANDATORY_USER_ID")

    def test_profile_valid_and_optional_padding(self):
        # Row with only user_id provided
        rec = RawRecord("test.tsv", 3, ["user_100"], "user_100")
        val = validate_profile_record(rec)
        self.assertTrue(val.is_valid)
        self.assertEqual(val.sanitized_fields["user_id"], "user_100")
        self.assertIsNone(val.sanitized_fields["gender"])
        self.assertIsNone(val.sanitized_fields["age"])

    def test_profile_age_range_and_formatting(self):
        # Valid age
        rec1 = RawRecord("test.tsv", 4, ["u1", "m", "25", "UK", "2006"], "...")
        val1 = validate_profile_record(rec1)
        self.assertTrue(val1.is_valid)
        self.assertEqual(val1.sanitized_fields["age"], 25)

        # Underage (< 5)
        rec2 = RawRecord("test.tsv", 5, ["u2", "m", "3", "UK", "2006"], "...")
        val2 = validate_profile_record(rec2)
        self.assertTrue(val2.is_valid) # Record valid, but age logged as warning and sanitized to None
        self.assertIsNone(val2.sanitized_fields["age"])
        self.assertTrue(any("AGE_OUT_OF_RANGE" in w for w in val2.warnings))

        # Overage (> 120)
        rec3 = RawRecord("test.tsv", 6, ["u3", "m", "150", "UK", "2006"], "...")
        val3 = validate_profile_record(rec3)
        self.assertIsNone(val3.sanitized_fields["age"])
        self.assertTrue(any("AGE_OUT_OF_RANGE" in w for w in val3.warnings))

        # Non-numeric age
        rec4 = RawRecord("test.tsv", 7, ["u4", "m", "twenty", "UK", "2006"], "...")
        val4 = validate_profile_record(rec4)
        self.assertIsNone(val4.sanitized_fields["age"])
        self.assertTrue(any("INVALID_AGE_FORMAT" in w for w in val4.warnings))

    def test_profile_gender_handling(self):
        # Valid genders
        for g in ["m", "f", "M", "F"]:
            rec = RawRecord("test.tsv", 8, ["u1", g, "25", "UK", "2006"], "...")
            val = validate_profile_record(rec)
            self.assertEqual(val.sanitized_fields["gender"], g.lower())

        # Unrecognized gender
        rec_unrec = RawRecord("test.tsv", 9, ["u2", "x", "25", "UK", "2006"], "...")
        val_unrec = validate_profile_record(rec_unrec)
        self.assertIsNone(val_unrec.sanitized_fields["gender"])
        self.assertTrue(any("UNRECOGNIZED_GENDER" in w for w in val_unrec.warnings))

    # ── Listening Record Validation ──
    def test_listening_malformed_column_count(self):
        rec = RawRecord("scrobble.tsv", 1, ["u1", "2009-05-04T23:08:57Z", "artid"], "u1\t...\tartid")
        val = validate_listening_record(rec)
        self.assertFalse(val.is_valid)
        self.assertTrue("MALFORMED_COLUMN_COUNT" in val.rejection_reason)

    def test_listening_missing_mandatory_fields(self):
        # Missing user_id
        rec_nouid = RawRecord("scrobble.tsv", 2, ["", "2009-05-04T23:08:57Z", "", "Artist", "", "Song"], "...")
        val_nouid = validate_listening_record(rec_nouid)
        self.assertFalse(val_nouid.is_valid)
        self.assertEqual(val_nouid.rejection_reason, "MISSING_MANDATORY_USER_ID")

        # Missing timestamp
        rec_nots = RawRecord("scrobble.tsv", 3, ["u1", "", "", "Artist", "", "Song"], "...")
        val_nots = validate_listening_record(rec_nots)
        self.assertFalse(val_nots.is_valid)
        self.assertEqual(val_nots.rejection_reason, "MISSING_MANDATORY_TIMESTAMP")

        # Malformed timestamp
        rec_badts = RawRecord("scrobble.tsv", 4, ["u1", "2009/05/04 23:08", "", "Artist", "", "Song"], "...")
        val_badts = validate_listening_record(rec_badts)
        self.assertFalse(val_badts.is_valid)
        self.assertTrue("MALFORMED_TIMESTAMP_FORMAT" in val_badts.rejection_reason)

        # Missing both artist name and artist MBID
        rec_noart = RawRecord("scrobble.tsv", 5, ["u1", "2009-05-04T23:08:57Z", "", "", "", "Song"], "...")
        val_noart = validate_listening_record(rec_noart)
        self.assertFalse(val_noart.is_valid)
        self.assertEqual(val_noart.rejection_reason, "MISSING_MANDATORY_ARTIST_IDENTIFIER")

        # Missing both track title and track MBID
        rec_notrk = RawRecord("scrobble.tsv", 6, ["u1", "2009-05-04T23:08:57Z", "", "Artist", "", ""], "...")
        val_notrk = validate_listening_record(rec_notrk)
        self.assertFalse(val_notrk.is_valid)
        self.assertEqual(val_notrk.rejection_reason, "MISSING_MANDATORY_TRACK_IDENTIFIER")

    def test_uuid_validation_and_sanitization(self):
        # Valid UUID v4
        valid_uuid = "f82bcf78-5b69-4622-a5ef-73800768d9ac"
        rec_valid = RawRecord("scrobble.tsv", 7, ["u1", "2009-05-04T23:08:57Z", valid_uuid, "Artist", valid_uuid, "Song"], "...")
        val_valid = validate_listening_record(rec_valid)
        self.assertTrue(val_valid.is_valid)
        self.assertEqual(val_valid.sanitized_fields["artist_mbid"], valid_uuid)
        self.assertEqual(val_valid.sanitized_fields["track_mbid"], valid_uuid)

        # Malformed UUID (not matching 8-4-4-4-12 hex format)
        bad_uuid = "not-a-valid-uuid"
        rec_bad = RawRecord("scrobble.tsv", 8, ["u1", "2009-05-04T23:08:57Z", bad_uuid, "Artist", bad_uuid, "Song"], "...")
        val_bad = validate_listening_record(rec_bad)
        self.assertTrue(val_bad.is_valid)  # Valid row since artist_name and song_name are present!
        self.assertIsNone(val_bad.sanitized_fields["artist_mbid"])
        self.assertIsNone(val_bad.sanitized_fields["track_mbid"])
        self.assertTrue(any("INVALID_ARTIST_MBID_FORMAT" in w for w in val_bad.warnings))
        self.assertTrue(any("INVALID_TRACK_MBID_FORMAT" in w for w in val_bad.warnings))

    def test_null_sentinels_no_hallucinated_placeholders(self):
        sentinels = ["", "null", "none", "\\n", "undefined", "n/a", "na", "-", "--"]
        for s in sentinels:
            self.assertIsNone(normalize_text(s))

        # Clean track title handles None/empty by using neutral "Untitled Track", never fake metadata
        self.assertEqual(clean_track_title(""), "Untitled Track")
        self.assertEqual(clean_track_title("null"), "Untitled Track")
        self.assertEqual(clean_track_title("Valid Song Title"), "Valid Song Title")

if __name__ == "__main__":
    unittest.main()
