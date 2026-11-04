"""
Pipeline Orchestrator & CLI Runner
Executes the complete 7-stage modular ETL workflow:
Extract → Validate → Clean → Transform → Deduplicate → Load → Verify
"""
import argparse
from datetime import datetime, timezone
import os
from pathlib import Path
import sys
import time
from typing import Dict, Any, List

# Reconfigure stdout for utf-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Ensure pipeline root is in sys.path
PIPELINE_ROOT = Path(__file__).resolve().parent.parent
if str(PIPELINE_ROOT) not in sys.path:
    sys.path.insert(0, str(PIPELINE_ROOT))

from pipeline.config import (
    RAW_PROFILES_FILE,
    RAW_LISTENING_FILE,
    DEFAULT_CHUNK_SIZE,
    DEFAULT_DEV_LIMIT,
    SQLITE_DB_PATH,
    DB_HOST,
    DB_PORT,
    DB_USER,
    DB_PASSWORD,
    DB_NAME
)
from pipeline.extract import extract_profiles, extract_listening_chunks
from pipeline.validate import validate_profile_record, validate_listening_record
from pipeline.transform import transform_profile_entity, transform_scrobble_entity
from pipeline.deduplicate import DeduplicationEngine
from pipeline.load import (
    write_intermediate_genres,
    write_intermediate_users,
    write_intermediate_artists,
    write_intermediate_songs,
    append_intermediate_scrobbles,
    append_rejected_records,
    write_pipeline_metrics,
    adapt_sqlite_schema,
    load_to_sqlite,
    load_to_mysql,
    sync_backend_json_bridge
)
from pipeline.verify import run_verification, run_mysql_verification
import sqlite3

