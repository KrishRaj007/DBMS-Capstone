# PRD — Music Recommendation & Listening Analytics System

## 1. Overview
A DBMS capstone project for recommending songs based on user preferences and listening history, with analytics on genres, songs, and listening patterns. Uses a local MySQL database with a Node.js (Express) backend and Vite + React frontend.

## 2. Objectives
- Design a normalized relational database schema for users, songs, artists, genres, playlists, listening history, and ratings
- Implement recommendation logic using listening history and user ratings
- Provide analytics dashboards showing genre distribution, top songs, listening trends, and patterns
- Demonstrate advanced SQL: joins, aggregations, subqueries, views, stored procedures, triggers

## 3. Tech Stack
| Layer | Technology |
|-------|-----------|
| Database | MySQL 8+ |
| Backend | Node.js + Express |
| Frontend | Vite + React |
| Styling | Vanilla CSS (Inter font, custom design tokens) |

## 4. Database Schema (ER Model)

### Tables
1. **users** — id, username, email, password_hash, avatar_url, created_at, updated_at
2. **artists** — id, name, bio, image_url, created_at
3. **genres** — id, name, description, created_at
4. **songs** — id, title, artist_id (FK), genre_id (FK), album, duration_seconds, release_date, cover_url, created_at
5. **playlists** — id, user_id (FK), name, description, is_public, created_at, updated_at
6. **playlist_songs** — id, playlist_id (FK), song_id (FK), position, added_at
7. **listening_history** — id, user_id (FK), song_id (FK), listened_at, duration_listened
8. **ratings** — id, user_id (FK), song_id (FK), rating (1-5), created_at
9. **user_preferences** — id, user_id (FK), genre_id (FK), preference_weight

### Key Relationships
- songs → artists (M:1), songs → genres (M:1)
- playlists → users (M:1), playlist_songs → playlists + songs (M:M bridge)
- listening_history → users + songs
- ratings → users + songs (unique constraint)
- user_preferences → users + genres

### Advanced DB Features
- **Views**: top_songs_view, user_analytics_view, genre_popularity_view
- **Stored Procedures**: sp_get_recommendations, sp_update_preferences
- **Triggers**: after_listen_update_preferences, after_rating_update_preferences
- **Indexes**: on foreign keys, listening_history(listened_at), ratings(user_id, song_id)

## 5. Core Features

### 5.1 Authentication
- Register / Login / Logout
- Password hashing (bcrypt)
- JWT session tokens

### 5.2 Song Library
- Browse all songs with search/filter by genre, artist, title
- Song detail page with metadata

### 5.3 Listening & Ratings
- "Play" a song (simulated — logs to listening_history)
- Rate songs 1-5 stars
- View personal listening history

### 5.4 Playlists
- Create, edit, delete playlists
- Add/remove songs, reorder
- Public/private toggle

### 5.5 Recommendations
- Based on: top-rated genres, frequently listened artists, collaborative filtering (users with similar tastes)
- SQL-driven recommendation engine

### 5.6 Analytics Dashboard
- **Personal**: total listening time, top genres, top artists, listening heatmap (time of day/week)
- **Global**: most played songs, trending genres, top-rated songs, active users

## 6. Pages
1. Landing / Login / Register
2. Dashboard (analytics + recommendations)
3. Library (browse/search songs)
4. Song Detail
5. Playlists (list + detail)
6. Profile / Settings
7. FAQ

## 7. 20 Standard Components
1. Dark mode toggle
2. Cookie banner
3. Site search
4. Back to top button
5. Mobile menu
6. Loading animations
7. Hover states
8. Scroll progress bar
9. Copy button
10. Print stylesheet
11. Sticky header
12. Skip to content link
13. Password visibility toggle
14. UTM tracking
15. Form success state
16. Form error state
17. Confirmation modals
18. Last updated date
19. Expandable FAQ
20. Floating contact button

## 8. API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`

### Songs
- `GET /api/songs` (search, filter, paginate)
- `GET /api/songs/:id`

### Listening
- `POST /api/listen` (log a listen event)
- `GET /api/history` (user's history)

### Ratings
- `POST /api/ratings`
- `GET /api/ratings/user`

### Playlists
- `GET /api/playlists`
- `POST /api/playlists`
- `GET /api/playlists/:id`
- `PUT /api/playlists/:id`
- `DELETE /api/playlists/:id`
- `POST /api/playlists/:id/songs`
- `DELETE /api/playlists/:id/songs/:songId`

### Recommendations
- `GET /api/recommendations`

### Analytics
- `GET /api/analytics/personal`
- `GET /api/analytics/global`

## 9. Future Scope
- Spotify / Last.fm API integration for real song data
- Audio playback with Web Audio API
- Social features (follow users, shared playlists)
