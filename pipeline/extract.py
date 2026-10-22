"""
Stage 1: Extract Module
Streaming, memory-efficient data extraction supporting Last.fm 1K TSV structure.
Uses generators and chunking to handle multi-gigabyte datasets without RAM exhaustion.
"""
from dataclasses import dataclass, field
from pathlib import Path
from typing import Generator, List, Optional, Dict, Any
import os
import sys

@dataclass
class RawRecord:
    source_file: str
    line_number: int
    raw_fields: List[str]
    raw_text: str

def extract_profiles(filepath: Path) -> Generator[RawRecord, None, None]:
    """
    Extracts user profile records from userid-profile.tsv line-by-line.
    The file begins with a header: #id \t gender \t age \t country \t registered
    """
    if not filepath.is_file():
        raise FileNotFoundError(f"Source file not found: {filepath}")

    filename = filepath.name
    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        # First line is header
        header_line = f.readline()
        line_num = 1
        for line in f:
            line_num += 1
            raw_text = line.rstrip("\r\n")
            if not raw_text:
                continue
            parts = raw_text.split("\t")
            yield RawRecord(
                source_file=filename,
                line_number=line_num,
                raw_fields=parts,
                raw_text=raw_text
            )

def extract_listening_chunks(
    filepath: Path,
    chunk_size: int = 50000,
    limit: Optional[int] = None
) -> Generator[List[RawRecord], None, None]:
    """
    Extracts listening scrobble tuples in memory-bounded chunks from the 2.5 GB dataset.
    The file does NOT have a header row.
    Format: userid \\t timestamp \\t musicbrainz-artist-id \\t artist-name \\t musicbrainz-track-id \\t track-name
    """
    if not filepath.is_file():
        raise FileNotFoundError(f"Source file not found: {filepath}")

    filename = filepath.name
    chunk: List[RawRecord] = []
    line_num = 0
    total_yielded = 0

    with open(filepath, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line_num += 1
            raw_text = line.rstrip("\r\n")
            if not raw_text:
                continue
            parts = raw_text.split("\t")

            record = RawRecord(
                source_file=filename,
                line_number=line_num,
                raw_fields=parts,
                raw_text=raw_text
            )
            chunk.append(record)

            if len(chunk) >= chunk_size:
                yield chunk
                total_yielded += len(chunk)
                chunk = []
                if limit and total_yielded >= limit:
                    break

        if chunk and (not limit or total_yielded < limit):
            if limit and (total_yielded + len(chunk) > limit):
                chunk = chunk[:(limit - total_yielded)]
            yield chunk
