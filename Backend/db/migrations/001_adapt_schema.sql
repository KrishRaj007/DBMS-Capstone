-- ============================================================
-- Migration 001: Adapt Database Schema
-- Non-destructive schema adaptation for BeatPulse / Music Analytics
-- Preserves existing primary keys, foreign keys, user accounts,
-- preferences, playlists, and ratings.
-- ============================================================

USE music_analytics;

-- 1. USERS: Add source identifiers, namespaces, and demographic attributes
SET @dbname = DATABASE();
SET @tablename = "users";

-- source_namespace
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_namespace") > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN source_namespace VARCHAR(50) NOT NULL DEFAULT 'local'"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- source_id
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_id") > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN source_id VARCHAR(100) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- gender
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "gender") > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN gender VARCHAR(10) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- age
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "age") > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN age INT DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- country
SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "country") > 0,
  "SELECT 1",
  "ALTER TABLE users ADD COLUMN country VARCHAR(100) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 2. ARTISTS: Add source identifiers, namespaces, MBID, original credit, and genre
SET @tablename = "artists";

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_namespace") > 0,
  "SELECT 1",
  "ALTER TABLE artists ADD COLUMN source_namespace VARCHAR(50) NOT NULL DEFAULT 'local'"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_id") > 0,
  "SELECT 1",
  "ALTER TABLE artists ADD COLUMN source_id VARCHAR(100) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "mbid") > 0,
  "SELECT 1",
  "ALTER TABLE artists ADD COLUMN mbid VARCHAR(36) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "original_credit") > 0,
  "SELECT 1",
  "ALTER TABLE artists ADD COLUMN original_credit VARCHAR(255) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "genre_id") > 0,
  "SELECT 1",
  "ALTER TABLE artists ADD COLUMN genre_id INT DEFAULT NULL, ADD CONSTRAINT fk_artists_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE SET NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 3. SONGS: Add source identifiers, namespaces, and track MBID
SET @tablename = "songs";

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_namespace") > 0,
  "SELECT 1",
  "ALTER TABLE songs ADD COLUMN source_namespace VARCHAR(50) NOT NULL DEFAULT 'local'"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_id") > 0,
  "SELECT 1",
  "ALTER TABLE songs ADD COLUMN source_id VARCHAR(100) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "track_mbid") > 0,
  "SELECT 1",
  "ALTER TABLE songs ADD COLUMN track_mbid VARCHAR(36) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 4. LISTENING_HISTORY: Add source tracking and deduplication
SET @tablename = "listening_history";

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_namespace") > 0,
  "SELECT 1",
  "ALTER TABLE listening_history ADD COLUMN source_namespace VARCHAR(50) NOT NULL DEFAULT 'local'"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @preparedStatement = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = "source_id") > 0,
  "SELECT 1",
  "ALTER TABLE listening_history ADD COLUMN source_id VARCHAR(100) DEFAULT NULL"
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;


-- 5. AGGREGATED LISTENING COUNTS: For datasets with pre-aggregated play counts
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


-- 6. STAGING TABLES: Transactional isolated buffers for bulk imports
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


-- 7. APPROPRIATE INDEXES: For search, joins, filtering, and analytics
-- Safe creation of indexes if not already present
DELIMITER //

CREATE PROCEDURE sp_add_index_if_not_exists(
  IN p_table_name VARCHAR(100),
  IN p_index_name VARCHAR(100),
  IN p_index_columns VARCHAR(255)
)
BEGIN
  DECLARE index_count INT;
  SELECT COUNT(*) INTO index_count
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = p_table_name
    AND INDEX_NAME = p_index_name;

  IF index_count = 0 THEN
    SET @stmt = CONCAT('CREATE INDEX ', p_index_name, ' ON ', p_table_name, ' (', p_index_columns, ')');
    PREPARE s FROM @stmt;
    EXECUTE s;
    DEALLOCATE PREPARE s;
  END IF;
END //

DELIMITER ;

CALL sp_add_index_if_not_exists('users', 'idx_users_source', 'source_namespace, source_id');
CALL sp_add_index_if_not_exists('artists', 'idx_artists_source', 'source_namespace, source_id');
CALL sp_add_index_if_not_exists('artists', 'idx_artists_mbid', 'mbid');
CALL sp_add_index_if_not_exists('artists', 'idx_artists_name', 'name');
CALL sp_add_index_if_not_exists('songs', 'idx_songs_source', 'source_namespace, source_id');
CALL sp_add_index_if_not_exists('songs', 'idx_songs_track_mbid', 'track_mbid');
CALL sp_add_index_if_not_exists('songs', 'idx_songs_artist_title', 'artist_id, title');
CALL sp_add_index_if_not_exists('songs', 'idx_songs_release', 'release_date');
CALL sp_add_index_if_not_exists('listening_history', 'idx_lh_user_listened', 'user_id, listened_at');
CALL sp_add_index_if_not_exists('listening_history', 'idx_lh_song_listened', 'song_id, listened_at');
CALL sp_add_index_if_not_exists('listening_history', 'idx_lh_source', 'source_namespace, source_id');

DROP PROCEDURE IF EXISTS sp_add_index_if_not_exists;


-- 8. ANALYTIC VIEWS ADAPTATION: Incorporating both individual events and aggregated counts
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
