# Music Analytics ETL Data Pipeline

A reusable, modular, memory-efficient data pipeline for extracting, cleaning, transforming, and loading large-scale music datasets (e.g. Last.fm 1K dataset with 19.1+ million scrobbles and 992 user profiles).

---

## 🏗️ Architecture: 7-Stage Modular Workflow

```mermaid
flowchart LR
    A[Extract] --> B[Validate]
    B --> C[Clean]
    C --> D[Transform]
    D --> E[Deduplicate]
    E --> F[Load]
    F --> G[Verify]
```

1. **Extract (`extract.py`)**:
   - Streams raw TSV files line-by-line using Python generators.
   - Memory-bounded chunk processing (`extract_listening_chunks`) to safely process multi-gigabyte datasets without RAM exhaustion.
   - Captures line numbers and source provenance for full trace auditability.

2. **Validate (`validate.py`)**:
   - Validates column counts and mandatory fields (`user_id`, `timestamp`, `artist`, `track`).
   - Validates numeric ranges (e.g., user age within [5, 120]).
   - Distinguishes valid records, malformed rows, and records with optional missing fields.
   - Logs malformed rows to `rejected_records.jsonl` with exact line numbers and rejection reasons without crashing.

3. **Clean (`clean.py`)**:
   - **Text Normalization**: Unicode NFKC normalization, whitespace collapsing, and unescaping HTML entities.
   - **Sentinel Nulls**: Translates empty strings, `"null"`, `"None"`, `"\\N"`, and `"-"` to `None`.
   - **Dates & Timestamps**: Parses diverse date formats into canonical `YYYY-MM-DD` and ISO-8601 UTC timestamps into `YYYY-MM-DD HH:MM:SS`.
   - **Multi-Artist Parsing**: Parses `feat.`, `ft.`, `&`, `vs.`, `with`, `featuring` into primary artist and collaborator credits while preserving the original canonical credit.
   - **Track Titles**: Preserves meaningful live/remix/acoustic version designations (e.g. `(Live_2009_4_15)`) to prevent destructive merging.

4. **Transform (`transform.py`)**:
   - Converts validated records into typed domain entities: `UserEntity`, `ArtistEntity`, `GenreEntity`, `SongEntity`, and `ScrobbleEntity`.
   - Assigns deterministic genre mappings based on artist keywords and standard taxonomy.
   - Attaches provenance metadata (`source_system`, `source_file`, `source_line`, `extracted_at`) to every entity.

5. **Deduplicate (`deduplicate.py`)**:
   - **Users**: Deduplicated strictly by `user_id`.
   - **Artists**: Deduplicated by MusicBrainz Artist ID (MBID) or normalized lowercase name. Automatically enriches existing artists when an MBID is discovered.
   - **Songs**:
     - **Strict Rule**: Never merges songs across different artists merely because titles match.
     - **Strict Rule**: Avoids destructive fuzzy deduplication.
     - Matching Key: `(artist_id, track_mbid)` or `(artist_id, normalized_lowercase_title)`.
   - **Scrobbles**: Deduplicated by `(user_id, timestamp, song_id)`. Exact duplicate listening timestamps are skipped.

6. **Load (`load.py`)**:
   - **Cleaned Intermediate Layer (`data/cleaned/`)**: Staged partitioned JSONL files (`users.jsonl`, `artists.jsonl`, `genres.jsonl`, `songs.jsonl`, `listening_history.jsonl`, `rejected_records.jsonl`, `pipeline_metrics.json`).
   - **Relational Database Layer**: Populates SQLite (`data/music_analytics.sqlite`) with tables, views, and indexes matching `Backend/db/schema.sql`, and batch loads into MySQL via `pymysql` when credentials are active.
   - **Backend JSON Bridge (`Backend/db/importedData.json`)**: Synchronizes imported data with the Express backend mock store for instant frontend interactivity.

7. **Verify (`verify.py`)**:
   - Automated post-load referential integrity check (zero orphan songs or scrobbles).
   - Uniqueness check (zero duplicate user emails, duplicate artist MBIDs, or duplicate scrobbles).
   - Missing metadata audit (confirms true `NULL`s instead of invented placeholder strings like `"Unknown"` or `"1970-01-01"`).
   - Generates a tabular verification report and quality score.

---

## 📂 Data Layer Separation

| Layer | Location | Purpose |
|---|---|---|
| **Raw Source Data** | `lastfm-dataset-1K/` | Original immutable Last.fm TSV files. Read-only. |
| **Cleaned Intermediate** | `data/cleaned/` | Validated, normalized, deduplicated JSONL files with provenance. |
| **Relational Database** | `data/music_analytics.sqlite` / MySQL | Fully indexed relational tables, foreign keys, and analytical views. |

---

## 🚀 CLI Usage

### Basic Execution (Standard Dev Limit: 50,000 scrobbles)
```bash
python pipeline/run.py --limit 50000
```

### Full Dataset Processing (All 19.1M rows)
```bash
python pipeline/run.py --limit 0 --chunk-size 50000
```

### Export Intermediate Cleaned Files Only
```bash
python pipeline/run.py --limit 100000 --export-cleaned-only
```

### Run Verification Checks Only
```bash
python pipeline/run.py --verify-only
```

---

## 📊 Verification Metrics Example

```
[Stage 7] Running Automated Post-Load Verification & Audit...
  [✅ PASS] TABLES_POPULATED: Populated counts: {'genres': 10, 'users': 992, 'artists': 1682, 'songs': 10196, 'listening_history': 50000}
  [✅ PASS] REFERENTIAL_SONGS_TO_ARTISTS: Orphaned songs referencing missing artists: 0
  [✅ PASS] REFERENTIAL_SONGS_TO_GENRES: Orphaned songs referencing missing genres: 0
  [✅ PASS] REFERENTIAL_LISTENING_HISTORY: Orphaned listens: missing users=0, missing songs=0
  [✅ PASS] UNIQUENESS_USERS: Users total: 992, unique names: 992, unique emails: 992
  [✅ PASS] UNIQUENESS_ARTIST_MBIDS: Duplicate artist MBIDs: 0
  [✅ PASS] NO_HALLUCINATED_PLACEHOLDERS: Hallucinated song titles: 0, placeholder artists: 0
  [✅ PASS] ANALYTICS_VIEWS_OPERATIONAL: Top songs view returned 10196 rows, Genre view returned 10 rows

  🎯 Data Pipeline Quality Score: 100.0%
```
