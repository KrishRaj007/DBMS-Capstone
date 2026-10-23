-- ============================================================
-- Music Recommendation & Listening Analytics System
-- Database Schema — MySQL 8+ (Adapted & Extended)
-- ============================================================

CREATE DATABASE IF NOT EXISTS music_analytics;
USE music_analytics;

-- ────────────────────────────────────────────────────────────
-- TABLES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  username         VARCHAR(50)  NOT NULL UNIQUE,
  email            VARCHAR(100) NOT NULL UNIQUE,
  password_hash    VARCHAR(255) NOT NULL,
  avatar_url       VARCHAR(500) DEFAULT NULL,
  gender           VARCHAR(10)  DEFAULT NULL,
  age              INT          DEFAULT NULL,
  country          VARCHAR(100) DEFAULT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'local',
  source_id        VARCHAR(100) DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_source (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS genres (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  name        VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS artists (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  name             VARCHAR(100) NOT NULL,
  bio              TEXT,
  image_url        VARCHAR(500) DEFAULT NULL,
  mbid             VARCHAR(36)  DEFAULT NULL,
  original_credit  VARCHAR(255) DEFAULT NULL,
  genre_id         INT          DEFAULT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'local',
  source_id        VARCHAR(100) DEFAULT NULL,
  created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_artists_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL,
  INDEX idx_artists_name   (name),
  INDEX idx_artists_mbid   (mbid),
  INDEX idx_artists_source (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS songs (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  title            VARCHAR(200) NOT NULL,
  artist_id        INT NOT NULL,
  genre_id         INT NOT NULL,
  album            VARCHAR(200),
  duration_seconds INT NOT NULL DEFAULT 0,
  release_date     DATE,
  cover_url        VARCHAR(500) DEFAULT NULL,
  track_mbid       VARCHAR(36)  DEFAULT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'local',
  source_id        VARCHAR(100) DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_songs_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_songs_genre  FOREIGN KEY (genre_id)  REFERENCES genres(id)  ON DELETE CASCADE,

  INDEX idx_songs_artist       (artist_id),
  INDEX idx_songs_genre        (genre_id),
  INDEX idx_songs_title        (title),
  INDEX idx_songs_artist_title (artist_id, title),
  INDEX idx_songs_track_mbid   (track_mbid),
  INDEX idx_songs_release      (release_date),
  INDEX idx_songs_source       (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS playlists (
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

CREATE TABLE IF NOT EXISTS playlist_songs (
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

CREATE TABLE IF NOT EXISTS listening_history (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_id           INT NOT NULL,
  song_id           INT NOT NULL,
  listened_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  duration_listened INT NOT NULL DEFAULT 0,
  source_namespace  VARCHAR(50) NOT NULL DEFAULT 'local',
  source_id         VARCHAR(100) DEFAULT NULL,

  CONSTRAINT fk_lh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_lh_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
  INDEX idx_lh_user          (user_id),
  INDEX idx_lh_song          (song_id),
  INDEX idx_lh_listened_at   (listened_at),
  INDEX idx_lh_user_listened (user_id, listened_at),
  INDEX idx_lh_song_listened (song_id, listened_at),
  INDEX idx_lh_source        (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS ratings (
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

CREATE TABLE IF NOT EXISTS user_preferences (
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
-- AGGREGATED LISTENING COUNTS
-- Stores pre-aggregated play counts without fabricating timestamps,
-- user identities, completion rates, or listening sessions.
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS aggregated_listening_counts (
  id               INT PRIMARY KEY AUTO_INCREMENT,
  user_id          INT DEFAULT NULL,
  artist_id        INT NOT NULL,
  song_id          INT DEFAULT NULL,
  play_count       INT NOT NULL DEFAULT 0,
  source_namespace VARCHAR(50) NOT NULL DEFAULT 'dataset',
  source_id        VARCHAR(100) DEFAULT NULL,
  last_updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_alc_user   FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE CASCADE,
  CONSTRAINT fk_alc_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_alc_song   FOREIGN KEY (song_id)   REFERENCES songs(id)   ON DELETE CASCADE,

  UNIQUE KEY uk_alc_entry (source_namespace, user_id, artist_id, song_id),
  INDEX idx_alc_user   (user_id),
  INDEX idx_alc_artist (artist_id),
  INDEX idx_alc_song   (song_id)
);

-- ────────────────────────────────────────────────────────────
-- STAGING TABLES (For Atomic, Isolated ETL Bulk Imports)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS staging_users (
  source_id        VARCHAR(100) NOT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
  username         VARCHAR(50)  NOT NULL,
  email            VARCHAR(100) NOT NULL,
  password_hash    VARCHAR(255) NOT NULL,
  gender           VARCHAR(10)  DEFAULT NULL,
  age              INT          DEFAULT NULL,
  country          VARCHAR(100) DEFAULT NULL,
  registered_at    TIMESTAMP    NULL,
  PRIMARY KEY (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS staging_artists (
  source_id        VARCHAR(100) NOT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
  name             VARCHAR(100) NOT NULL,
  mbid             VARCHAR(36)  DEFAULT NULL,
  original_credit  VARCHAR(255) DEFAULT NULL,
  genre_id         INT          DEFAULT NULL,
  PRIMARY KEY (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS staging_songs (
  source_id        VARCHAR(100) NOT NULL,
  source_namespace VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
  title            VARCHAR(200) NOT NULL,
  artist_source_id VARCHAR(100) NOT NULL,
  track_mbid       VARCHAR(36)  DEFAULT NULL,
  album            VARCHAR(200) DEFAULT NULL,
  duration_seconds INT          DEFAULT 0,
  release_date     DATE         DEFAULT NULL,
  genre_id         INT          DEFAULT NULL,
  PRIMARY KEY (source_namespace, source_id)
);

CREATE TABLE IF NOT EXISTS staging_listening_history (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_source_id    VARCHAR(100) NOT NULL,
  song_source_id    VARCHAR(100) NOT NULL,
  listened_at       TIMESTAMP    NOT NULL,
  duration_listened INT          DEFAULT 0,
  source_namespace  VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
  INDEX idx_slh_lookup (user_source_id, song_source_id, listened_at)
);

CREATE TABLE IF NOT EXISTS staging_aggregated_counts (
  id                INT PRIMARY KEY AUTO_INCREMENT,
  user_source_id    VARCHAR(100) DEFAULT NULL,
  artist_source_id  VARCHAR(100) NOT NULL,
  song_source_id    VARCHAR(100) DEFAULT NULL,
  play_count        INT          NOT NULL DEFAULT 0,
  source_namespace  VARCHAR(50)  NOT NULL DEFAULT 'dataset',
  INDEX idx_sac_lookup (source_namespace, user_source_id, artist_source_id, song_source_id)
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
  (COALESCE(lh_stats.play_count, 0) + COALESCE(agg_stats.agg_plays, 0)) AS play_count,
  COALESCE(rate_stats.avg_rating, 0) AS avg_rating,
  COALESCE(rate_stats.rating_count, 0) AS rating_count
FROM songs s
  JOIN artists a ON s.artist_id = a.id
  JOIN genres  g ON s.genre_id  = g.id
  LEFT JOIN (
    SELECT song_id, COUNT(*) AS play_count
    FROM listening_history
    GROUP BY song_id
  ) lh_stats ON s.id = lh_stats.song_id
  LEFT JOIN (
    SELECT song_id, SUM(play_count) AS agg_plays
    FROM aggregated_listening_counts
    WHERE song_id IS NOT NULL
    GROUP BY song_id
  ) agg_stats ON s.id = agg_stats.song_id
  LEFT JOIN (
    SELECT song_id, AVG(rating) AS avg_rating, COUNT(DISTINCT id) AS rating_count
    FROM ratings
    GROUP BY song_id
  ) rate_stats ON s.id = rate_stats.song_id
ORDER BY play_count DESC;

CREATE OR REPLACE VIEW genre_popularity_view AS
SELECT
  g.id,
  g.name,
  g.description,
  COUNT(DISTINCT s.id) AS song_count,
  (COALESCE(SUM(lh_stats.plays), 0) + COALESCE(SUM(agg_stats.agg_plays), 0)) AS total_plays,
  COALESCE(AVG(rate_stats.avg_r), 0) AS avg_rating
FROM genres g
  LEFT JOIN songs s ON g.id = s.genre_id
  LEFT JOIN (
    SELECT song_id, COUNT(*) AS plays
    FROM listening_history
    GROUP BY song_id
  ) lh_stats ON s.id = lh_stats.song_id
  LEFT JOIN (
    SELECT song_id, SUM(play_count) AS agg_plays
    FROM aggregated_listening_counts
    WHERE song_id IS NOT NULL
    GROUP BY song_id
  ) agg_stats ON s.id = agg_stats.song_id
  LEFT JOIN (
    SELECT song_id, AVG(rating) AS avg_r
    FROM ratings
    GROUP BY song_id
  ) rate_stats ON s.id = rate_stats.song_id
GROUP BY g.id, g.name, g.description
ORDER BY total_plays DESC;

CREATE OR REPLACE VIEW user_analytics_view AS
SELECT
  u.id AS user_id,
  u.username,
  (COALESCE(lh_stats.total_listens, 0) + COALESCE(agg_stats.total_agg_listens, 0)) AS total_listens,
  COALESCE(lh_stats.unique_songs, 0) AS unique_songs,
  COALESCE(lh_stats.total_listen_seconds, 0) AS total_listen_seconds,
  COUNT(DISTINCT r.id) AS total_ratings,
  COALESCE(AVG(r.rating), 0) AS avg_given_rating
FROM users u
  LEFT JOIN (
    SELECT user_id, COUNT(*) AS total_listens, COUNT(DISTINCT song_id) AS unique_songs, SUM(duration_listened) AS total_listen_seconds
    FROM listening_history
    GROUP BY user_id
  ) lh_stats ON u.id = lh_stats.user_id
  LEFT JOIN (
    SELECT user_id, SUM(play_count) AS total_agg_listens
    FROM aggregated_listening_counts
    WHERE user_id IS NOT NULL
    GROUP BY user_id
  ) agg_stats ON u.id = agg_stats.user_id
  LEFT JOIN ratings r ON u.id = r.user_id
GROUP BY u.id, u.username, lh_stats.total_listens, agg_stats.total_agg_listens, lh_stats.unique_songs, lh_stats.total_listen_seconds;

-- ────────────────────────────────────────────────────────────
-- STORED PROCEDURES
-- ────────────────────────────────────────────────────────────

DELIMITER //

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

CREATE PROCEDURE sp_update_preferences(IN p_user_id INT)
BEGIN
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
