require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes           = require('./routes/auth');
const songRoutes           = require('./routes/songs');
const listenRoutes         = require('./routes/listen');
const ratingRoutes         = require('./routes/ratings');
const playlistRoutes       = require('./routes/playlists');
const recommendationRoutes = require('./routes/recommendations');
const analyticsRoutes      = require('./routes/analytics');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',            authRoutes);
app.use('/api/songs',           songRoutes);
app.use('/api/listen',          listenRoutes);
app.use('/api/ratings',         ratingRoutes);
app.use('/api/playlists',       playlistRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics',       analyticsRoutes);

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ── Global error handler ──────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ──────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🎵 Music Analytics API running on http://localhost:${PORT}`);
  });
}

module.exports = app;
