const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/recommendations
router.get('/', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    // Execute stored procedure
    const [rows] = await pool.query('CALL sp_get_recommendations(?, ?)', [req.user.id, limit]);

    // MySQL stored procedure results come as rows[0]
    const items = Array.isArray(rows[0]) ? rows[0] : (Array.isArray(rows) ? rows : []);
    const isPersonalized = items.some(item => Boolean(item.is_personalized));
    const strategy = items[0]?.strategy || (isPersonalized ? 'content_based' : 'popularity_baseline');
    const userState = isPersonalized ? 'active' : 'cold_start';
    const explanation = items[0]?.strategy_explanation || (
      strategy === 'collaborative_filtering'
        ? 'Personalized recommendations based on listeners with overlapping musical tastes to yours'
        : (strategy === 'content_based'
            ? 'Personalized recommendations based on your affinity for top artists and genres'
            : 'Platform Baseline: Popular and trending tracks across diverse genres (New listener baseline)')
    );

    res.json({
      recommendations: items,
      is_personalized: isPersonalized,
      strategy,
      explanation,
      user_state: userState,
      count: items.length,
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    // Fallback: If stored procedure fails, execute valid popularity baseline excluding already-listened songs
    try {
      const limit = parseInt(req.query.limit) || 20;
      const [rows] = await pool.query(
        `SELECT s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
                a.name AS artist_name, a.id AS artist_id,
                g.name AS genre_name, g.id AS genre_id,
                COALESCE(pc.play_count, 0) AS play_count,
                COALESCE(rc.avg_rating, 0) AS avg_rating,
                COALESCE(rc.rating_count, 0) AS rating_count,
                CONCAT('Popular track in ', g.name) AS recommendation_reason,
                'popularity_baseline' AS strategy,
                FALSE AS is_personalized
         FROM songs s
           JOIN artists a ON s.artist_id = a.id
           JOIN genres g ON s.genre_id = g.id
           LEFT JOIN (SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id) pc ON s.id = pc.song_id
           LEFT JOIN (SELECT song_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM ratings GROUP BY song_id) rc ON s.id = rc.song_id
         WHERE s.id NOT IN (SELECT song_id FROM listening_history WHERE user_id = ?)
         ORDER BY (LOG(1 + COALESCE(pc.play_count, 0)) + CASE WHEN COALESCE(rc.rating_count, 0) > 0 THEN rc.avg_rating ELSE 0 END) DESC
         LIMIT ?`,
        [req.user.id, limit]
      );

      res.json({
        recommendations: rows,
        is_personalized: false,
        strategy: 'popularity_baseline',
        explanation: 'Platform Baseline: Top engagement catalog tracks (Fallback engine)',
        user_state: 'cold_start',
        count: rows.length,
      });
    } catch (fallbackErr) {
      console.error('Recommendation fallback error:', fallbackErr);
      res.status(500).json({ error: 'Server error generating recommendations' });
    }
  }
});

module.exports = router;
