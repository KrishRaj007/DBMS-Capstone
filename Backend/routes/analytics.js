const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/analytics/personal
router.get('/personal', auth, async (req, res) => {
  try {
    // Overview stats from user_analytics_view
    const [[overview]] = await pool.query(
      `SELECT * FROM user_analytics_view WHERE user_id = ?`,
      [req.user.id]
    );

    // Top genres by listen count with real user rating average
    const [topGenres] = await pool.query(
      `SELECT g.name, COUNT(lh.id) AS listens, COALESCE(AVG(r.rating), 0) AS avg_rating
       FROM listening_history lh
         JOIN songs s ON lh.song_id = s.id
         JOIN genres g ON s.genre_id = g.id
         LEFT JOIN ratings r ON s.id = r.song_id AND r.user_id = ?
       WHERE lh.user_id = ?
       GROUP BY g.id, g.name
       ORDER BY listens DESC
       LIMIT 10`,
      [req.user.id, req.user.id]
    );

    // Top artists by listen count
    const [topArtists] = await pool.query(
      `SELECT a.name, COUNT(lh.id) AS listens
       FROM listening_history lh
         JOIN songs s ON lh.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
       WHERE lh.user_id = ?
       GROUP BY a.id, a.name
       ORDER BY listens DESC
       LIMIT 10`,
      [req.user.id]
    );

    // Top songs by listen count
    const [topSongs] = await pool.query(
      `SELECT s.id, s.title, a.name AS artist_name, COUNT(lh.id) AS listens
       FROM listening_history lh
         JOIN songs s ON lh.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
       WHERE lh.user_id = ?
       GROUP BY s.id, s.title, a.name
       ORDER BY listens DESC
       LIMIT 10`,
      [req.user.id]
    );

    // Listening heatmap — by hour of day
    const [hourly] = await pool.query(
      `SELECT HOUR(listened_at) AS hour, COUNT(*) AS listens
       FROM listening_history
       WHERE user_id = ?
       GROUP BY HOUR(listened_at)
       ORDER BY hour`,
      [req.user.id]
    );

    // Listening heatmap — by day of week (0=Monday … 6=Sunday)
    const [daily] = await pool.query(
      `SELECT DAYOFWEEK(listened_at) AS day, COUNT(*) AS listens
       FROM listening_history
       WHERE user_id = ?
       GROUP BY DAYOFWEEK(listened_at)
       ORDER BY day`,
      [req.user.id]
    );

    // Listening trend — daily activity
    const [trend] = await pool.query(
      `SELECT DATE(listened_at) AS date, COUNT(*) AS listens,
              SUM(duration_listened) AS total_duration
       FROM listening_history
       WHERE user_id = ? AND listened_at >= DATE_SUB(NOW(), INTERVAL 90 DAY)
       GROUP BY DATE(listened_at)
       ORDER BY date`,
      [req.user.id]
    );

    res.json({
      overview: overview || {
        total_listens: 0,
        unique_songs: 0,
        total_listen_seconds: 0,
        total_ratings: 0,
        avg_given_rating: 0,
        source_namespace: 'local',
        telemetry_tier: 'Granular Application User Session Logs',
      },
      topGenres,
      topArtists,
      topSongs,
      hourly,
      daily,
      trend,
      telemetry_metadata: {
        data_source: 'Application User Session Logs (source_namespace: local)',
        aggregation_level: 'Individual Timestamped Session Events',
      },
    });
  } catch (err) {
    console.error('Personal analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/global
router.get('/global', async (_req, res) => {
  try {
    // Most played songs (combined view of granular history + aggregated dataset counts)
    const [mostPlayed] = await pool.query(
      `SELECT * FROM top_songs_view LIMIT 10`
    );

    // Genre popularity
    const [genrePopularity] = await pool.query(
      `SELECT * FROM genre_popularity_view`
    );

    // Top rated songs (from verified ratings submitted by active application users)
    const [topRated] = await pool.query(
      `SELECT s.id, s.title, a.name AS artist_name, g.name AS genre_name,
              AVG(r.rating) AS avg_rating, COUNT(r.id) AS rating_count
       FROM ratings r
         JOIN songs s ON r.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       GROUP BY s.id, s.title, a.name, g.name
       HAVING COUNT(r.id) >= 1
       ORDER BY avg_rating DESC, rating_count DESC
       LIMIT 10`
    );

    // Active users with provenance namespace badges
    const [activeUsers] = await pool.query(
      `SELECT u.id, u.username, u.source_namespace, COUNT(lh.id) AS total_listens
       FROM users u
         JOIN listening_history lh ON u.id = lh.user_id
       GROUP BY u.id, u.username, u.source_namespace
       ORDER BY total_listens DESC
       LIMIT 10`
    );

    // Totals accurately separated by data source and aggregation level
    const [[totals]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(*) FROM users WHERE source_namespace = 'local') AS registered_app_users,
         (SELECT COUNT(*) FROM users WHERE source_namespace = 'lastfm') AS imported_listener_profiles,
         (SELECT COUNT(*) FROM songs) AS total_songs,
         (SELECT COUNT(*) FROM listening_history) AS total_listens,
         (SELECT COUNT(*) FROM listening_history WHERE source_namespace = 'local') AS live_app_listens,
         (SELECT COUNT(*) FROM listening_history WHERE source_namespace = 'lastfm') AS imported_scrobbles,
         (SELECT COALESCE(SUM(play_count), 0) FROM aggregated_listening_counts) AS aggregated_plays,
         (SELECT COUNT(*) FROM ratings) AS total_ratings`
    );

    res.json({
      mostPlayed,
      genrePopularity,
      topRated,
      activeUsers,
      totals: {
        total_users: Number(totals?.total_users || 0),
        registered_app_users: Number(totals?.registered_app_users || 0),
        imported_listener_profiles: Number(totals?.imported_listener_profiles || 0),
        total_songs: Number(totals?.total_songs || 0),
        total_listens: Number(totals?.total_listens || 0),
        live_app_listens: Number(totals?.live_app_listens || 0),
        imported_scrobbles: Number(totals?.imported_scrobbles || 0),
        aggregated_plays: Number(totals?.aggregated_plays || 0),
        total_ratings: Number(totals?.total_ratings || 0),
      },
      provenanceTiers: {
        live_application: {
          label: "Live Application Activity",
          namespace: "local",
          aggregation: "Granular Individual Sessions",
          description: "Real-time user listening sessions, star ratings, and accounts registered through the web app",
        },
        historical_dataset: {
          label: "Imported Last.fm Dataset",
          namespace: "lastfm",
          aggregation: "Granular Scrobbles",
          description: "Historical listener profiles and timestamped scrobbles ingested from the Last.fm dataset",
        },
        catalog_aggregated: {
          label: "Pre-Aggregated Catalog Totals",
          namespace: "dataset",
          aggregation: "Coarse Totals",
          description: "Aggregated play counts without fabricated session timestamps or synthetic user accounts",
        },
      },
    });
  } catch (err) {
    console.error('Global analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
