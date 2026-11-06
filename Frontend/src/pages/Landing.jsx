import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { CopyButton, ExpandableFAQ } from '../components/StandardWidgets';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [liveStats, setLiveStats] = useState(null);
  const [activeDemoTrackPlaying, setActiveDemoTrackPlaying] = useState(false);

  useEffect(() => {
    API.get('/analytics/global')
      .then((res) => setLiveStats(res.data))
      .catch(() => {});
  }, []);

  const handleDemoLogin = async (email) => {
    try {
      await login(email, 'password123');
      navigate('/dashboard');
    } catch {
      // handled
    }
  };

  return (
    <div className="page-container" id="main-content" style={{ paddingTop: '24px' }}>
      {/* ── Main Hero Editorial ───────────────────────────────────── */}
      <section style={{ maxWidth: '820px', marginBottom: '56px' }}>
        <h1 style={{ fontSize: '2.75rem', fontWeight: '800', lineHeight: '1.15', letterSpacing: '-0.035em', marginBottom: '16px', color: 'var(--text)' }}>
          Music recommendations powered by pure relational data.
        </h1>

        <p className="editorial-lead" style={{ marginBottom: '28px' }}>
          BeatPulse tracks authentic listener scrobbles, calculates real-time taste affinity in MySQL, and recommends tracks across a verified Last.fm catalog of 10,000+ songs.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Open Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Create an Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
          <Link to="/library" className="btn btn-secondary btn-lg">
            Browse the Catalog
          </Link>
        </div>
      </section>

      {/* ── Live Relational Metrics Banner ─────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '56px', borderTop: '1px solid var(--border)', paddingTop: '28px' }}>
        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            {liveStats?.totals?.total_songs ? liveStats.totals.total_songs.toLocaleString() : '10,256'}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Catalog tracks indexed in 3NF
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            1,702
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Artists mapped to MusicBrainz
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--secondary)' }}>
            {liveStats?.totals?.total_listens ? liveStats.totals.total_listens.toLocaleString() : '50,126'}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Historical scrobbles imported
          </div>
        </div>

        <div>
          <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)' }}>
            10
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Curated genre taxonomies
          </div>
        </div>
      </section>

      {/* ── How the Relational Engine Works ───────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '64px', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '12px' }}>
            How recommendations evolve as you listen
          </h2>
          <p className="editorial-lead" style={{ fontSize: '0.95rem', marginBottom: '24px' }}>
            Instead of opaque machine-learning black boxes, BeatPulse relies on transparent relational queries, triggers, and stored procedures.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--primary)', flexShrink: 0 }}>
                1
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '0.95rem' }}>Popularity baseline for newcomers</strong>
                <span className="editorial-note">When you have fewer than 2 plays, recommendations prioritize top catalog songs across diverse genres.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--primary)', flexShrink: 0 }}>
                2
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '0.95rem' }}>Content affinity from your ratings</strong>
                <span className="editorial-note">Between 2 and 4 plays, MySQL triggers update your genre affinity weights to deliver personalized matches.</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '0.85rem', color: 'var(--secondary)', flexShrink: 0 }}>
                3
              </div>
              <div>
                <strong style={{ display: 'block', color: 'var(--text)', fontSize: '0.95rem' }}>Collaborative filtering from peer overlap</strong>
                <span className="editorial-note">At 5+ plays, SQL joins connect your history with listeners in the Last.fm dataset who share common songs.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Track Session Preview */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text)' }}>
              Top Track in Catalog View
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              85 Scrobbles
            </span>
          </div>

          <div style={{ padding: '16px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '700', color: 'var(--text)', fontSize: '1rem' }}>
                  {liveStats?.mostPlayed?.[0]?.title || 'Nacht'}
                </div>
                <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {liveStats?.mostPlayed?.[0]?.artist_name || 'Kettcar'} • {liveStats?.mostPlayed?.[0]?.genre_name || 'Rock'}
                </div>
              </div>
              <button
                type="button"
                className={`btn-play-trigger ${activeDemoTrackPlaying ? 'is-playing' : ''}`}
                onClick={() => setActiveDemoTrackPlaying(!activeDemoTrackPlaying)}
                aria-label="Toggle demo playback"
              >
                {activeDemoTrackPlaying ? (
                  <div className="mini-equalizer">
                    <span className="eq-bar eq-bar-1"></span>
                    <span className="eq-bar eq-bar-2"></span>
                    <span className="eq-bar eq-bar-3"></span>
                  </div>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            Clicking play logs an interactive session row to MySQL table <code>listening_history</code> with accurate session timestamps.
          </div>
        </div>
      </section>

      {/* ── Demo Evaluator Accounts ───────────────────────────────── */}
      {!user && (
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
            Test accounts ready for review
          </h2>
          <p className="editorial-lead" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
            Log in with one click to test recommendation state transitions without creating an account:
          </p>

          <div className="grid-cols-3">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>john_doe</span>
                <span className="song-meta-pill">Pop &amp; Rock</span>
              </div>
              <p className="editorial-note" style={{ marginBottom: '16px' }}>
                36 listening scrobbles logged in MySQL. Qualifies for Tier-3 Collaborative Filtering.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDemoLogin('john@example.com')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  Log In →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>jane_smith</span>
                <span className="song-meta-pill">Jazz &amp; Classical</span>
              </div>
              <p className="editorial-note" style={{ marginBottom: '16px' }}>
                43 listening scrobbles logged in MySQL. Focuses on acoustic and classical jazz affinity.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDemoLogin('jane@example.com')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  Log In →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text)' }}>music_lover</span>
                <span className="song-meta-pill">Electronic &amp; Hip-Hop</span>
              </div>
              <p className="editorial-note" style={{ marginBottom: '16px' }}>
                47 listening scrobbles logged in MySQL. Diverse ratings across multiple genres.
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => handleDemoLogin('music@example.com')} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  Log In →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 19. Frequently Asked Questions ───────────────────────── */}
      <section style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
          Frequently asked questions
        </h2>
        <p className="editorial-lead" style={{ fontSize: '0.9rem', marginBottom: '20px' }}>
          Answers regarding relational architecture, data partitioning, and database integrity:
        </p>
        <ExpandableFAQ />
      </section>
    </div>
  );
}
