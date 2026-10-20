# BeatPulse — Music Recommendation & Listening Analytics System
### DBMS Capstone Project (Semester 3)

A full-stack relational database management system (DBMS) capstone project engineered with **MySQL 8.0+**, **Node.js (Express)** backend, and **Vite + React** frontend. It demonstrates normalized relational modeling, complex multi-table joins, subqueries, analytical SQL views, stored procedures, and event triggers for personalized music recommendation and listening telemetry.

---

## 🗄️ Database Architecture & DBMS Features

### 1. Relational Entities (3NF Normalized)
- **`users`** — User authentication, unique email/username, bcrypt password hashes, profile avatars.
- **`genres`** — Taxonomy lookup table with descriptions.
- **`artists`** — Catalog of musical artists with biographical data.
- **`songs`** — Core audio catalog with `artist_id` and `genre_id` foreign keys and indexed titles.
- **`playlists`** — User playlists with public/private status flags.
- **`playlist_songs`** — Relational Many-to-Many bridge table maintaining track sequence order (`position`).
- **`listening_history`** — Time-series telemetry logs capturing every listen event and duration.
- **`ratings`** — 1-to-5 star user evaluations with composite unique key constraints.
- **`user_preferences`** — Algorithmic genre preference weights maintained dynamically.

### 2. Analytical Database Views
- **`top_songs_view`** — Aggregates all-time play counts, distinct ratings, and average scores per song.
- **`genre_popularity_view`** — Groups song counts, cumulative plays, and mean rating per genre.
- **`user_analytics_view`** — Calculates listening hours, distinct song diversity, and total ratings per user.

### 3. Stored Procedures & Triggers
- **`sp_get_recommendations(user_id, limit)`** — Composite recommendation scoring formula:
  $$\text{Score} = (W_{\text{genre}} \times 2) + \bar{R}_{\text{song}} + \ln(1 + \text{Plays}_{\text{song}})$$
  excluding tracks already listened to frequently.
- **`sp_update_preferences(user_id)`** — Batch preference recalculation from listening logs and ratings.
- **`trg_after_listen`** — Trigger that automatically bumps genre affinity weights upon song playback.
- **`trg_after_rating`** — Trigger that adjusts genre weights proportionally when a user rates a track.

---

## 🚀 Quick Setup & Running Locally

### Prerequisites
- Node.js (v18+)
- MySQL Server (v8.0+) running locally on port 3306

### Step 1: Configure Backend Environment
Open `Backend/.env` and update your MySQL password if your local root user requires one:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=music_analytics
JWT_SECRET=super_secret_jwt_key_music_capstone_2026
```

### Step 2: Initialize Database Schema & Seed Data
Run the automated initialization script from the `Backend` directory. This creates the database, all 9 tables, 3 views, 2 stored procedures, 2 triggers, 10 genres, 20 artists, 60 songs, 3 demo users, playlists, and sample listening history:
```bash
cd Backend
npm run init-db
```

### Step 3: Start the Backend Server
```bash
cd Backend
npm run dev
# API running at http://localhost:5000
```

### Step 4: Start the Frontend Application
In a separate terminal:
```bash
cd Frontend
npm run dev
# Frontend running at http://localhost:5173
```

---

## 👤 Pre-seeded Demo Accounts

| Username | Email | Password | Music Taste |
|---|---|---|---|
| `john_doe` | john@example.com | `password123` | Pop & Rock |
| `jane_smith` | jane@example.com | `password123` | Jazz & Classical |
| `music_lover` | music@example.com | `password123` | Electronic & Hip-Hop |

*(Instant one-click demo login buttons are also provided directly on the landing and sign-in pages)*

---

## 🎨 Design System & Color Tokens

- **Font**: Inter (no fallback fonts)
- **Background**: `#1B2A4A`
- **Surface/Card**: `#24345A`
- **Primary Accent**: `#E4A0A0`
- **Secondary Accent**: `#EED9A0`
- **Text (Main)**: `#FFFFFF`
- **Text (Muted)**: `#B8C2D9`
- **Danger**: `#EF4444`
- **Border Radius**: Consistent `8px` everywhere
- **No Gradients / No Random Shadows**: Clean flat tokens adhering strictly to project guidelines.

---

## 🧩 20 Standard Baseline Components Checklist

1. [x] **Dark Mode Toggle**: Persistent dark/light theme switch in header (`ThemeToggle`)
2. [x] **Simple Cookie Banner**: Dismissible consent banner with local storage persistence (`CookieBanner`)
3. [x] **Site Search**: Live catalog search in sticky header and song library (`SiteSearch`)
4. [x] **Back to Top Button**: Smooth scroll back to top button (`BackToTop`)
5. [x] **Mobile Menu**: Responsive slide-down navigation drawer (`Header`)
6. [x] **Loading Animations**: Clean loading spinners and skeletons (`LoadingSpinner`)
7. [x] **Hover States**: Consistent elevation and accent borders on interactive elements
8. [x] **Scroll Progress Bar**: Real-time reading/scroll indicator bar along the viewport top (`ScrollProgress`)
9. [x] **Copy Button**: One-click clipboard copy for song links, playlist URLs, and demo credentials (`CopyButton`)
10. [x] **Print Stylesheet**: Clean black-and-white `@media print` formatting for academic reports
11. [x] **Sticky Header**: Fixed navigation bar with glassmorphic blur and brand icon (`Header`)
12. [x] **Skip to Content Link**: Accessible keyboard navigation jump link (`.skip-link`)
13. [x] **Password Visibility Toggle**: Show/hide toggle on password inputs (`PasswordInput`)
14. [x] **UTM Tracking**: Inbound campaign parameter capture and session telemetry (`useUtmTracking`)
15. [x] **Form Success State**: Green/accent success confirmation notifications and alerts
16. [x] **Form Error State**: Clear error validation messages and server response banners
17. [x] **Confirmation Modals**: Dialogs for destructive actions like playlist or track deletion (`ConfirmModal`)
18. [x] **Last Updated Date**: Schema version and timestamp display in footer and profile (`LastUpdatedDate`)
19. [x] **Expandable FAQ**: Interactive accordion with schema explanations and algorithms (`ExpandableFAQ`)
20. [x] **Floating Contact Button**: Quick feedback modal for project evaluation (`FloatingContact`)
