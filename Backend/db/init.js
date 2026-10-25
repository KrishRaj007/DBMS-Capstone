/**
 * Automated Database Initializer for DBMS Capstone Project
 * Safely adapts the database schema, compiles views/triggers/procedures,
 * and idempotently provisions baseline demo records WITHOUT destroying
 * existing user accounts, ratings, playlists, preferences, or listening logs.
 *
 * Run: npm run init-db
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const GENRES = [
  { name: 'Pop',        description: 'Popular mainstream music with catchy melodies' },
  { name: 'Rock',       description: 'Guitar-driven music with powerful rhythms' },
  { name: 'Hip-Hop',    description: 'Rhythmic music with spoken-word vocals' },
  { name: 'R&B',        description: 'Rhythm and blues with soulful vocals' },
  { name: 'Electronic', description: 'Synthesizer-based music and beats' },
  { name: 'Jazz',       description: 'Improvisational music with complex harmonies' },
  { name: 'Classical',  description: 'Orchestral and composed instrumental music' },
  { name: 'Country',    description: 'Story-driven music with acoustic instruments' },
  { name: 'Indie',      description: 'Independent alternative music' },
  { name: 'Metal',      description: 'Heavy, amplified rock music' },
];

const ARTISTS = [
  { name: 'Luna Nova',           bio: 'Chart-topping pop sensation known for electrifying live shows and vocal agility.' },
  { name: 'The Midnight Riders', bio: 'Classic rock band blending vintage analog riffs with modern stadium production.' },
  { name: 'DJ Phantom',          bio: 'Electronic producer and festival headliner pushing dance music frontiers.' },
  { name: 'Aria Sterling',       bio: 'Soulful R&B vocalist with an expressive four-octave range.' },
  { name: 'Marcus Cole',         bio: 'Lyrical hip-hop storyteller known for introspective poetry and rhythm.' },
  { name: 'The Jazz Collective', bio: 'Ensemble bringing progressive modal jazz to modern concert halls.' },
  { name: 'Elena Vasquez',       bio: 'Virtuoso classical pianist and composer acclaimed by European philharmonics.' },
  { name: 'Dusty Roads',         bio: 'Country singer-songwriter capturing dusty trails and heartland tales.' },
  { name: 'Echo Chamber',        bio: 'Atmospheric indie outfit creating lush reverb-drenched soundscapes.' },
  { name: 'Iron Thunder',        bio: 'Heavy metal powerhouse with driving double-bass and melodic leads.' },
  { name: 'Skyline',             bio: 'Electropop duo known for radiant hooks and synthwave undertones.' },
  { name: 'Velvet Storm',        bio: 'Alternative rock band with deep guitars and raw emotional lyricism.' },
  { name: 'Neon Pulse',          bio: 'Cyberpunk-inspired producer melding analog modular synths with heavy bass.' },
  { name: 'Jasmine Ray',         bio: 'Neo-soul songstress exploring groove, tenderness, and modern intimacy.' },
  { name: 'King Verse',          bio: 'Conscious hip-hop pioneer weaving boom-bap nostalgia with trap cadences.' },
  { name: 'Blue Note Trio',      bio: 'Acoustic jazz trio inspired by 1950s Manhattan late-night sessions.' },
  { name: 'Sophia Chen',         bio: 'Contemporary classical violinist reimagining orchestral sonatas.' },
  { name: 'Wildflower',          bio: 'Folk-country storyteller singing of mountain cabins and prairie sunsets.' },
  { name: 'Paper Planes',        bio: 'Dream-pop indie group featuring jangly guitars and ethereal vocals.' },
  { name: 'Dark Horizon',        bio: 'Progressive metal group known for asymmetric time signatures and heavy drop tuning.' },
];

const SONGS = [
  // Pop (genre 1)
  { title: 'Starlight Boulevard',   artist: 1,  genre: 1,  album: 'Neon Dreams', duration: 214, date: '2024-03-15' },
  { title: 'Electric Hearts',       artist: 1,  genre: 1,  album: 'Neon Dreams', duration: 198, date: '2024-03-15' },
  { title: 'Dancing in the Glow',   artist: 1,  genre: 1,  album: 'Midnight Sun', duration: 227, date: '2023-08-20' },
  { title: 'City Lights',           artist: 11, genre: 1,  album: 'Horizons', duration: 203, date: '2024-01-10' },
  { title: 'Golden Hour',           artist: 11, genre: 1,  album: 'Horizons', duration: 189, date: '2024-01-10' },
  { title: 'Paper Moon',            artist: 11, genre: 1,  album: 'Horizons', duration: 241, date: '2024-01-10' },

  // Rock (genre 2)
  { title: 'Highway Thunder',       artist: 2,  genre: 2,  album: 'Rebel Heart', duration: 265, date: '2023-11-05' },
  { title: 'Burning Bridges',       artist: 2,  genre: 2,  album: 'Rebel Heart', duration: 298, date: '2023-11-05' },
  { title: 'Iron Will',             artist: 2,  genre: 2,  album: 'Steel & Stone', duration: 312, date: '2022-06-18' },
  { title: 'Shattered Glass',       artist: 12, genre: 2,  album: 'Tempest', duration: 245, date: '2024-02-28' },
  { title: 'Echoes of Tomorrow',    artist: 12, genre: 2,  album: 'Tempest', duration: 278, date: '2024-02-28' },
  { title: 'Storm Chaser',          artist: 12, genre: 2,  album: 'Tempest', duration: 255, date: '2024-02-28' },

  // Hip-Hop (genre 3)
  { title: 'Crown & Glory',         artist: 5,  genre: 3,  album: 'The Blueprint', duration: 232, date: '2024-04-01' },
  { title: 'Street Wisdom',         artist: 5,  genre: 3,  album: 'The Blueprint', duration: 201, date: '2024-04-01' },
  { title: 'Concrete Jungle',       artist: 5,  genre: 3,  album: 'Urban Tales', duration: 218, date: '2023-05-12' },
  { title: 'Royal Decree',          artist: 15, genre: 3,  album: 'Throne Room', duration: 195, date: '2024-06-15' },
  { title: 'Midnight Hustle',       artist: 15, genre: 3,  album: 'Throne Room', duration: 210, date: '2024-06-15' },
  { title: 'Legacy',                artist: 15, genre: 3,  album: 'Throne Room', duration: 248, date: '2024-06-15' },

  // R&B (genre 4)
  { title: 'Velvet Sky',            artist: 4,  genre: 4,  album: 'Silk & Soul', duration: 256, date: '2024-02-14' },
  { title: 'Slow Burn',             artist: 4,  genre: 4,  album: 'Silk & Soul', duration: 234, date: '2024-02-14' },
  { title: 'Moonlit Serenade',      artist: 4,  genre: 4,  album: 'After Hours', duration: 279, date: '2023-09-01' },
  { title: 'Ocean Eyes',            artist: 14, genre: 4,  album: 'Dusk Till Dawn', duration: 223, date: '2024-05-20' },
  { title: 'Tender Love',           artist: 14, genre: 4,  album: 'Dusk Till Dawn', duration: 245, date: '2024-05-20' },
  { title: 'Butterflies',           artist: 14, genre: 4,  album: 'Dusk Till Dawn', duration: 198, date: '2024-05-20' },

  // Electronic (genre 5)
  { title: 'Neon Nights',           artist: 3,  genre: 5,  album: 'Digital Dreams', duration: 342, date: '2024-01-20' },
  { title: 'Pulse Wave',            artist: 3,  genre: 5,  album: 'Digital Dreams', duration: 385, date: '2024-01-20' },
  { title: 'Cyber Dawn',            artist: 3,  genre: 5,  album: 'Binary Sunset', duration: 298, date: '2023-07-07' },
  { title: 'Retrowave',             artist: 13, genre: 5,  album: 'Synthwave City', duration: 312, date: '2024-03-30' },
  { title: 'Digital Love',          artist: 13, genre: 5,  album: 'Synthwave City', duration: 276, date: '2024-03-30' },
  { title: 'Future Shock',          artist: 13, genre: 5,  album: 'Synthwave City', duration: 334, date: '2024-03-30' },

  // Jazz (genre 6)
  { title: 'Blue Monday',           artist: 6,  genre: 6,  album: 'Late Night Sessions', duration: 367, date: '2023-10-15' },
  { title: 'Satin Smooth',          artist: 6,  genre: 6,  album: 'Late Night Sessions', duration: 289, date: '2023-10-15' },
  { title: 'Impromptu No. 5',       artist: 6,  genre: 6,  album: 'Free Flow', duration: 423, date: '2022-12-01' },
  { title: 'Midnight in Manhattan', artist: 16, genre: 6,  album: 'City Blues', duration: 301, date: '2024-04-18' },
  { title: 'Cool Breeze',           artist: 16, genre: 6,  album: 'City Blues', duration: 267, date: '2024-04-18' },
  { title: 'Swing Time',            artist: 16, genre: 6,  album: 'City Blues', duration: 245, date: '2024-04-18' },

  // Classical (genre 7)
  { title: 'Sonata in D Minor',     artist: 7,  genre: 7,  album: 'Nocturnes', duration: 480, date: '2023-03-25' },
  { title: 'Prelude to Dawn',       artist: 7,  genre: 7,  album: 'Nocturnes', duration: 356, date: '2023-03-25' },
  { title: 'Elegy for Strings',     artist: 7,  genre: 7,  album: 'Reflections', duration: 512, date: '2022-09-10' },
  { title: 'Autumn Concerto',       artist: 17, genre: 7,  album: 'Four Seasons', duration: 445, date: '2024-07-01' },
  { title: 'Whispers of Vienna',    artist: 17, genre: 7,  album: 'Four Seasons', duration: 398, date: '2024-07-01' },
  { title: 'Midnight Waltz',        artist: 17, genre: 7,  album: 'Four Seasons', duration: 367, date: '2024-07-01' },

  // Country (genre 8)
  { title: 'Dirt Road Anthem',      artist: 8,  genre: 8,  album: 'Backroads', duration: 223, date: '2023-12-10' },
  { title: 'Sunset Porch',          artist: 8,  genre: 8,  album: 'Backroads', duration: 198, date: '2023-12-10' },
  { title: 'Old Pickup Truck',      artist: 8,  genre: 8,  album: 'Simple Life', duration: 245, date: '2023-04-14' },
  { title: 'Meadow Song',           artist: 18, genre: 8,  album: 'Wild Petals', duration: 212, date: '2024-05-05' },
  { title: 'Campfire Stories',      artist: 18, genre: 8,  album: 'Wild Petals', duration: 234, date: '2024-05-05' },
  { title: 'Morning Dew',           artist: 18, genre: 8,  album: 'Wild Petals', duration: 189, date: '2024-05-05' },

  // Indie (genre 9)
  { title: 'Faded Polaroids',       artist: 9,  genre: 9,  album: 'Lo-Fi Diaries', duration: 234, date: '2024-02-10' },
  { title: 'Rooftop View',          artist: 9,  genre: 9,  album: 'Lo-Fi Diaries', duration: 198, date: '2024-02-10' },
  { title: 'Analog Days',           artist: 9,  genre: 9,  album: 'Warm Tones', duration: 256, date: '2023-06-22' },
  { title: 'Sunday Morning',        artist: 19, genre: 9,  album: 'Postcards', duration: 201, date: '2024-08-12' },
  { title: 'Wishing Well',          artist: 19, genre: 9,  album: 'Postcards', duration: 218, date: '2024-08-12' },
  { title: 'Paper Airplanes',       artist: 19, genre: 9,  album: 'Postcards', duration: 187, date: '2024-08-12' },

  // Metal (genre 10)
  { title: 'Wrath Unchained',       artist: 10, genre: 10, album: 'Forged in Fire', duration: 345, date: '2023-10-31' },
  { title: 'Crimson Fury',          artist: 10, genre: 10, album: 'Forged in Fire', duration: 312, date: '2023-10-31' },
  { title: 'Titan\'s Fall',         artist: 10, genre: 10, album: 'Apocalypse', duration: 378, date: '2022-08-15' },
  { title: 'Abyssal Gate',          artist: 20, genre: 10, album: 'Event Horizon', duration: 401, date: '2024-06-06' },
  { title: 'Singularity',           artist: 20, genre: 10, album: 'Event Horizon', duration: 356, date: '2024-06-06' },
  { title: 'Void Walker',           artist: 20, genre: 10, album: 'Event Horizon', duration: 423, date: '2024-06-06' },
];

const USERS = [
  { username: 'john_doe',   email: 'john@example.com',  password: 'password123' },
  { username: 'jane_smith', email: 'jane@example.com',   password: 'password123' },
  { username: 'music_lover', email: 'music@example.com', password: 'password123' },
];

async function initializeDatabase() {
  console.log('🚀 Initializing / Adapting MySQL Database for BeatPulse...\n');
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log(`✓ Connected to MySQL server at ${dbConfig.host}:${dbConfig.port}`);
  } catch (err) {
    console.error('\n❌ Connection Error:');
    console.error(`   ${err.message}`);
    console.error('\n👉 Please check Backend/.env and set your MySQL password:');
    console.error('   DB_PASSWORD=your_actual_mysql_password\n');
    process.exit(1);
  }

  try {
    // 1. Create database
    const dbName = process.env.DB_NAME || 'music_analytics';
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await conn.query(`USE \`${dbName}\``);
    console.log(`✓ Database \`${dbName}\` ready`);

    // 2. Drop existing triggers & procedures to safely recompile
    await conn.query(`DROP TRIGGER IF EXISTS trg_after_listen`).catch(() => {});
    await conn.query(`DROP TRIGGER IF EXISTS trg_after_rating`).catch(() => {});
    await conn.query(`DROP PROCEDURE IF EXISTS sp_get_recommendations`).catch(() => {});
    await conn.query(`DROP PROCEDURE IF EXISTS sp_update_preferences`).catch(() => {});

    // 3. Create core relational tables in strict FK order
    await conn.query(`
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
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS genres (
        id          INT PRIMARY KEY AUTO_INCREMENT,
        name        VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id                INT PRIMARY KEY AUTO_INCREMENT,
        user_id           INT NOT NULL,
        genre_id          INT NOT NULL,
        preference_weight DECIMAL(5,2) DEFAULT 1.00,
        CONSTRAINT fk_up_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE,
        CONSTRAINT fk_up_genre FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE,
        UNIQUE KEY uk_user_genre_pref (user_id, genre_id),
        INDEX idx_up_user (user_id)
      )
    `);

    await conn.query(`
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
      )
    `);

    // Staging tables
    await conn.query(`
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
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS staging_artists (
        source_id        VARCHAR(100) NOT NULL,
        source_namespace VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
        name             VARCHAR(100) NOT NULL,
        mbid             VARCHAR(36)  DEFAULT NULL,
        original_credit  VARCHAR(255) DEFAULT NULL,
        genre_id         INT          DEFAULT NULL,
        PRIMARY KEY (source_namespace, source_id)
      )
    `);

    await conn.query(`
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
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS staging_listening_history (
        id                INT PRIMARY KEY AUTO_INCREMENT,
        user_source_id    VARCHAR(100) NOT NULL,
        song_source_id    VARCHAR(100) NOT NULL,
        listened_at       TIMESTAMP    NOT NULL,
        duration_listened INT          DEFAULT 0,
        source_namespace  VARCHAR(50)  NOT NULL DEFAULT 'lastfm',
        INDEX idx_slh_lookup (user_source_id, song_source_id, listened_at)
      )
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS staging_aggregated_counts (
        id                INT PRIMARY KEY AUTO_INCREMENT,
        user_source_id    VARCHAR(100) DEFAULT NULL,
        artist_source_id  VARCHAR(100) NOT NULL,
        song_source_id    VARCHAR(100) DEFAULT NULL,
        play_count        INT          NOT NULL DEFAULT 0,
        source_namespace  VARCHAR(50)  NOT NULL DEFAULT 'dataset',
        INDEX idx_sac_lookup (source_namespace, user_source_id, artist_source_id, song_source_id)
      )
    `);
    console.log('✓ 10 Application tables & 5 Staging buffers verified');

    // 4. Create analytical views
    await conn.query(`
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
      ORDER BY play_count DESC
    `);

    await conn.query(`
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
      ORDER BY total_plays DESC
    `);

    await conn.query(`
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
      GROUP BY u.id, u.username, lh_stats.total_listens, agg_stats.total_agg_listens, lh_stats.unique_songs, lh_stats.total_listen_seconds
    `);
    console.log('✓ 3 Analytical SQL views compiled with aggregated counts support');

    // 5. Stored Procedures
    await conn.query(`
      CREATE PROCEDURE sp_get_recommendations(
        IN p_user_id INT,
        IN p_limit INT
      )
      BEGIN
        DECLARE v_user_activity INT DEFAULT 0;

        SELECT (
          (SELECT COUNT(*) FROM listening_history WHERE user_id = p_user_id) +
          (SELECT COUNT(*) FROM ratings WHERE user_id = p_user_id)
        ) INTO v_user_activity;

        IF v_user_activity = 0 THEN
          SELECT
            s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
            a.name AS artist_name, a.id AS artist_id,
            g.name AS genre_name, g.id AS genre_id,
            COALESCE(play_stats.play_count, 0) AS play_count,
            COALESCE(rate_stats.avg_rating, 0) AS avg_rating,
            COALESCE(rate_stats.rating_count, 0) AS rating_count,
            CONCAT('Trending track in ', g.name) AS recommendation_reason,
            'popularity_baseline' AS strategy,
            FALSE AS is_personalized,
            (LOG(1 + COALESCE(play_stats.play_count, 0)) +
             CASE WHEN COALESCE(rate_stats.rating_count, 0) > 0
                  THEN (rate_stats.avg_rating * (rate_stats.rating_count / (rate_stats.rating_count + 2)))
                  ELSE 0 END
            ) AS score
          FROM songs s
            JOIN artists a ON s.artist_id = a.id
            JOIN genres  g ON s.genre_id  = g.id
            LEFT JOIN (
              SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id
            ) play_stats ON s.id = play_stats.song_id
            LEFT JOIN (
              SELECT song_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM ratings GROUP BY song_id
            ) rate_stats ON s.id = rate_stats.song_id
          WHERE s.id NOT IN (
            SELECT song_id FROM listening_history WHERE user_id = p_user_id
          )
          ORDER BY score DESC
          LIMIT p_limit;
        ELSE
          SELECT
            s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
            a.name AS artist_name, a.id AS artist_id,
            g.name AS genre_name, g.id AS genre_id,
            COALESCE(play_stats.play_count, 0) AS play_count,
            COALESCE(rate_stats.avg_rating, 0) AS avg_rating,
            COALESCE(rate_stats.rating_count, 0) AS rating_count,
            CASE
              WHEN up.preference_weight > 0 THEN CONCAT('Matches your taste in ', g.name)
              ELSE CONCAT('Recommended discovery in ', g.name)
            END AS recommendation_reason,
            'content_based' AS strategy,
            TRUE AS is_personalized,
            (COALESCE(up.preference_weight, 0) * 2.5
             + LOG(1 + COALESCE(play_stats.play_count, 0))
             + CASE WHEN COALESCE(rate_stats.rating_count, 0) > 0
                    THEN (rate_stats.avg_rating * (rate_stats.rating_count / (rate_stats.rating_count + 2)))
                    ELSE 0 END
            ) AS score
          FROM songs s
            JOIN artists a ON s.artist_id = a.id
            JOIN genres  g ON s.genre_id  = g.id
            LEFT JOIN user_preferences up ON s.genre_id = up.genre_id AND up.user_id = p_user_id
            LEFT JOIN (
              SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id
            ) play_stats ON s.id = play_stats.song_id
            LEFT JOIN (
              SELECT song_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM ratings GROUP BY song_id
            ) rate_stats ON s.id = rate_stats.song_id
          WHERE s.id NOT IN (
            SELECT song_id FROM listening_history WHERE user_id = p_user_id
          )
          ORDER BY score DESC
          LIMIT p_limit;
        END IF;
      END
    `);

    await conn.query(`
      CREATE PROCEDURE sp_update_preferences(IN p_user_id INT)
      BEGIN
        INSERT INTO user_preferences (user_id, genre_id, preference_weight)
        SELECT
          p_user_id,
          s.genre_id,
          ROUND((COUNT(lh.id) * 0.3) + (COALESCE(AVG(r.rating), 3) * 0.7), 2) AS weight
        FROM songs s
          LEFT JOIN listening_history lh ON s.id = lh.song_id AND lh.user_id = p_user_id
          LEFT JOIN ratings r ON s.id = r.song_id AND r.user_id = p_user_id
        WHERE lh.id IS NOT NULL OR r.id IS NOT NULL
        GROUP BY s.genre_id
        ON DUPLICATE KEY UPDATE preference_weight = VALUES(preference_weight);
      END
    `);
    console.log('✓ Stored procedures compiled (sp_get_recommendations, sp_update_preferences)');

    // 6. Triggers
    await conn.query(`
      CREATE TRIGGER trg_after_listen
      AFTER INSERT ON listening_history
      FOR EACH ROW
      BEGIN
        DECLARE v_genre_id INT;
        SELECT genre_id INTO v_genre_id FROM songs WHERE id = NEW.song_id;
        INSERT INTO user_preferences (user_id, genre_id, preference_weight)
        VALUES (NEW.user_id, v_genre_id, 1.00)
        ON DUPLICATE KEY UPDATE preference_weight = preference_weight + 0.10;
      END
    `);

    await conn.query(`
      CREATE TRIGGER trg_after_rating
      AFTER INSERT ON ratings
      FOR EACH ROW
      BEGIN
        DECLARE v_genre_id INT;
        SELECT genre_id INTO v_genre_id FROM songs WHERE id = NEW.song_id;
        INSERT INTO user_preferences (user_id, genre_id, preference_weight)
        VALUES (NEW.user_id, v_genre_id, NEW.rating * 0.5)
        ON DUPLICATE KEY UPDATE preference_weight = GREATEST(preference_weight, NEW.rating * 0.5);
      END
    `);
    console.log('✓ Database triggers compiled (trg_after_listen, trg_after_rating)');

    // 7. Non-destructive baseline seeding (preserves existing users, playlists, history)
    for (const g of GENRES) {
      await conn.query(
        'INSERT INTO genres (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
        [g.name, g.description]
      );
    }
    console.log(`✓ Ensured ${GENRES.length} standard genres`);

    for (const a of ARTISTS) {
      await conn.query(
        'INSERT INTO artists (name, bio, source_namespace) SELECT ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM artists WHERE LOWER(name) = LOWER(?))',
        [a.name, a.bio, a.name]
      );
    }
    console.log(`✓ Ensured baseline local artists`);

    // Fetch artist id mapping
    const [existingArtists] = await conn.query('SELECT id, name FROM artists');
    const artistMap = {};
    for (const row of existingArtists) {
      artistMap[row.name.toLowerCase()] = row.id;
    }

    for (const s of SONGS) {
      const artObj = ARTISTS[s.artist - 1];
      const artId = artObj ? artistMap[artObj.name.toLowerCase()] || s.artist : s.artist;
      await conn.query(
        'INSERT INTO songs (title, artist_id, genre_id, album, duration_seconds, release_date, source_namespace) ' +
        'SELECT ?, ?, ?, ?, ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM songs WHERE LOWER(title) = LOWER(?) AND artist_id = ?)',
        [s.title, artId, s.genre, s.album, s.duration, s.date, s.title, artId]
      );
    }
    console.log(`✓ Ensured baseline local songs`);

    // Seed demo users without overwriting existing registered user accounts
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(
        'INSERT INTO users (username, email, password_hash, source_namespace) ' +
        'SELECT ?, ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ? OR email = ?)',
        [u.username, u.email, hash, u.username, u.email]
      );
    }
    console.log(`✓ Ensured demo user accounts (preserved existing user credentials)`);

    console.log('\n🎉 Database initialization and non-destructive schema adaptation complete!');
  } catch (err) {
    console.error('❌ Schema/Seed Error:', err);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

initializeDatabase();
