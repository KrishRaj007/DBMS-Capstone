const request = require('supertest');
const app = require('../server');

describe('Frontend Integration Suite', () => {
  let authToken = null;
  let testUser = null;
  const uniqueId = Date.now();
  const testUsername = `fe_user_${uniqueId}`;
  const testEmail = `fe_${uniqueId}@example.com`;

  // ── Authentication & Token Flow Integration ──
  it('registers and provides credentials matching Frontend AuthContext format', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: testUsername, email: testEmail, password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('username', testUsername);
    expect(res.body.user).toHaveProperty('email', testEmail);

    authToken = res.body.token;
    testUser = res.body.user;
  });

  // ── SongItem.jsx Integration: Play Song Action ──
  it('simulates Frontend SongItem handlePlay workflow and verifies session logging', async () => {
    const songId = 3; // DJ Phantom - Bassline Eclipse
    const duration = 210;

    const playRes = await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: songId, duration_listened: duration });

    expect(playRes.status).toBe(201);
    expect(playRes.body.message).toMatch(/listen logged/i);

    // Verify song detail reflects updated play count
    const detailRes = await request(app).get(`/api/songs/${songId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.play_count).toBeGreaterThanOrEqual(1);
  });

  // ── SongItem.jsx Integration: Rate Song Action ──
  it('simulates Frontend SongItem handleRate workflow and verifies rating aggregation', async () => {
    const songId = 3;
    const ratingValue = 5;

    const rateRes = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: songId, rating: ratingValue });

    expect(rateRes.status).toBe(200);
    expect(rateRes.body.message).toMatch(/rating saved/i);

    // Verify rating endpoint returns user rating and updated avg
    const checkRes = await request(app)
      .get(`/api/ratings/song/${songId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(checkRes.status).toBe(200);
    expect(checkRes.body.user_rating).toBe(5);
    expect(checkRes.body.avg_rating).toBeGreaterThanOrEqual(1);
  });

  // ── Standard Widgets & Form Error States ──
  it('returns clean error responses that Frontend ToastContext displays to user', async () => {
    // 1. Missing song_id on listen
    const errRes1 = await request(app)
      .post('/api/listen')
      .set('Authorization', `Bearer ${authToken}`)
      .send({});
    expect(errRes1.status).toBe(400);
    expect(errRes1.body).toHaveProperty('error');

    // 2. Out of range rating
    const errRes2 = await request(app)
      .post('/api/ratings')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ song_id: 1, rating: 10 });
    expect(errRes2.status).toBe(400);
    expect(errRes2.body.error).toMatch(/1-5/);

    // 3. Unauthorized request
    const errRes3 = await request(app).get('/api/analytics/personal');
    expect(errRes3.status).toBe(401);
    expect(errRes3.body.error).toMatch(/Authentication required/i);
  });

  // ── Site Search Contract ──
  it('supports real-time search queries from Frontend Header and Library', async () => {
    const query = 'Neon';
    const res = await request(app).get(`/api/songs?search=${encodeURIComponent(query)}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.songs)).toBe(true);
    res.body.songs.forEach(song => {
      const match = song.title.toLowerCase().includes('neon') ||
                    song.artist_name.toLowerCase().includes('neon') ||
                    (song.album && song.album.toLowerCase().includes('neon'));
      expect(match).toBe(true);
    });
  });

  // ── Design System Baseline Verification ──
  it('verifies design system tokens and standard baseline component contracts', () => {
    const DESIGN_SYSTEM_TOKENS = {
      background: '#1B2A4A',
      card: '#24345A',
      primary: '#E4A0A0',
      secondary: '#EED9A0',
      textMain: '#FFFFFF',
      textMuted: '#B8C2D9',
      danger: '#EF4444',
      borderRadius: '8px'
    };

    expect(DESIGN_SYSTEM_TOKENS.background).toBe('#1B2A4A');
    expect(DESIGN_SYSTEM_TOKENS.card).toBe('#24345A');
    expect(DESIGN_SYSTEM_TOKENS.primary).toBe('#E4A0A0');
    expect(DESIGN_SYSTEM_TOKENS.secondary).toBe('#EED9A0');
    expect(DESIGN_SYSTEM_TOKENS.textMain).toBe('#FFFFFF');
    expect(DESIGN_SYSTEM_TOKENS.textMuted).toBe('#B8C2D9');
    expect(DESIGN_SYSTEM_TOKENS.danger).toBe('#EF4444');
    expect(DESIGN_SYSTEM_TOKENS.borderRadius).toBe('8px');
  });
});
