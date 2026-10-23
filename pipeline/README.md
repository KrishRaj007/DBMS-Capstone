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
   - Generates deterministic `source_id` hashes (MD5 of MBID or canonical key) per entity to prevent ID collisions across multiple imports.

5. **Deduplicate (`deduplicate.py`)**:
   - **Users**: Deduplicated strictly by `user_id`.
   - **Artists**: Deduplicated by MusicBrainz Artist ID (MBID) or normalized lowercase name. Automatically enriches existing artists when an MBID is discovered.
   - **Songs**:
     - **Strict Rule**: Never merges songs across different artists merely because titles match.
     - **Strict Rule**: Avoids destructive fuzzy deduplication.
     - Matching Key: `(artist_id, track_mbid)` or `(artist_id, normalized_lowercase_title)`.
   - **Scrobbles**: Deduplicated by `(user_id, timestamp, song_id)`. Exact duplicate listening timestamps are skipped.
   - **Priming**: On re-run, the engine primes itself from the existing database to preserve existing primary keys, foreign keys, and to avoid re-inserting already-loaded scrobbles.

6. **Load (`load.py`)**:
   - **Cleaned Intermediate Layer (`data/cleaned/`)**: Staged partitioned JSONL files (`users.jsonl`, `artists.jsonl`, `genres.jsonl`, `songs.jsonl`, `listening_history.jsonl`, `rejected_records.jsonl`, `pipeline_metrics.json`).
   - **Staging Tables**: All incoming data is first written to isolated `staging_*` tables before any merge, guaranteeing atomic, rollback-capable transactions.
   - **Schema Adaptation**: `adapt_sqlite_schema()` non-destructively adds missing columns (`source_namespace`, `source_id`, `mbid`, etc.) without dropping or truncating any existing table.
   - **Repeatable Upserts**: Artists and songs are matched by source ID, MBID, or normalized name before inserting. Existing PKs are never changed; only missing metadata is enriched.
   - **User Data Preservation**: Existing user accounts, passwords, ratings, playlists, and preferences are never overwritten or deleted.
   - **Aggregated Counts**: Stores pre-aggregated play counts in `aggregated_listening_counts` without fabricating timestamps, fake sessions, or user identities.
   - **Relational Database Layer**: Populates SQLite (`data/music_analytics.sqlite`) with tables, views, and indexes matching `Backend/db/schema.sql`, and batch loads into MySQL via `pymysql` when credentials are active.
   - **Backend JSON Bridge (`Backend/db/importedData.json`)**: Synchronizes imported data with the Express backend mock store for instant frontend interactivity.

7. **Verify (`verify.py`)**:
   - 12-point automated post-load integrity audit.
   - Generates a tabular verification report and quality score.

---

## 🔒 Idempotency & Safety Guarantees

- **Re-running the pipeline is safe**: The deduplication engine primes from the existing database on every run. Records already in the database are matched and enriched — not duplicated.
- **Atomic transactions**: All database writes happen inside a single `BEGIN TRANSACTION` / `COMMIT`. Any error triggers a full `ROLLBACK`, leaving the database unchanged.
- **No destructive operations**: No `TRUNCATE`, `DROP TABLE`, or `DELETE FROM` is issued against production tables during a pipeline run.
- **No hallucinated values**: `album`, `duration_seconds`, `release_date` are stored as `NULL` when not present in the source data. No placeholder values are invented.
- **Source identifiers**: Every imported entity carries `source_namespace='lastfm'` and a deterministic `source_id` (MBID or MD5 hash of canonical key) to prevent collisions across imports from different systems.
- **Aggregated play counts**: When the source dataset contains aggregate play counts (no individual timestamps), they are stored in `aggregated_listening_counts`, not synthesized into fake listening events.

---

## 📂 Data Layer Separation

| Layer | Location | Purpose |
|---|---|---|
| **Raw Source Data** | `lastfm-dataset-1K/` | Original immutable Last.fm TSV files. Read-only. |
| **Cleaned Intermediate** | `data/cleaned/` | Validated, normalized, deduplicated JSONL files with provenance. |
| **Relational Database** | `data/music_analytics.sqlite` / MySQL | Fully indexed relational tables, foreign keys, staging buffers, and analytical views. |

---

## 🚀 CLI Usage

### Basic Execution (Standard Dev Limit: 50,000 scrobbles)
```bash
python -m pipeline.run --limit 50000
```

### Incremental Load (Extend to 100K; already-loaded rows are skipped)
```bash
python -m pipeline.run --limit 100000
```

### Full Dataset Processing (All 19.1M rows)
```bash
python -m pipeline.run --limit 0 --chunk-size 50000
```

### Export Intermediate Cleaned Files Only (No DB writes)
```bash
python -m pipeline.run --limit 100000 --export-cleaned-only
```

### Run Verification Checks Only
```bash
python -m pipeline.run --verify-only
```

---

## 📊 Verification Metrics (12-Point Audit)

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
  [✅ PASS] SOURCE_NAMESPACES_PRESERVED: Missing source namespaces: users=0, artists=0, songs=0
  [✅ PASS] INDEXES_PROVISIONED: Active indexes: 29, missing required: []
  [✅ PASS] STAGING_BUFFERS_READY: Active staging tables: ['staging_users', 'staging_artists', 'staging_songs', 'staging_listening_history', 'staging_aggregated_counts']
  [✅ PASS] AGGREGATED_COUNTS_STORAGE_READY: Aggregated listening counts table verified for non-fabricated play counts

  🎯 Data Pipeline Quality Score: 100.0%
```
