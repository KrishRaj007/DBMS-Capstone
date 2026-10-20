const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// POST /api/listen — log a listen event
router.post('/', auth, async (req, res) => {
  try {
    const { song_id, duration_listened } = req.body;
    if (!song_id) return res.status(400).json({ error: 'song_id is required' });

    await pool.query(
      'INSERT INTO listening_history (user_id, song_id, duration_listened) VALUES (?, ?, ?)',
      [req.user.id, song_id, duration_listened || 0]
    );

    res.status(201).json({ message: 'Listen logged' });
  } catch (err) {
    console.error('Listen error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/listen/history?page=&limit=
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [rows] = await pool.query(
      `SELECT lh.id, lh.listened_at, lh.duration_listened,
              s.id AS song_id, s.title, s.album, s.cover_url, s.duration_seconds,
              a.name AS artist_name, g.name AS genre_name
       FROM listening_history lh
         JOIN songs s ON lh.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       WHERE lh.user_id = ?
       ORDER BY lh.listened_at DESC
       LIMIT ? OFFSET ?`,
      [req.user.id, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      'SELECT COUNT(*) AS total FROM listening_history WHERE user_id = ?',
      [req.user.id]
    );

    res.json({ history: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('History error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
