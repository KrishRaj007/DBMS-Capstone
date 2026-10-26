const request = require('supertest');
const app = require('../server');

describe('API Responses Suite', () => {
  let authToken = null;
  let testUser = null;
  const uniqueId = Date.now();
  const testUsername = `testuser_${uniqueId}`;
  const testEmail = `test_${uniqueId}@example.com`;
  const testPassword = 'Password123!';

  // ── Health Check ──
  describe('GET /api/health', () => {
    it('returns status ok with 200', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  // ── Authentication ──
  describe('POST /api/auth/register & /login', () => {
    it('rejects registration with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'missing_email', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('rejects password shorter than 6 characters', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: 'short_pw_user', email: 'short@pw.com', password: '123' });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/at least 6 characters/i);
    });

    it('registers a new user successfully and returns a JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: testUsername, email: testEmail, password: testPassword });
      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe(testUsername);
      expect(res.body.user.email).toBe(testEmail);
      authToken = res.body.token;
      testUser = res.body.user;
    });

    it('rejects registration with duplicate email or username with 409 Conflict', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ username: testUsername, email: testEmail, password: testPassword });
      expect(res.status).toBe(409);
      expect(res.body.error).toMatch(/already exists/i);
    });

    it('logs in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: testPassword });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe(testEmail);
    });

    it('rejects login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: testEmail, password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });

    it('rejects login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nobody_here_99999@test.com', password: 'Password123!' });
      expect(res.status).toBe(401);
      expect(res.body.error).toMatch(/invalid credentials/i);
    });
  });

  // ── Songs Endpoints ──
  describe('GET /api/songs', () => {
    it('returns paginated song catalog with metadata and total count', async () => {
      const res = await request(app).get('/api/songs?page=1&limit=5');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.songs)).toBe(true);
      expect(res.body.songs.length).toBeLessThanOrEqual(5);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.page).toBe(1);
      expect(res.body.limit).toBe(5);

      const song = res.body.songs[0];
      expect(song).toHaveProperty('id');
      expect(song).toHaveProperty('title');
      expect(song).toHaveProperty('artist_name');
      expect(song).toHaveProperty('genre_name');
      expect(song).toHaveProperty('play_count');
      expect(song).toHaveProperty('avg_rating');
    });

    it('filters songs by search term', async () => {
      const res = await request(app).get('/api/songs?search=Starlight');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.songs)).toBe(true);
      if (res.body.songs.length > 0) {
        expect(res.body.songs[0].title).toMatch(/Starlight/i);
      }
    });

    it('filters songs by genre ID', async () => {
      const res = await request(app).get('/api/songs?genre=1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.songs)).toBe(true);
      res.body.songs.forEach(s => {
        expect(s.genre_id).toBe(1);
      });
    });

    it('returns song details by ID', async () => {
      const listRes = await request(app).get('/api/songs?limit=1');
      const songId = listRes.body.songs[0].id;

      const res = await request(app).get(`/api/songs/${songId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(songId);
      expect(res.body.title).toBeDefined();
      expect(res.body.artist_name).toBeDefined();
    });

    it('returns 404 for non-existent song ID', async () => {
      const res = await request(app).get('/api/songs/999999999');
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });

    it('returns genres list with popularity summary', async () => {
      const res = await request(app).get('/api/songs/genres/list');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
    });

    it('returns artists list', async () => {
      const res = await request(app).get('/api/songs/artists/list');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('name');
    });
  });

  // ── Ratings Endpoints ──
  describe('POST & GET /api/ratings', () => {
    it('requires authentication to rate a song', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .send({ song_id: 1, rating: 5 });
      expect(res.status).toBe(401);
    });

    it('rejects invalid rating values outside 1-5', async () => {
      const res = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ song_id: 1, rating: 6 });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/must be 1-5/i);
    });

    it('records a rating successfully and updates on re-rating (upsert)', async () => {
      const res1 = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ song_id: 1, rating: 4 });
      expect(res1.status).toBe(200);
      expect(res1.body.message).toMatch(/saved/i);

      // Re-rate (upsert)
      const res2 = await request(app)
        .post('/api/ratings')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ song_id: 1, rating: 5 });
      expect(res2.status).toBe(200);
      expect(res2.body.message).toMatch(/saved/i);
    });

    it('fetches user ratings list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/ratings/user')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].song_id).toBe(1);
      expect(res.body[0].rating).toBe(5);
    });

    it('fetches song average rating and current user rating', async () => {
      const res = await request(app)
        .get('/api/ratings/song/1')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('avg_rating');
      expect(res.body).toHaveProperty('rating_count');
      expect(res.body.user_rating).toBe(5);
    });
  });

  // ── Listen History Endpoints ──
  describe('POST & GET /api/listen', () => {
    it('requires authentication to log a listen event', async () => {
      const res = await request(app)
        .post('/api/listen')
        .send({ song_id: 1, duration_listened: 180 });
      expect(res.status).toBe(401);
    });

    it('logs a listening event successfully', async () => {
      const res = await request(app)
        .post('/api/listen')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ song_id: 1, duration_listened: 214 });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/listen logged/i);
    });

    it('fetches listening history with pagination', async () => {
      const res = await request(app)
        .get('/api/listen/history?page=1&limit=10')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.history)).toBe(true);
      expect(res.body.history.length).toBeGreaterThan(0);
      expect(res.body.total).toBeGreaterThan(0);
      expect(res.body.history[0]).toHaveProperty('song_id');
      expect(res.body.history[0]).toHaveProperty('duration_listened');
    });
  });

  // ── Playlists Endpoints ──
  describe('Playlists Endpoints', () => {
    let playlistId = null;

    it('creates a new playlist', async () => {
      const res = await request(app)
        .post('/api/playlists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Roadtrip Beats', description: 'Energetic playlist' });
      expect(res.status).toBe(201);
      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('Roadtrip Beats');
      playlistId = res.body.id;
    });

    it('adds a song to the playlist', async () => {
      const res = await request(app)
        .post(`/api/playlists/${playlistId}/songs`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ song_id: 1 });
      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/added to playlist/i);
    });

    it('retrieves playlist with songs', async () => {
      const res = await request(app)
        .get(`/api/playlists/${playlistId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Roadtrip Beats');
      expect(Array.isArray(res.body.songs)).toBe(true);
      expect(res.body.songs.length).toBe(1);
      expect(res.body.songs[0].id).toBe(1);
    });
  });
});
