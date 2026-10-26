const request = require('supertest');
const app = require('../server');

describe('Analytics Calculations Suite', () => {
  let authToken = null;
  const uniqueId = Date.now();
  const testUsername = `analyt_${uniqueId}`;
  const testEmail = `analyt_${uniqueId}@example.com`;

  beforeAll(async () => {
    // Register active user for analytics testing
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUsername, email: testEmail, password: 'Password123!' });
    authToken = res.body.token;

    // Log multiple listens across different songs
    await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 1, duration_listened: 200 });

    await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 1, duration_listened: 214 });

    await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 2, duration_listened: 198 });

    // Submit ratings
    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 1, rating: 5 });

    await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 2, rating: 4 });
  });

  // ── Personal Analytics ──
  describe('GET /api/analytics/personal', () => {
    it('requires authentication', async () => {
      const res = await request(app).get('/api/analytics/personal');
      expect(res.status).toBe(401);
    });

    it('calculates personal overview totals correctly', async () => {
      const res = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const { overview } = res.body;
      expect(overview).toBeDefined();

      // We logged 3 listens across 2 unique songs
      expect(overview.total_listens).toBeGreaterThanOrEqual(3);
      expect(overview.unique_songs).toBeGreaterThanOrEqual(2);
      expect(overview.total_listen_seconds).toBeGreaterThanOrEqual(612); // 200 + 214 + 198
      expect(overview.total_ratings).toBeGreaterThanOrEqual(2);
      expect(overview.avg_given_rating).toBeCloseTo(4.5, 1); // (5+4)/2 = 4.5
    });

    it('groups listens by hour of day and day of week correctly', async () => {
      const res = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const { hourly, daily } = res.body;

      expect(Array.isArray(hourly)).toBe(true);
      expect(hourly.length).toBeGreaterThan(0);
      hourly.forEach(h => {
        expect(h).toHaveProperty('hour');
        expect(h).toHaveProperty('listens');
        expect(h.hour).toBeGreaterThanOrEqual(0);
        expect(h.hour).toBeLessThanOrEqual(23);
        expect(h.listens).toBeGreaterThan(0);
      });

      expect(Array.isArray(daily)).toBe(true);
      expect(daily.length).toBeGreaterThan(0);
      daily.forEach(d => {
        expect(d).toHaveProperty('day');
        expect(d).toHaveProperty('listens');
        expect(d.listens).toBeGreaterThan(0);
      });
    });

    it('ranks top songs, artists, and genres by listen counts', async () => {
      const res = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      const { topSongs, topArtists, topGenres } = res.body;

      expect(Array.isArray(topSongs)).toBe(true);
      expect(topSongs.length).toBeGreaterThan(0);
      // Song 1 had 2 listens, Song 2 had 1 listen
      expect(topSongs[0].id).toBe(1);
      expect(topSongs[0].listens).toBeGreaterThanOrEqual(2);

      expect(Array.isArray(topArtists)).toBe(true);
      expect(topArtists.length).toBeGreaterThan(0);
      expect(topArtists[0]).toHaveProperty('name');
      expect(topArtists[0]).toHaveProperty('listens');

      expect(Array.isArray(topGenres)).toBe(true);
      expect(topGenres.length).toBeGreaterThan(0);
      expect(topGenres[0]).toHaveProperty('name');
      expect(topGenres[0]).toHaveProperty('listens');
    });

    it('includes telemetry provenance metadata', async () => {
      const res = await request(app)
        .get('/api/analytics/personal')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.telemetry_metadata).toBeDefined();
      expect(res.body.telemetry_metadata.data_source).toContain('Application User Session Logs');
    });
  });

  // ── Global Analytics ──
  describe('GET /api/analytics/global', () => {
    it('returns system-wide analytics totals accurately partitioned by provenance tier', async () => {
      const res = await request(app).get('/api/analytics/global');
      expect(res.status).toBe(200);

      const { totals, provenanceTiers } = res.body;
      expect(totals).toBeDefined();

      // Verification of counts
      expect(totals.total_users).toBeGreaterThan(0);
      expect(totals.total_songs).toBeGreaterThan(0);
      expect(totals.total_listens).toBeGreaterThan(0);
      expect(totals.live_app_listens).toBeGreaterThan(0);

      // Provenance tier definitions
      expect(provenanceTiers).toBeDefined();
      expect(provenanceTiers.live_application.namespace).toBe('local');
      expect(provenanceTiers.historical_dataset.namespace).toBe('lastfm');
      expect(provenanceTiers.catalog_aggregated.namespace).toBe('dataset');
    });

    it('calculates genre popularity breakdown across the platform', async () => {
      const res = await request(app).get('/api/analytics/global');
      expect(res.status).toBe(200);

      const { genrePopularity } = res.body;
      expect(Array.isArray(genrePopularity)).toBe(true);
      expect(genrePopularity.length).toBeGreaterThan(0);

      genrePopularity.forEach(g => {
        expect(g).toHaveProperty('name');
        expect(g).toHaveProperty('song_count');
      });
    });

    it('returns top played and top rated songs calculated platform-wide', async () => {
      const res = await request(app).get('/api/analytics/global');
      expect(res.status).toBe(200);

      const { mostPlayed, topRated } = res.body;
      expect(Array.isArray(mostPlayed)).toBe(true);
      expect(mostPlayed.length).toBeGreaterThan(0);

      expect(Array.isArray(topRated)).toBe(true);
      expect(topRated.length).toBeGreaterThan(0);
      topRated.forEach(r => {
        expect(r).toHaveProperty('avg_rating');
        expect(r.avg_rating).toBeGreaterThanOrEqual(1);
        expect(r.avg_rating).toBeLessThanOrEqual(5);
      });
    });

    it('returns active users with their respective source namespaces', async () => {
      const res = await request(app).get('/api/analytics/global');
      expect(res.status).toBe(200);

      const { activeUsers } = res.body;
      expect(Array.isArray(activeUsers)).toBe(true);
      expect(activeUsers.length).toBeGreaterThan(0);
      activeUsers.forEach(u => {
        expect(u).toHaveProperty('username');
        expect(u).toHaveProperty('total_listens');
        expect(u).toHaveProperty('source_namespace');
      });
    });
  });
});
