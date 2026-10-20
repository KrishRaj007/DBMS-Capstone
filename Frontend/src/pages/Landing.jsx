import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CopyButton, ExpandableFAQ } from '../components/StandardWidgets';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const handleDemoLogin = async (username) => {
    try {
      const email = username === 'john_doe' ? 'john@example.com' :
                    username === 'jane_smith' ? 'jane@example.com' : 'music@example.com';
      await login(email, 'password123');
      navigate('/dashboard');
    } catch {
      // handled in auth
    }
  };

  return (
    <div>
      <section className="landing-hero" id="main-content">
        <h1>
          Intelligent Music Recommendations & <span>Listening Analytics</span>
        </h1>
        <p>
          A relational DBMS capstone system powered by MySQL 8.0, normalized schema design, stored procedures, automated triggers, and multi-dimensional listening telemetry.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary" id="landing-dash-btn">
              Go to Dashboard →
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary" id="landing-register-btn">
                Create Free Account
              </Link>
              <Link to="/login" className="btn btn-secondary" id="landing-login-btn">
                Sign In
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Demo Accounts Quick Access */}
      {!user && (
        <div style={{ maxWidth: '900px', margin: '0 auto 40px', padding: '0 24px' }}>
          <div className="card">
            <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: 'var(--secondary)' }}>
              ⚡ Quick Demo Accounts (Pre-seeded with Listening Logs & Ratings)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Click any account below for instant one-click login to inspect personalized recommendations and analytics dashboards:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
              <div style={{ backgroundColor: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>john_doe</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>john@example.com • Pop & Rock</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleDemoLogin('john_doe')} className="btn btn-primary btn-sm">
                    Instant Login
                  </button>
                  <CopyButton text="password123" label="Pass" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>jane_smith</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>jane@example.com • Jazz & Classical</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleDemoLogin('jane_smith')} className="btn btn-primary btn-sm">
                    Instant Login
                  </button>
                  <CopyButton text="password123" label="Pass" />
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--bg)', padding: '14px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>music_lover</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>music@example.com • Electronic & Hip-Hop</div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleDemoLogin('music_lover')} className="btn btn-primary btn-sm">
                    Instant Login
                  </button>
                  <CopyButton text="password123" label="Pass" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Capstone Features Showcase */}
      <div className="landing-features">
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '700', marginBottom: '32px' }}>
          Database Architecture & Core Highlights
        </h2>

        <div className="grid-cols-3">
          <div className="card hover-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
              Normalized Schema
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              3NF relational structure spanning 9 entities with foreign keys, composite indexes, and cascade integrity constraints.
            </p>
          </div>

          <div className="card hover-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
              Stored Procedures
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Server-side recommendation engine evaluating genre affinity weights, user star ratings, and logarithmic play frequencies.
            </p>
          </div>

          <div className="card hover-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '8px' }}>
              Event Triggers
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              Automated database triggers update preference weights in real time whenever a listen session is logged or a song is rated.
            </p>
          </div>
        </div>

        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '700', marginBottom: '16px' }}>
            Frequently Asked Questions
          </h2>
          <ExpandableFAQ />
        </div>
      </div>
    </div>
  );
}
