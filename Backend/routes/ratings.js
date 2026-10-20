const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// POST /api/ratings — rate a song (upsert)
router.post('/', auth, async (req, res) => {
  try {
    const { song_id, rating } = req.body;
    if (!song_id || !rating) return res.status(400).json({ error: 'song_id and rating are required' });
    if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

    await pool.query(
      `INSERT INTO ratings (user_id, song_id, rating)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE rating = VALUES(rating), created_at = CURRENT_TIMESTAMP`,
      [req.user.id, song_id, rating]
    );

    res.json({ message: 'Rating saved' });
  } catch (err) {
    console.error('Rating error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ratings/user — all of the current user's ratings
router.get('/user', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT r.song_id, r.rating, r.created_at,
              s.title, s.album, s.cover_url,
              a.name AS artist_name, g.name AS genre_name
       FROM ratings r
         JOIN songs s ON r.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Ratings list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/ratings/song/:songId — get avg rating + user's rating for a song
router.get('/song/:songId', auth, async (req, res) => {
  try {
    const [[avg]] = await pool.query(
      'SELECT COALESCE(AVG(rating),0) AS avg_rating, COUNT(*) AS count FROM ratings WHERE song_id = ?',
      [req.params.songId]
    );
    const [userRating] = await pool.query(
      'SELECT rating FROM ratings WHERE user_id = ? AND song_id = ?',
      [req.user.id, req.params.songId]
    );
    res.json({
      avg_rating: parseFloat(avg.avg_rating),
      rating_count: avg.count,
      user_rating: userRating.length > 0 ? userRating[0].rating : null,
    });
  } catch (err) {
    console.error('Song rating error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
