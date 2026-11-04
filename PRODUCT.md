# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are university academic evaluators, professors, and technical peers assessing a Semester 3 Database Management Systems (DBMS) capstone project, alongside music listeners testing an interactive recommendation and telemetry client. Their objective is to inspect normalized relational architecture, test analytical SQL views, observe multi-strategy algorithmic recommendations in action, and track personal and global listening telemetry.

## Product Purpose

BeatPulse demonstrates how rigorous relational database design (3NF normalization, foreign key constraints, composite indexes, atomic transactions, stored procedures, event triggers, and analytical views) powers a production-style music discovery and telemetry platform. It bridges high-volume historical scrobble data (Last.fm 1K dataset) with real-time interactive user actions (streaming playback, star ratings, playlist curation, and adaptive recommendations).

## Positioning

Unlike typical frontend mock music players or opaque black-box machine learning recommenders, BeatPulse provides a transparent, verifiable relational recommendation engine and telemetry suite. Every recommendation includes an explainable SQL/algorithmic rationale (e.g., popularity baseline, artist/genre affinity, or collaborative peer filtering), and all analytics explicitly differentiate live authenticated user interactions from imported historical archives without synthetic hallucinations.

## Operating Context

- **Academic Evaluation**: Demonstrating ACID compliance, SQL joins, subqueries, analytical views (`top_songs_view`, `genre_popularity_view`, `user_analytics_view`), stored procedures (`sp_get_recommendations`, `sp_update_preferences`), and triggers (`trg_after_listen`, `trg_after_rating`).
- **Interactive Web Client**: Single Page Application running on modern desktop and responsive mobile browsers (Vite + React, Vanilla CSS).
- **Dual Relational Engines**: Local SQLite database for zero-config portability alongside a MySQL 8.0+ production schema with automated migration scripts.
- **Data Pipeline**: Memory-bounded 7-stage Python ETL streaming 19.1M+ Last.fm scrobbles without memory exhaustion or primary key collision.

## Capabilities and Constraints

- **Authentication & Roles**: Session-backed authentication with bcrypt password hashing and pre-seeded demo personas (`john_doe`, `jane_smith`, `music_lover`).
- **Song Catalog & Discovery**: Search, filter, and pagination across 18,000+ catalog tracks and 3,300+ artists mapped to a 10-genre taxonomy.
- **Multi-Strategy Recommendations**:
  1. *Popularity & Diversity Baseline*: Cold-start fallback with log play scaling and Bayesian rating bonus; strict artist diversity limits.
  2. *Content-Based Affinity*: Recalculated user-genre and artist preferences dynamically updated via database triggers.
  3. *Collaborative Filtering*: Jaccard overlap between listener scrobbles.
  4. *Anti-Repetition Rule*: Strictly excludes already played or rated tracks.
- **Listening & Rating Telemetry**: Simulated playback logging to `listening_history`; 1–5 star ratings stored in `ratings` with composite uniqueness.
- **Playlists**: Full CRUD management with ordered many-to-many bridge (`playlist_songs`).
- **Strict Scope Lock**: Only explicitly specified features are built; no speculative abstractions or unrequested frameworks.
- **Design System Tokens**: Strictly locked to `#06202A` (Background), `#0E3345` (Surface/Card), `#10B981` (Primary Emerald), `#A7F3D0` (Secondary Mint Gold), `#FFFFFF` (Text Main), `#94B7C7` (Text Muted), `#EF4444` (Danger), `8px` border radius, no gradients, no arbitrary box-shadows, and `Inter` font everywhere.
- **20 Baseline Components**: Dark mode toggle, cookie banner, site search, back to top, mobile menu, loading animations, hover states, scroll progress bar, copy button, print stylesheet, sticky header, skip to content link, password toggle, UTM tracking, form success/error states, confirmation modals, last updated date, expandable FAQ, and floating contact button.

## Brand Commitments

- **Name**: BeatPulse — Music Recommendation & Listening Analytics System.
- **Visual Palette**: Strict Midnight Teal / Vibrant Emerald / Mint Gold token set with 8px border radius.
- **Typography**: Inter across all headings, body text, buttons, and form inputs without fallback fonts.
- **Tone**: Clean, academic yet polished, technically precise, and transparent.

## Evidence on Hand

- **Cleaned Relational Catalog**: Populated `data/music_analytics.sqlite` with 10 genres, 992 users, 3,311 artists, 18,002 songs, and 100,000 verified scrobbles.
- **Audit Verification Report**: 100% Quality Score across 12 automated integrity checks in `pipeline/verify.py` (zero orphan records, zero duplicate MBIDs, zero hallucinated placeholders).
- **Automated Test Suites**: 36 Python ETL unit tests and 46 backend Jest test suites passing.
- **Raw Archive**: Last.fm 1K user dataset located at `lastfm-dataset-1K/lastfm-dataset-1K/` (2.53 GB TSV scrobble log).
- **Prohibitions**: Never invent fake ratings, fake user profiles, or synthetic listen durations; missing metadata must remain `NULL`.

## Product Principles

1. **Relational Ground Truth**: Interface states, telemetry, and recommendations derive directly from verified database records rather than mock client fabrications.
2. **Transparent Provenance**: Clearly distinguish between live user-generated interactions (`source_namespace: 'local'`) and imported historical dataset archives (`source_namespace: 'lastfm'`).
3. **Strict Design Discipline**: Faithfully adhere to the locked design token system, `Inter` typography, and 8px radii across every component.
4. **Resilient Data Integrity**: Preserve referential integrity and zero-loss guarantees across all ingestion, rating, and playlist operations.
5. **Academic Clarity**: Make database operations, recommendation rationales, and analytical view outputs inspectable and explainable.

## Accessibility & Inclusion

- Keyboard navigability with skip-to-content anchor (`.skip-link`).
- Semantic HTML tags, ARIA labels on icon buttons (play, ratings, modal controls), and clear contrast ratios matching WCAG 2.1 AA against dark surface backgrounds.
- High-contrast print stylesheet (`@media print`) for academic report generation.

