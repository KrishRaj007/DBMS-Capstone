"""
Stage 2: Validate Module
Validates mandatory fields, numeric ranges, column structures, and categorizes row validity.
Separates malformed/rejected rows with detailed error reporting without aborting the pipeline.
"""
from dataclasses import dataclass, field
from datetime import datetime
from typing import List, Optional, Tuple, Dict, Any
import re
from pipeline.config import MIN_AGE, MAX_AGE, ALLOWED_GENDERS, UUID_REGEX
from pipeline.extract import RawRecord

@dataclass
class ValidationResult:
    is_valid: bool
    rejection_reason: Optional[str] = None
    warnings: List[str] = field(default_factory=list)
    sanitized_fields: Dict[str, Any] = field(default_factory=dict)

# ISO-8601 Timestamp pattern (e.g. 2009-05-04T23:08:57Z)
ISO_TIMESTAMP_PATTERN = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z?$")

def validate_profile_record(record: RawRecord) -> ValidationResult:
    """
    Validates a raw user profile record against schema rules:
    Columns: user_id, gender, age, country, registered
    Mandatory: user_id
    Optional: gender, age, country, registered
    """
    fields = record.raw_fields
    if len(fields) < 1:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MALFORMED_EMPTY_ROW"
        )

    # Pad missing trailing columns up to 5
    while len(fields) < 5:
        fields.append("")

    raw_uid, raw_gender, raw_age, raw_country, raw_registered = [f.strip() for f in fields[:5]]

    # Mandatory check
    if not raw_uid:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MISSING_MANDATORY_USER_ID"
        )

    warnings = []
    sanitized: Dict[str, Any] = {
        "user_id": raw_uid,
        "gender": None,
        "age": None,
        "country": raw_country if raw_country else None,
        "registered": raw_registered if raw_registered else None
    }

    # Gender validation (optional)
    if raw_gender:
        g = raw_gender.lower()
        if g in ALLOWED_GENDERS:
            sanitized["gender"] = g
        else:
            warnings.append(f"UNRECOGNIZED_GENDER: '{raw_gender}'")

    # Age validation (optional, numeric range check)
    if raw_age:
        try:
            age_int = int(float(raw_age))
            if MIN_AGE <= age_int <= MAX_AGE:
                sanitized["age"] = age_int
            else:
                warnings.append(f"AGE_OUT_OF_RANGE: {age_int} (expected {MIN_AGE}-{MAX_AGE})")
        except (ValueError, TypeError):
            warnings.append(f"INVALID_AGE_FORMAT: '{raw_age}'")

    return ValidationResult(
        is_valid=True,
        warnings=warnings,
        sanitized_fields=sanitized
    )

def validate_listening_record(record: RawRecord) -> ValidationResult:
    """
    Validates a raw scrobble record against schema rules:
    Columns: userid, timestamp, artid, artname, traid, traname
    Mandatory: userid, timestamp, (artname or artid), (traname or traid)
    Optional: artid (MBID), traid (MBID)
    """
    fields = record.raw_fields

    if len(fields) != 6:
        # Check if row is truncated or corrupted
        if len(fields) < 6:
            return ValidationResult(
                is_valid=False,
                rejection_reason=f"MALFORMED_COLUMN_COUNT: expected 6, found {len(fields)}"
            )
        # If extra columns due to unescaped tabs in title, we still preserve with warning
        fields = fields[:6]

    raw_uid = fields[0].strip()
    raw_time = fields[1].strip()
    raw_artid = fields[2].strip()
    raw_artname = fields[3].strip()
    raw_traid = fields[4].strip()
    raw_traname = fields[5].strip()

    # Mandatory user_id
    if not raw_uid:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MISSING_MANDATORY_USER_ID"
        )

    # Mandatory timestamp
    if not raw_time:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MISSING_MANDATORY_TIMESTAMP"
        )

    # Timestamp format check
    if not ISO_TIMESTAMP_PATTERN.match(raw_time):
        return ValidationResult(
            is_valid=False,
            rejection_reason=f"MALFORMED_TIMESTAMP_FORMAT: '{raw_time}'"
        )

    # Mandatory artist identity (must have name or MBID)
    if not raw_artname and not raw_artid:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MISSING_MANDATORY_ARTIST_IDENTIFIER"
        )

    # Mandatory track identity (must have title or MBID)
    if not raw_traname and not raw_traid:
        return ValidationResult(
            is_valid=False,
            rejection_reason="MISSING_MANDATORY_TRACK_IDENTIFIER"
        )

    warnings = []
    # MBID UUID format checks (optional fields)
    valid_artid = None
    if raw_artid:
        if UUID_REGEX.match(raw_artid):
            valid_artid = raw_artid.lower()
        else:
            warnings.append(f"INVALID_ARTIST_MBID_FORMAT: '{raw_artid}'")

    valid_traid = None
    if raw_traid:
        if UUID_REGEX.match(raw_traid):
            valid_traid = raw_traid.lower()
        else:
            warnings.append(f"INVALID_TRACK_MBID_FORMAT: '{raw_traid}'")

    sanitized = {
        "user_id": raw_uid,
        "timestamp": raw_time,
        "artist_mbid": valid_artid,
        "artist_name": raw_artname if raw_artname else None,
        "track_mbid": valid_traid,
        "track_name": raw_traname if raw_traname else None
    }

    return ValidationResult(
        is_valid=True,
        warnings=warnings,
        sanitized_fields=sanitized
    )