def run_pipeline(
    limit: int = DEFAULT_DEV_LIMIT,
    chunk_size: int = DEFAULT_CHUNK_SIZE,
    export_cleaned_only: bool = False,
    run_verify: bool = True,
    skip_mysql: bool = False
) -> Dict[str, Any]:
    """
    Executes the modular 7-stage ETL pipeline with MySQL as the primary target.
    """
    t_start = time.time()
    print("=" * 70)
    print("🚀 STARTING MUSIC ANALYTICS ETL DATA PIPELINE")
    print(f"Workflow: Extract → Validate → Clean → Transform → Deduplicate → Load → Verify")
    limit_str = f"{limit:,}" if limit else "ALL (~19.1M)"
    print(f"Listening Row Limit: {limit_str} | Chunk Size: {chunk_size:,} | MySQL Primary: {not skip_mysql}")
    print("=" * 70)

    engine = DeduplicationEngine()

    # Prime deduplication engine from existing database to preserve existing PKs/FKs and avoid re-import duplicates
    primed_source = "None"
    if not skip_mysql:
        try:
            import pymysql
            mysql_conn = pymysql.connect(
                host=DB_HOST, port=DB_PORT, user=DB_USER, password=DB_PASSWORD, database=DB_NAME, charset="utf8mb4"
            )
            engine.prime_from_mysql(mysql_conn)
            mysql_conn.close()
            primed_source = "MySQL"
            print(f"  ✓ Preserved existing MySQL database: Primed {len(engine.artist_name_to_id):,} artists, "
                  f"{len(engine.song_title_to_id):,} songs, {len(engine.seen_scrobbles):,} scrobbles")
        except Exception as e:
            print(f"  ⚠️ Warning: Could not prime from MySQL ({e}).")

    if primed_source != "MySQL" and SQLITE_DB_PATH.is_file():
        conn = sqlite3.connect(str(SQLITE_DB_PATH))
        adapt_sqlite_schema(conn)
        engine.prime_from_database(conn)
        conn.close()
        print(f"  ✓ Preserved existing SQLite database: Primed {len(engine.artist_name_to_id):,} artists, "
              f"{len(engine.song_title_to_id):,} songs, {len(engine.seen_scrobbles):,} scrobbles")

    rejected_records: List[Dict[str, Any]] = []
    scrobbles_buffer: List[Dict[str, Any]] = []

    # Reset intermediate scrobble and rejected logs
    append_intermediate_scrobbles([], reset=True)
    append_rejected_records([], reset=True)

    metrics = {
        "started_at": datetime.now(timezone.utc).isoformat(),
        "profiles": {
            "processed": 0,
            "accepted": 0,
            "rejected": 0,
            "skipped": 0
        },
        "scrobbles": {
            "processed": 0,
            "accepted": 0,
            "rejected": 0,
            "skipped": 0,
            "malformed_reasons": {}
        },
        "entities": {
            "unique_users": 0,
            "unique_artists": 0,
            "artists_updated": 0,
            "unique_songs": 0,
            "songs_updated": 0,
            "total_scrobbles_loaded": 0
        }
    }

    # ────────────────────────────────────────────────────────────
    # PHASE 1: USER PROFILES ETL
    # ────────────────────────────────────────────────────────────
    print("\n[Stage 1-5] Processing User Profiles (userid-profile.tsv)...")
    t0_prof = time.time()
    for raw_rec in extract_profiles(RAW_PROFILES_FILE):
        metrics["profiles"]["processed"] += 1

        val = validate_profile_record(raw_rec)
        if not val.is_valid:
            metrics["profiles"]["rejected"] += 1
            rejected_records.append({
                "source": raw_rec.source_file,
                "line": raw_rec.line_number,
                "reason": val.rejection_reason,
                "raw": raw_rec.raw_text
            })
            continue

        user_entity = transform_profile_entity(
            val.sanitized_fields,
            raw_rec.source_file,
            raw_rec.line_number
        )

        is_new, _ = engine.process_user(user_entity)
        if is_new:
            metrics["profiles"]["accepted"] += 1
        else:
            metrics["profiles"]["skipped"] += 1

    dur_prof = time.time() - t0_prof
    print(f"  ✓ Processed {metrics['profiles']['processed']:,} profile rows in {dur_prof:.2f}s "
          f"({metrics['profiles']['accepted']:,} accepted, {metrics['profiles']['skipped']:,} skipped duplicates, "
          f"{metrics['profiles']['rejected']:,} rejected)")

    # ────────────────────────────────────────────────────────────
    # PHASE 2: SCROBBLE LISTENING HISTORY CHUNKED ETL
    # ────────────────────────────────────────────────────────────
    print(f"\n[Stage 1-5] Processing Scrobbles (userid-timestamp-artid-artname-traid-traname.tsv)...")
    t0_scrob = time.time()
    total_scrobbles_processed = 0

    actual_limit = limit if limit and limit > 0 else None
    chunk_idx = 0

    for chunk in extract_listening_chunks(RAW_LISTENING_FILE, chunk_size=chunk_size, limit=actual_limit):
        chunk_idx += 1
        t_chunk_start = time.time()
        chunk_rejected: List[Dict[str, Any]] = []
        chunk_scrobbles: List[Dict[str, Any]] = []

        for raw_rec in chunk:
            total_scrobbles_processed += 1
            metrics["scrobbles"]["processed"] += 1

            # Stage 2: Validate
            val = validate_listening_record(raw_rec)
            if not val.is_valid:
                metrics["scrobbles"]["rejected"] += 1
                reason = val.rejection_reason or "UNKNOWN_ERROR"
                metrics["scrobbles"]["malformed_reasons"][reason] = (
                    metrics["scrobbles"]["malformed_reasons"].get(reason, 0) + 1
                )
                chunk_rejected.append({
                    "source": raw_rec.source_file,
                    "line": raw_rec.line_number,
                    "reason": reason,
                    "raw": raw_rec.raw_text
                })
                continue

            # Stage 3 & 4: Clean & Transform
            artist_ent, song_ent, scrobble_ent = transform_scrobble_entity(
                val.sanitized_fields,
                raw_rec.source_file,
                raw_rec.line_number
            )

            # Stage 5: Deduplicate
            art_id, _ = engine.process_artist(artist_ent)
            song_id, _ = engine.process_song(song_ent, art_id)

            scrobble_ok, scrobble_dict = engine.process_scrobble(scrobble_ent, song_id)
            if scrobble_ok:
                metrics["scrobbles"]["accepted"] += 1
                chunk_scrobbles.append(scrobble_dict)
            else:
                metrics["scrobbles"]["skipped"] += 1

        # Append intermediate chunk
        if chunk_scrobbles:
            append_intermediate_scrobbles(chunk_scrobbles)
            scrobbles_buffer.extend(chunk_scrobbles)

        if chunk_rejected:
            append_rejected_records(chunk_rejected)

        chunk_dur = time.time() - t_chunk_start
        rate = len(chunk) / chunk_dur if chunk_dur > 0 else 0
        print(f"  Chunk #{chunk_idx:02d}: {total_scrobbles_processed:,} scrobbles processed "
              f"({rate:,.0f} rows/s) | Artists: {len(engine.artists_by_id):,} | Songs: {len(engine.songs_by_id):,}")

    dur_scrob = time.time() - t0_scrob
    print(f"\n  ✓ Completed Scrobble Extraction & Transformation in {dur_scrob:.2f}s "
          f"({total_scrobbles_processed/dur_scrob:,.0f} rows/s overall throughput)")

    # ────────────────────────────────────────────────────────────
    # PHASE 3: WRITE CLEANED INTERMEDIATE DATA LAYER
    # ────────────────────────────────────────────────────────────
    print("\n[Stage 6] Writing Cleaned Intermediate Layer (data/cleaned/)...")
    write_intermediate_genres()
    write_intermediate_users(engine.users)
    write_intermediate_artists(engine.artists_by_id)
    write_intermediate_songs(engine.songs_by_id, engine.artists_by_id)
    print("  ✓ Staged Cleaned Entities into JSONL (users, artists, genres, songs, listening_history, rejected)")

    # ────────────────────────────────────────────────────────────
    # PHASE 4: TARGET DATABASE LOADING
    # ────────────────────────────────────────────────────────────
    sqlite_counts = {}
    mysql_report = {}
    if not export_cleaned_only:
        print("\n[Stage 6] Loading into Relational Databases...")

        # 1. Primary MySQL Target Loader
        if not skip_mysql:
            print("  → Populating MySQL database (Primary Data Source)...")
            mysql_report = load_to_mysql(
                users=engine.users,
                artists=engine.artists_by_id,
                songs=engine.songs_by_id,
                artist_name_to_id=engine.artist_name_to_id,
                scrobbles=scrobbles_buffer
            )
            print(f"    ✓ MySQL populated successfully:")
            print(f"      • Table counts: {mysql_report.get('table_counts', {})}")
            print(f"      • New inserted: {mysql_report.get('inserted_records', {})}")
            print(f"      • Duplicates avoided: {mysql_report.get('duplicate_records', {})}")
        else:
            print("  ℹ MySQL loading skipped via --skip-mysql flag.")

        # 2. SQLite Relational Store (Secondary / Backup Store)
        print(f"  → Populating SQLite database: {SQLITE_DB_PATH} ...")
        sqlite_counts = load_to_sqlite(
            users=engine.users,
            artists=engine.artists_by_id,
            songs=engine.songs_by_id,
            artist_name_to_id=engine.artist_name_to_id,
            scrobbles=scrobbles_buffer
        )
        print(f"    ✓ SQLite loaded: {sqlite_counts}")

        # 3. Backend JSON Bridge (for offline mock test runs)
        sync_backend_json_bridge(
            users=engine.users,
            artists=engine.artists_by_id,
            songs=engine.songs_by_id,
            artist_name_to_id=engine.artist_name_to_id,
            scrobbles=scrobbles_buffer
        )
        print("  ✓ Synced data with Backend API JSON bridge.")

    # ────────────────────────────────────────────────────────────
    # PHASE 5: VERIFICATION & AUDIT
    # ────────────────────────────────────────────────────────────
    verification_summary = None
    mysql_verification_summary = None
    if run_verify and not export_cleaned_only:
        print("\n[Stage 7] Running Automated Post-Load Verification & Audit...")

        # Verify MySQL (Primary)
        if not skip_mysql:
            print("  --- MySQL Integrity Audit ---")
            mysql_v_report = run_mysql_verification()
            mysql_verification_summary = {
                "total_checks": mysql_v_report.total_checks,
                "passed_checks": mysql_v_report.passed_checks,
                "failed_checks": mysql_v_report.failed_checks,
                "quality_score": mysql_v_report.quality_score,
                "checks": [{"name": c.name, "passed": c.passed, "details": c.details} for c in mysql_v_report.checks]
            }
            for c in mysql_v_report.checks:
                mark = "✅ PASS" if c.passed else "❌ FAIL"
                print(f"  [{mark}] {c.name}: {c.details}")
            print(f"  🎯 MySQL Quality Score: {mysql_v_report.quality_score}%")

        # Verify SQLite
        print("  --- SQLite Integrity Audit ---")
        v_report = run_verification()
        verification_summary = {
            "total_checks": v_report.total_checks,
            "passed_checks": v_report.passed_checks,
            "failed_checks": v_report.failed_checks,
            "quality_score": v_report.quality_score,
            "checks": [{"name": c.name, "passed": c.passed, "details": c.details} for c in v_report.checks]
        }
        for c in v_report.checks:
            mark = "✅ PASS" if c.passed else "❌ FAIL"
            print(f"  [{mark}] {c.name}: {c.details}")
        print(f"  🎯 SQLite Quality Score: {v_report.quality_score}%")

    total_time = time.time() - t_start
    metrics["finished_at"] = datetime.now(timezone.utc).isoformat()
    metrics["total_elapsed_seconds"] = round(total_time, 2)
    metrics["entities"]["unique_users"] = len(engine.users)
    metrics["entities"]["unique_artists"] = len(engine.artists_by_id)
    metrics["entities"]["artists_updated"] = engine.stats.artists_updated_mbid
    metrics["entities"]["unique_songs"] = len(engine.songs_by_id)
    metrics["entities"]["songs_updated"] = engine.stats.songs_updated_mbid
    metrics["entities"]["total_scrobbles_loaded"] = len(scrobbles_buffer)
    metrics["database_counts"] = sqlite_counts
    metrics["mysql_import_report"] = mysql_report
    metrics["verification"] = {
        "mysql": mysql_verification_summary,
        "sqlite": verification_summary
    }

    write_pipeline_metrics(metrics)

    print("\n" + "=" * 70)
    print(f"✨ PIPELINE EXECUTION COMPLETED IN {total_time:.2f}s")
    print(f"📊 SUMMARY:")
    print(f"   - Profiles Processed: {metrics['profiles']['processed']:,} | Accepted: {metrics['profiles']['accepted']:,}")
    print(f"   - Scrobbles Processed: {metrics['scrobbles']['processed']:,} | Accepted: {metrics['scrobbles']['accepted']:,}")
    print(f"   - Unique Users: {metrics['entities']['unique_users']:,}")
    print(f"   - Unique Artists: {metrics['entities']['unique_artists']:,} (Updated with MBID: {metrics['entities']['artists_updated']:,})")
    print(f"   - Unique Songs: {metrics['entities']['unique_songs']:,} (Updated with MBID: {metrics['entities']['songs_updated']:,})")
    print(f"   - Scrobbles Stored: {metrics['entities']['total_scrobbles_loaded']:,}")
    if mysql_report and "table_counts" in mysql_report:
        print(f"   - MySQL Table Counts: {mysql_report['table_counts']}")
    print(f"   - Cleaned Intermediate Data: {Path('data/cleaned').resolve()}")
    print("=" * 70)

    return metrics

