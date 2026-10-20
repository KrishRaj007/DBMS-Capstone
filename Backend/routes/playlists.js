const router = require('express').Router();
const pool = require('../db/connection');
const auth = require('../middleware/auth');

// GET /api/playlists — user's playlists
router.get('/', auth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT p.*, COUNT(ps.id) AS song_count
       FROM playlists p
         LEFT JOIN playlist_songs ps ON p.id = ps.playlist_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.updated_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error('Playlists error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/playlists
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, is_public = true } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const [result] = await pool.query(
      'INSERT INTO playlists (user_id, name, description, is_public) VALUES (?, ?, ?, ?)',
      [req.user.id, name, description || '', is_public]
    );
    res.status(201).json({ id: result.insertId, name, description, is_public });
  } catch (err) {
    console.error('Create playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/playlists/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const [plRows] = await pool.query(
      'SELECT * FROM playlists WHERE id = ? AND (user_id = ? OR is_public = TRUE)',
      [req.params.id, req.user.id]
    );
    if (plRows.length === 0) return res.status(404).json({ error: 'Playlist not found' });

    const [songs] = await pool.query(
      `SELECT ps.position, ps.added_at,
              s.id, s.title, s.album, s.duration_seconds, s.cover_url,
              a.name AS artist_name, g.name AS genre_name
       FROM playlist_songs ps
         JOIN songs s ON ps.song_id = s.id
         JOIN artists a ON s.artist_id = a.id
         JOIN genres g ON s.genre_id = g.id
       WHERE ps.playlist_id = ?
       ORDER BY ps.position ASC`,
      [req.params.id]
    );

    res.json({ ...plRows[0], songs });
  } catch (err) {
    console.error('Playlist detail error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/playlists/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, is_public } = req.body;
    const [existing] = await pool.query(
      'SELECT id FROM playlists WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (existing.length === 0) return res.status(404).json({ error: 'Playlist not found' });

    await pool.query(
      'UPDATE playlists SET name = COALESCE(?, name), description = COALESCE(?, description), is_public = COALESCE(?, is_public) WHERE id = ?',
      [name, description, is_public, req.params.id]
    );
    res.json({ message: 'Playlist updated' });
  } catch (err) {
    console.error('Update playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/playlists/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM playlists WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Playlist not found' });
    res.json({ message: 'Playlist deleted' });
  } catch (err) {
    console.error('Delete playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/playlists/:id/songs — add song to playlist
router.post('/:id/songs', auth, async (req, res) => {
  try {
    const { song_id } = req.body;
    if (!song_id) return res.status(400).json({ error: 'song_id is required' });

    // Verify ownership
    const [pl] = await pool.query('SELECT id FROM playlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (pl.length === 0) return res.status(404).json({ error: 'Playlist not found' });

    // Get next position
    const [[{ maxPos }]] = await pool.query(
      'SELECT COALESCE(MAX(position), 0) AS maxPos FROM playlist_songs WHERE playlist_id = ?',
      [req.params.id]
    );

    await pool.query(
      'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
      [req.params.id, song_id, maxPos + 1]
    );
    res.status(201).json({ message: 'Song added to playlist' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Song already in playlist' });
    }
    console.error('Add to playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/playlists/:id/songs/:songId
router.delete('/:id/songs/:songId', auth, async (req, res) => {
  try {
    const [result] = await pool.query(
      `DELETE ps FROM playlist_songs ps
       JOIN playlists p ON ps.playlist_id = p.id
       WHERE ps.playlist_id = ? AND ps.song_id = ? AND p.user_id = ?`,
      [req.params.id, req.params.songId, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Song removed from playlist' });
  } catch (err) {
    console.error('Remove from playlist error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
