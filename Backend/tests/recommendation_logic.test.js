const request = require('supertest');
const app = require('../server');

describe('Recommendation Logic Suite', () => {
  let coldStartToken = null;
  let activeUserToken = null;
  let activeUserId = null;
  const uniqueId = Date.now();

  beforeAll(async () => {
    // 1. Cold start user (zero listening history)
    const coldRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `cold_${uniqueId}`,
        email: `cold_${uniqueId}@example.com`,
        password: 'Password123!'
      });
    coldStartToken = coldRes.body.token;

    // 2. Active user (with listening history)
    const activeRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: `active_${uniqueId}`,
        email: `active_${uniqueId}@example.com`,
        password: 'Password123!'
      });
    activeUserToken = activeRes.body.token;
    activeUserId = activeRes.body.user.id;

    // Active user listens to songs 1 and 2
    await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ song_id: 1, duration_listened: 214 });

    await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ song_id: 2, duration_listened: 198 });

    // Active user rates song 1
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${activeUserToken}`)
      .send({ song_id: 1, rating: 5 });
  });

  describe('GET /api/recommendations', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/recommendations');
      expect(res.status).toBe(401);
    });

    it('generates popularity baseline recommendations for cold start user', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=10')
        .set('Authorization', `Bearer ${coldStartToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recommendations');
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.recommendations.length).toBeGreaterThan(0);

      // Cold start user flags
      expect(res.body.is_personalized).toBe(false);
      expect(res.body.strategy).toBe('popularity_baseline');
      expect(res.body.user_state).toBe('cold_start');
      expect(res.body.explanation).toMatch(/Platform Baseline|Popular/i);

      // Check item properties
      const item = res.body.recommendations[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('artist_name');
      expect(item).toHaveProperty('genre_name');
    });

    it('excludes already-listened songs from user recommendations', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=20')
        .set('Authorization', `Bearer ${activeUserToken}`);

      expect(res.status).toBe(200);
      const recommendedSongIds = res.body.recommendations.map(s => s.id);

      // Active user listened to song 1 and song 2
      // Neither should be recommended!
      expect(recommendedSongIds).not.toContain(1);
      expect(recommendedSongIds).not.toContain(2);
    });

    it('produces personalized recommendations for active user based on listening affinity', async () => {
      const res = await request(app)
        .get('/api/recommendations?limit=10')
        .set('Authorization', `Bearer ${activeUserToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations.length).toBeGreaterThan(0);
      expect(res.body.is_personalized).toBe(true);
      expect(['content_based', 'collaborative_filtering']).toContain(res.body.strategy);
      expect(res.body.user_state).toBe('active');
      expect(res.body.explanation).toBeDefined();
    });

    it('respects the limit query parameter', async () => {
      const limit = 5;
      const res = await request(app)
        .get(`/api/recommendations?limit=${limit}`)
        .set('Authorization', `Bearer ${coldStartToken}`);

      expect(res.status).toBe(200);
      expect(res.body.recommendations.length).toBeLessThanOrEqual(limit);
      expect(res.body.count).toBeLessThanOrEqual(limit);
    });
  });
});
