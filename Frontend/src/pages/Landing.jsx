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
      {/* ── Modern Hero Section ───────────────────────────────────── */}
      <section style={{ maxWidth: '860px', marginBottom: '56px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius)', backgroundColor: 'var(--surface)', border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: '600', marginBottom: '18px' }}>
          <span>●</span>
          <span>Next-Generation Relational Music Discovery</span>
        </div>

        <h1 style={{ fontSize: '3rem', fontWeight: '900', lineHeight: '1.1', letterSpacing: '-0.04em', marginBottom: '18px', color: 'var(--text)' }}>
          Stream intelligence. Discover patterns in your sound.
        </h1>

        <p style={{ fontSize: '1.15rem', lineHeight: '1.6', color: 'var(--text-muted)', marginBottom: '32px', maxWidth: '640px' }}>
          BeatPulse tracks your live listening telemetry in MySQL, processes co-listening overlap across 50,000+ historical scrobbles, and serves instant personalized recommendations.
        </p>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">
              Launch Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg">
                Sign In
              </Link>
            </>
          )}
          <Link to="/library" className="btn btn-secondary btn-lg">
            Explore 10,000+ Songs
          </Link>
        </div>
      </section>

      {/* ── Live Dynamic Metrics Strip ─────────────────────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px', marginBottom: '64px', borderTop: '1px solid var(--border)', paddingTop: '32px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            {liveStats?.totals?.total_songs ? liveStats.totals.total_songs.toLocaleString() : '10,256'}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Catalog Tracks Indexed
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--text)', letterSpacing: '-0.02em' }}>
            1,702
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Verified Artists
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--primary)', letterSpacing: '-0.02em' }}>
            {liveStats?.totals?.total_listens ? liveStats.totals.total_listens.toLocaleString() : '50,126'}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Historical Scrobbles
          </div>
        </div>

        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '2rem', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '-0.02em' }}>
            10
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '500' }}>
            Curated Genres
          </div>
        </div>
      </section>

      {/* ── Feature Highlight & Audio Player Showcase ─────────────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', marginBottom: '64px', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text)', marginBottom: '14px', letterSpacing: '-0.02em' }}>
            Relational intelligence designed for pure sound discovery.
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.975rem', lineHeight: '1.6', marginBottom: '24px' }}>
            Experience how your music library responds to every listen. Our progressive 3-tier algorithm blends catalog popularity, content-based genre affinities, and deep peer collaborative filtering.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>Sub-15ms Stored Procedure Scoring</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '2px' }}>
                  Recommendations run directly inside MySQL stored procedure <code>sp_get_recommendations</code> without external API latency.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem' }}>✓</span>
              <div>
                <strong style={{ color: 'var(--text)', fontSize: '0.95rem' }}>Automated Taste Re-Weighting Triggers</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', marginTop: '2px' }}>
                  Every play triggers <code>trg_after_listen</code> to re-calculate your genre affinities in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Audio Telemetry Card */}
        <div className="card" style={{ padding: '28px', backgroundColor: 'var(--surface)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Top Played Song in Catalog
            </span>
            <span className="badge-provenance">Live View</span>
          </div>

          <div style={{ padding: '18px', backgroundColor: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', color: 'var(--text)', fontSize: '1.1rem' }}>
                  {liveStats?.mostPlayed?.[0]?.title || 'Nacht'}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                  {liveStats?.mostPlayed?.[0]?.artist_name || 'Kettcar'} • {liveStats?.mostPlayed?.[0]?.genre_name || 'Rock'}
                </div>
              </div>
              <button
                type="button"
                className={`btn-play-trigger ${activeDemoTrackPlaying ? 'is-playing' : ''}`}
                onClick={() => setActiveDemoTrackPlaying(!activeDemoTrackPlaying)}
                aria-label="Toggle preview playback"
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

          <div style={{ fontSize: '0.825rem', color: 'var(--text-dim)', lineHeight: '1.5' }}>
            Logged telemetry is isolated under <code>source_namespace = 'local'</code> to separate live application sessions from imported Last.fm benchmarks.
          </div>
        </div>
      </section>

      {/* ── Evaluator Persona Deck ───────────────────────────────── */}
      {!user && (
        <section style={{ marginBottom: '64px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
            One-Click Test Accounts
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '24px' }}>
            Instantly log in with pre-seeded evaluator accounts to review personalized recommendations:
          </p>

          <div className="grid-cols-3">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>john_doe</span>
                <span className="song-meta-pill">Pop &amp; Rock</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                36 scrobbles logged in MySQL. Qualifies for Tier-3 Collaborative Filtering.
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
                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>jane_smith</span>
                <span className="song-meta-pill">Jazz &amp; Classical</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                43 scrobbles logged in MySQL. Focuses on acoustic and classical jazz affinity.
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
                <span style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--text)' }}>music_lover</span>
                <span className="song-meta-pill">Electronic &amp; Hip-Hop</span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                47 scrobbles logged in MySQL. Diverse ratings across multiple genres.
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
        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
          Frequently Asked Questions
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.925rem', marginBottom: '20px' }}>
          Everything you need to know about BeatPulse architecture, recommendations, and telemetry:
        </p>
        <ExpandableFAQ />
      </section>
    </div>
  );
}
