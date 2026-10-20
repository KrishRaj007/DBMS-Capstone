const router = require('express').Router();
const pool = require('../db/connection');

// GET /api/songs?search=&genre=&artist=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { search, genre, artist, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];

    if (search) {
      where.push('(s.title LIKE ? OR a.name LIKE ? OR s.album LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (genre) {
      where.push('g.id = ?');
      params.push(parseInt(genre));
    }
    if (artist) {
      where.push('a.id = ?');
      params.push(parseInt(artist));
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [rows] = await pool.query(
      `SELECT s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
              a.id AS artist_id, a.name AS artist_name,
              g.id AS genre_id, g.name AS genre_name,
              COALESCE(pc.play_count, 0) AS play_count,
              COALESCE(rc.avg_rating, 0) AS avg_rating
       FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
         LEFT JOIN (SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id) pc ON s.id = pc.song_id
         LEFT JOIN (SELECT song_id, AVG(rating) AS avg_rating FROM ratings GROUP BY song_id) rc ON s.id = rc.song_id
       ${whereClause}
       ORDER BY s.title ASC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       ${whereClause}`,
      params
    );

    res.json({ songs: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error('Songs list error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/songs/:id
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT s.*, a.name AS artist_name, a.bio AS artist_bio,
              g.name AS genre_name,
              COALESCE(pc.play_count, 0) AS play_count,
              COALESCE(rc.avg_rating, 0) AS avg_rating,
              COALESCE(rc.rating_count, 0) AS rating_count
       FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
         LEFT JOIN (SELECT song_id, COUNT(*) AS play_count FROM listening_history GROUP BY song_id) pc ON s.id = pc.song_id
         LEFT JOIN (SELECT song_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count FROM ratings GROUP BY song_id) rc ON s.id = rc.song_id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Song not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Song detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/songs/genres/list
router.get('/genres/list', async (_req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM genre_popularity_view');
    res.json(rows);
  } catch (err) {
    console.error('Genres error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/songs/artists/list
router.get('/artists/list', async (_req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.name, a.image_url, COUNT(s.id) AS song_count
       FROM artists a LEFT JOIN songs s ON a.id = s.artist_id
       GROUP BY a.id ORDER BY a.name`
    );
    res.json(rows);
  } catch (err) {
    console.error('Artists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
