"""
Stage 3: Clean Module
Text normalization, Unicode NFKC cleaning, whitespace handling, multi-artist extraction,
date/timestamp parsing, and null value sanitization without inventing placeholder data.
"""
from dataclasses import dataclass, field
from datetime import datetime
import html
import re
from typing import List, Optional, Tuple, Dict, Any
import unicodedata

# Multi-artist collaboration delimiters
# e.g., "Dark Globe Feat. Boy George", "Queen & David Bowie", "Woolfy Vs. Projections"
COLLABORATION_PATTERN = re.compile(
    r"\s+(?:feat\.?|ft\.?|featuring|vs\.?|with|&)\s+",
    re.IGNORECASE
)

# Common sentinel null strings
NULL_SENTINELS = {"", "null", "none", "\\n", "undefined", "n/a", "na", "-", "--"}

def normalize_text(text: Optional[str]) -> Optional[str]:
    """
    Normalizes a text string:
    - Unicode NFKC canonical normalization
    - Strips leading/trailing whitespace
    - Replaces internal multi-spaces/tabs with a single space
    - Converts null sentinels to None
    """
    if text is None:
        return None

    # Canonical unicode normalization
    norm = unicodedata.normalize("NFKC", str(text))

    # Strip control characters except newline/tab
    norm = "".join(ch for ch in norm if unicodedata.category(ch)[0] != "C" or ch in " \t\n")

    # Unescape HTML entities
    norm = html.unescape(norm)

    # Collapse internal whitespace
    norm = re.sub(r"\s+", " ", norm).strip()

    # Check for empty or null sentinels
    if norm.lower() in NULL_SENTINELS:
        return None

    return norm

def clean_date_string(raw_date: Optional[str]) -> Optional[str]:
    """
    Parses various date formats to ISO YYYY-MM-DD.
    e.g. 'Aug 13, 2006' -> '2006-08-13'
    Returns None if unparseable or absent. Never invents default dates.
    """
    cleaned = normalize_text(raw_date)
    if not cleaned:
        return None

    date_formats = [
        "%b %d, %Y",       # Aug 13, 2006
        "%B %d, %Y",       # August 13, 2006
        "%b %d %Y",        # Aug 13 2006
        "%d %b %Y",        # 13 Aug 2006
        "%Y-%m-%d",        # 2006-08-13
        "%Y/%m/%d",        # 2006/08/13
        "%d/%m/%Y",        # 13/08/2006
    ]

    for fmt in date_formats:
        try:
            dt = datetime.strptime(cleaned, fmt)
            # Basic sanity check: year between 1900 and 2030
            if 1900 <= dt.year <= 2030:
                return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue

    return None

def clean_timestamp_string(raw_ts: Optional[str]) -> Optional[str]:
    """
    Parses ISO-8601 UTC timestamp string to standard SQL format YYYY-MM-DD HH:MM:SS.
    e.g. '2009-05-04T23:08:57Z' -> '2009-05-04 23:08:57'
    """
    cleaned = normalize_text(raw_ts)
    if not cleaned:
        return None

    # Replace Z with empty or parse with ISO
    iso_str = cleaned.rstrip("Z")
    try:
        dt = datetime.fromisoformat(iso_str)
        return dt.strftime("%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None

@dataclass
class ArtistCredit:
    primary_artist: str
    original_credit: str
    collaborators: List[str] = field(default_factory=list)

def parse_artist_credit(raw_artist: Optional[str]) -> ArtistCredit:
    """
    Preserves meaningful multi-artist credits while extracting primary and collaborators.
    e.g. 'Jazzanova Feat. Leon Ware & Dwele'
      -> primary: 'Jazzanova'
      -> collaborators: ['Leon Ware', 'Dwele']
      -> original_credit: 'Jazzanova Feat. Leon Ware & Dwele'
    """
    cleaned = normalize_text(raw_artist) or "Unknown Artist"
    parts = COLLABORATION_PATTERN.split(cleaned)

    primary = normalize_text(parts[0]) or cleaned
    collaborators: List[str] = []

    if len(parts) > 1:
        for p in parts[1:]:
            # Further split by comma if present
            subparts = p.split(",")
            for sp in subparts:
                c = normalize_text(sp)
                if c and c.lower() != primary.lower() and c not in collaborators:
                    collaborators.append(c)

    return ArtistCredit(
        primary_artist=primary,
        original_credit=cleaned,
        collaborators=collaborators
    )

def clean_track_title(raw_title: Optional[str]) -> str:
    """
    Sanitizes track titles:
    - Strips leading/trailing decorative quotes
    - Preserves vital version info (e.g. '(Live)', '[Remix]', '(Acoustic)')
    - Never invents fake titles
    """
    cleaned = normalize_text(raw_title)
    if not cleaned:
        return "Untitled Track"

    # Strip surrounding quotes if wrapped
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        cleaned = cleaned[1:-1].strip()

    return cleaned or "Untitled Track"
