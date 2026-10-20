const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/recommendations
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Use the stored procedure
    const [rows] = await pool.query('CALL sp_get_recommendations(?, ?)', [req.user.id, limit]);

    // MySQL stored procedure results come as rows[0]
    res.json(rows[0] || []);
  } catch (err) {
    console.error('Recommendations error:', err);
    // Fallback: if stored procedure fails, do a simple query
    try {
      const [rows] = await pool.query(
        `SELECT s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
                a.name AS artist_name, a.id AS artist_id,
                g.name AS genre_name, g.id AS genre_id,
                COALESCE(pc.play_count, 0) AS play_count,
                COALESCE(rc.avg_rating, 0) AS avg_rating
         FROM songs s
           JOIN artists a ON s.artist_id = a.id
           JOIN genres g ON s.genre_id = g.id
           LEFT JOIN (SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id) pc ON s.id = pc.song_id
           LEFT JOIN (SELECT song_id, AVG(rating) AS avg_rating FROM ratings GROUP BY song_id) rc ON s.id = rc.song_id
         ORDER BY COALESCE(rc.avg_rating, 0) DESC, COALESCE(pc.play_count, 0) DESC
         LIMIT ?`,
        [parseInt(req.query.limit) || 20]
      );
      res.json(rows);
    } catch (fallbackErr) {
      console.error('Recommendation fallback error:', fallbackErr);
      res.status(500).json({ error: 'Server error' });
    }
  }
});

module.exports = router;
