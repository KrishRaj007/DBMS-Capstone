const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/analytics/personal
router.get('/personal', auth, async (req, res) => {
  try {
    // Overview stats
    const [[overview]] = await pool.query(
      `SELECT * FROM user_analytics_view WHERE user_id = ?`,
      [req.user.id]
    );

    // Top genres by listen count
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

    // Listening trend — last 30 days
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
      overview: overview || { total_listens: 0, unique_songs: 0, total_listen_seconds: 0, total_ratings: 0, avg_given_rating: 0 },
      topGenres,
      topArtists,
      topSongs,
      hourly,
      daily,
      trend,
    });
  } catch (err) {
    console.error('Personal analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/analytics/global
router.get('/global', async (_req, res) => {
  try {
    // Most played songs
    const [mostPlayed] = await pool.query(
      `SELECT * FROM top_songs_view LIMIT 10`
    );

    // Genre popularity
    const [genrePopularity] = await pool.query(
      `SELECT * FROM genre_popularity_view`
    );

    // Top rated songs
    const [topRated] = await pool.query(
      `SELECT s.id, s.title, a.name AS artist_name, g.name AS genre_name,
              AVG(r.rating) AS avg_rating, COUNT(r.id) AS rating_count
       FROM ratings r
         JOIN songs s ON r.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       GROUP BY s.id, s.title, a.name, g.name
       HAVING COUNT(r.id) >= 2
       ORDER BY avg_rating DESC
       LIMIT 10`
    );

    // Active users
    const [activeUsers] = await pool.query(
      `SELECT u.id, u.username, COUNT(lh.id) AS total_listens
       FROM users u
         JOIN listening_history lh ON u.id = lh.user_id
       GROUP BY u.id, u.username
       ORDER BY total_listens DESC
       LIMIT 10`
    );

    // Total stats
    const [[totals]] = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users) AS total_users,
         (SELECT COUNT(*) FROM songs) AS total_songs,
         (SELECT COUNT(*) FROM listening_history) AS total_listens,
         (SELECT COUNT(*) FROM ratings) AS total_ratings`
    );

    res.json({ mostPlayed, genrePopularity, topRated, activeUsers, totals });
  } catch (err) {
    console.error('Global analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