def main():
    parser = argparse.ArgumentParser(description="Last.fm 1K Dataset Modular ETL Pipeline")
    parser.add_argument("--limit", type=int, default=DEFAULT_DEV_LIMIT, help="Number of scrobble rows to process (0 = all 19M rows)")
    parser.add_argument("--chunk-size", type=int, default=DEFAULT_CHUNK_SIZE, help="Chunk size for batch processing")
    parser.add_argument("--export-cleaned-only", action="store_true", help="Stop after staging intermediate cleaned layer")
    parser.add_argument("--verify-only", action="store_true", help="Run verification checks on existing database")
    parser.add_argument("--skip-mysql", action="store_true", help="Skip loading to MySQL database (SQLite only)")

    args = parser.parse_args()

    if args.verify_only:
        print("Running MySQL verification checks...")
        if not args.skip_mysql:
            m_report = run_mysql_verification()
            for c in m_report.checks:
                mark = "✅ PASS" if c.passed else "❌ FAIL"
                print(f"  [{mark}] {c.name}: {c.details}")
            print(f"MySQL Quality Score: {m_report.quality_score}%\n")

        print("Running SQLite verification checks...")
        v_report = run_verification()
        for c in v_report.checks:
            mark = "✅ PASS" if c.passed else "❌ FAIL"
            print(f"  [{mark}] {c.name}: {c.details}")
        print(f"SQLite Quality Score: {v_report.quality_score}%")
        return

    run_pipeline(
        limit=args.limit,
        chunk_size=args.chunk_size,
        export_cleaned_only=args.export_cleaned_only,
        run_verify=True,
        skip_mysql=args.skip_mysql
    )

if __name__ == "__main__":
    main()
