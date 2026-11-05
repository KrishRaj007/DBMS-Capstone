const router = require('express').Router();
const pool = require('../db/connection');

// GET /api/songs?search=&genre=&artist=&sort=&page=&limit=
router.get('/', async (req, res) => {
  try {
    const { search, genre, artist, sort = 'title', page = 1, limit = 20 } = req.query;
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

    // Dynamic sort ordering
    let orderByClause = 'ORDER BY s.title ASC';
    if (sort === 'popular') {
      orderByClause = 'ORDER BY play_count DESC, avg_rating DESC, s.title ASC';
    } else if (sort === 'rating') {
      orderByClause = 'ORDER BY avg_rating DESC, play_count DESC, s.title ASC';
    } else if (sort === 'recent') {
      orderByClause = 'ORDER BY s.release_date DESC, s.id DESC';
    } else if (sort === 'duration') {
      orderByClause = 'ORDER BY s.duration_seconds DESC';
    }

    const [rows] = await pool.query(
      `SELECT s.id, s.title, s.album, s.duration_seconds, s.cover_url, s.release_date,
              a.id AS artist_id, a.name AS artist_name,
              g.id AS genre_id, g.name AS genre_name,
              COALESCE(pc.play_count, 0) AS play_count,
              COALESCE(rc.avg_rating, 0) AS avg_rating,
              COALESCE(rc.rating_count, 0) AS rating_count
       FROM songs s
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
         LEFT JOIN (
           SELECT song_id, COUNT(*) AS play_count
           FROM listening_history
           GROUP BY song_id
         ) pc ON s.id = pc.song_id
         LEFT JOIN (
           SELECT song_id, AVG(rating) AS avg_rating, COUNT(*) AS rating_count
           FROM ratings
           GROUP BY song_id
         ) rc ON s.id = rc.song_id
       ${whereClause}
       ${orderByClause}
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

    res.json({ songs: rows, total, page: parseInt(page), limit: parseInt(limit), sort });
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

// GET /api/songs/artists/list?search=&limit=
router.get('/artists/list', async (req, res) => {
  try {
    const { search, limit = 100 } = req.query;
    let whereClause = '';
    let params = [];

    if (search) {
      whereClause = 'WHERE a.name LIKE ?';
      params.push(`%${search}%`);
    }

    const [rows] = await pool.query(
      `SELECT a.id, a.name, a.image_url, a.mbid, COUNT(s.id) AS song_count
       FROM artists a
         LEFT JOIN songs s ON a.id = s.artist_id
       ${whereClause}
       GROUP BY a.id, a.name, a.image_url, a.mbid
       ORDER BY song_count DESC, a.name ASC
       LIMIT ?`,
      [...params, parseInt(limit)]
    );
    res.json(rows);
  } catch (err) {
    console.error('Artists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/songs/artists/:id — Full artist profile with catalog tracks & stats
router.get('/artists/:id', async (req, res) => {
  try {
    const artistId = req.params.id;

    const [artistRows] = await pool.query(
      `SELECT a.id, a.name, a.bio, a.image_url, a.mbid, a.source_namespace,
              COUNT(DISTINCT s.id) AS song_count,
              COALESCE(SUM(pc.play_count), 0) AS total_plays
       FROM artists a
         LEFT JOIN songs s ON a.id = s.artist_id
         LEFT JOIN (
           SELECT song_id, COUNT(*) AS play_count
           FROM listening_history
           GROUP BY song_id
         ) pc ON s.id = pc.song_id
       WHERE a.id = ?
       GROUP BY a.id, a.name, a.bio, a.image_url, a.mbid, a.source_namespace`,
      [artistId]
    );

    if (artistRows.length === 0) {
      return res.status(404).json({ error: 'Artist not found' });
    }

    // Top tracks by this artist
    const [topTracks] = await pool.query(
      `SELECT s.id, s.title, s.album, s.duration_seconds, s.release_date,
              g.name AS genre_name,
              COALESCE(pc.play_count, 0) AS play_count,
              COALESCE(rc.avg_rating, 0) AS avg_rating
       FROM songs s
         JOIN genres g ON s.genre_id = g.id
         LEFT JOIN (
           SELECT song_id, COUNT(*) AS play_count
           FROM listening_history
           GROUP BY song_id
         ) pc ON s.id = pc.song_id
         LEFT JOIN (
           SELECT song_id, AVG(rating) AS avg_rating
           FROM ratings
           GROUP BY song_id
         ) rc ON s.id = rc.song_id
       WHERE s.artist_id = ?
       ORDER BY play_count DESC, s.title ASC
       LIMIT 10`,
      [artistId]
    );

    res.json({
      ...artistRows[0],
      topTracks,
    });
  } catch (err) {
    console.error('Artist detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
