-- ============================================================
-- Music Recommendation & Listening Analytics System
-- Database Schema — MySQL 8+
-- ============================================================

CREATE DATABASE IF NOT EXISTS music_analytics;
USE music_analytics;

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE users (
  id            INT PRIMARY KEY AUTO_INCREMENT,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    VARCHAR(500) DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE genres (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE artists (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  bio        TEXT,
  image_url  VARCHAR(500) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE songs (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  title            VARCHAR(200) NOT NULL,
  artist_id        INT NOT NULL,
  genre_id         INT NOT NULL,
  album            VARCHAR(200),
  duration_seconds INT NOT NULL DEFAULT 0,
  release_date     DATE,
  cover_url        VARCHAR(500) DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_songs_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_songs_genre  FOREIGN KEY (genre_id)  REFERENCES genres(id)  ON DELETE CASCADE,

  INDEX idx_songs_artist (artist_id),
  INDEX idx_songs_genre  (genre_id),
  INDEX idx_songs_title  (title)
);

CREATE TABLE playlists (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  user_id     INT NOT NULL,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_public   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_playlists_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_playlists_user (user_id)
);

CREATE TABLE playlist_songs (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  playlist_id INT NOT NULL,
  song_id     INT NOT NULL,
  position    INT NOT NULL DEFAULT 0,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_ps_playlist FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  CONSTRAINT fk_ps_song     FOREIGN KEY (song_id)     REFERENCES songs(id)     ON DELETE CASCADE,
  UNIQUE KEY uk_playlist_song (playlist_id, song_id),
  INDEX idx_ps_playlist (playlist_id),
  INDEX idx_ps_song     (song_id)
);

CREATE TABLE listening_history (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_id           INT NOT NULL,
  song_id           INT NOT NULL,
  listened_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration_listened INT NOT NULL DEFAULT 0,

  CONSTRAINT fk_lh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lh_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  INDEX idx_lh_user        (user_id),
  INDEX idx_lh_song        (song_id),
  INDEX idx_lh_listened_at (listened_at)
);

CREATE TABLE ratings (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT NOT NULL,
  song_id    INT NOT NULL,
  rating     TINYINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT chk_rating_range   CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_ratings_user    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ratings_song    FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_song_rating (user_id, song_id),
  INDEX idx_ratings_user (user_id),
  INDEX idx_ratings_song (song_id)
);

CREATE TABLE user_preferences (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_id           INT NOT NULL,
  genre_id          INT NOT NULL,
  preference_weight DECIMAL(5,2) DEFAULT 1.00,

  CONSTRAINT fk_up_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT fk_up_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_genre_pref (user_id, genre_id),
  INDEX idx_up_user (user_id)
);

-- ────────────────────────────────────────────────────────────
-- VIEWS
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE VIEW top_songs_view AS
SELECT
  s.id,
  s.title,
  s.album,
  s.duration_seconds,
  s.cover_url,
  s.release_date,
  a.name       AS artist_name,
  a.id         AS artist_id,
  g.name       AS genre_name,
  g.id         AS genre_id,
  COUNT(lh.id)              AS play_count,
  COALESCE(AVG(r.rating),0) AS avg_rating,
  COUNT(DISTINCT r.id)      AS rating_count
FROM songs s
  JOIN artists a ON s.artist_id = a.id
  JOIN genres  g ON s.genre_id  = g.id
  LEFT JOIN listening_history lh ON s.id = lh.song_id
  LEFT JOIN ratings           r  ON s.id = r.song_id
GROUP BY s.id, s.title, s.album, s.duration_seconds, s.cover_url,
         s.release_date, a.name, a.id, g.name, g.id
ORDER BY play_count DESC;

CREATE OR REPLACE VIEW genre_popularity_view AS
SELECT
  g.id,
  g.name,
  g.description,
  COUNT(DISTINCT s.id)        AS song_count,
  COUNT(lh.id)                AS total_plays,
  COALESCE(AVG(r.rating), 0)  AS avg_rating
FROM genres g
  LEFT JOIN songs             s  ON g.id = s.genre_id
  LEFT JOIN listening_history lh ON s.id = lh.song_id
  LEFT JOIN ratings           r  ON s.id = r.song_id
GROUP BY g.id, g.name, g.description
ORDER BY total_plays DESC;

CREATE OR REPLACE VIEW user_analytics_view AS
SELECT
  u.id         AS user_id,
  u.username,
  COUNT(DISTINCT lh.id)                    AS total_listens,
  COUNT(DISTINCT lh.song_id)               AS unique_songs,
  COALESCE(SUM(lh.duration_listened), 0)   AS total_listen_seconds,
  COUNT(DISTINCT r.id)                     AS total_ratings,
  COALESCE(AVG(r.rating), 0)               AS avg_given_rating
FROM users u
  LEFT JOIN listening_history lh ON u.id = lh.user_id
  LEFT JOIN ratings           r  ON u.id = r.user_id
GROUP BY u.id, u.username;

-- ────────────────────────────────────────────────────────────
-- STORED PROCEDURES
-- ────────────────────────────────────────────────────────────

DELIMITER //

-- Recommend songs for a user based on genre preferences,
-- popularity, and average rating, excluding heavily-listened songs.
CREATE PROCEDURE sp_get_recommendations(
  IN  p_user_id INT,
  IN  p_limit   INT
)
BEGIN
  SELECT DISTINCT
    s.id,
    s.title,
    s.album,
    s.duration_seconds,
    s.cover_url,
    s.release_date,
    a.name AS artist_name,
    a.id   AS artist_id,
    g.name AS genre_name,
    g.id   AS genre_id,
    COALESCE(play_stats.play_count, 0)  AS play_count,
    COALESCE(rate_stats.avg_rating, 0)  AS avg_rating,
    COALESCE(up.preference_weight, 0)   AS genre_weight,
    -- Composite score: genre preference + avg rating + log-popularity
    (COALESCE(up.preference_weight, 0) * 2
     + COALESCE(rate_stats.avg_rating, 0)
     + LOG(1 + COALESCE(play_stats.play_count, 0))
    ) AS score
  FROM songs s
    JOIN artists a ON s.artist_id = a.id
    JOIN genres  g ON s.genre_id  = g.id
    LEFT JOIN user_preferences up
      ON s.genre_id = up.genre_id AND up.user_id = p_user_id
    LEFT JOIN (
      SELECT song_id, COUNT(*) AS play_count
      FROM listening_history
      GROUP BY song_id
    ) play_stats ON s.id = play_stats.song_id
    LEFT JOIN (
      SELECT song_id, AVG(rating) AS avg_rating
      FROM ratings
      GROUP BY song_id
    ) rate_stats ON s.id = rate_stats.song_id
  WHERE s.id NOT IN (
    SELECT song_id
    FROM listening_history
    WHERE user_id = p_user_id
    GROUP BY song_id
    HAVING COUNT(*) > 5
  )
  ORDER BY score DESC
  LIMIT p_limit;
END //

-- Recalculate preference weights for a user based on their
-- listening history and ratings.
CREATE PROCEDURE sp_update_preferences(IN p_user_id INT)
BEGIN
  -- Upsert genre weights derived from listen counts + avg ratings
  INSERT INTO user_preferences (user_id, genre_id, preference_weight)
  SELECT
    p_user_id,
    s.genre_id,
    ROUND(
      (COUNT(lh.id) * 0.3)
      + (COALESCE(AVG(r.rating), 3) * 0.7),
      2
    ) AS weight
  FROM songs s
    LEFT JOIN listening_history lh
      ON s.id = lh.song_id AND lh.user_id = p_user_id
    LEFT JOIN ratings r
      ON s.id = r.song_id AND r.user_id = p_user_id
  WHERE lh.id IS NOT NULL OR r.id IS NOT NULL
  GROUP BY s.genre_id
  ON DUPLICATE KEY UPDATE
    preference_weight = VALUES(preference_weight);
END //

-- ────────────────────────────────────────────────────────────
-- TRIGGERS
-- ────────────────────────────────────────────────────────────

-- After a new listen event, bump the genre preference weight
CREATE TRIGGER trg_after_listen
AFTER INSERT ON listening_history
FOR EACH ROW
BEGIN
  DECLARE v_genre_id INT;
  SELECT genre_id INTO v_genre_id FROM songs WHERE id = NEW.song_id;

  INSERT INTO user_preferences (user_id, genre_id, preference_weight)
  VALUES (NEW.user_id, v_genre_id, 1.00)
  ON DUPLICATE KEY UPDATE
    preference_weight = preference_weight + 0.10;
END //

-- After a new rating, adjust the genre preference weight
CREATE TRIGGER trg_after_rating
AFTER INSERT ON ratings
FOR EACH ROW
BEGIN
  DECLARE v_genre_id INT;
  SELECT genre_id INTO v_genre_id FROM songs WHERE id = NEW.song_id;

  INSERT INTO user_preferences (user_id, genre_id, preference_weight)
  VALUES (NEW.user_id, v_genre_id, NEW.rating * 0.5)
  ON DUPLICATE KEY UPDATE
    preference_weight = GREATEST(preference_weight, NEW.rating * 0.5);
END //

DELIMITER ;
