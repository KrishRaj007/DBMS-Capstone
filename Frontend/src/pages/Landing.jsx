import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CopyButton, ExpandableFAQ } from '../components/StandardWidgets';

export default function Landing() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [activeDemoTrackPlaying, setActiveDemoTrackPlaying] = useState(false);

  const handleDemoLogin = async (username) => {
    try {
      const email = username === 'john_doe' ? 'john@example.com' :
                    username === 'jane_smith' ? 'jane@example.com' : 'music@example.com';
      await login(email, 'password123');
      navigate('/dashboard');
    } catch {
      // handled in auth context
    }
  };

  return (
    <div className="landing-wrapper">
      {/* ── 1. Hero Showcase Section ─────────────────────────────── */}
      <section className="landing-hero-showcase" id="main-content">
        <div className="landing-hero-grid">
          {/* Left Column: Mission, Positioning & Actions */}
          <div className="hero-content-col">
            <div className="hero-system-pill">
              <span className="system-pill-dot" aria-hidden="true"></span>
              <span>DBMS Capstone • 3NF Normalized Engine • MySQL 8.0+ / SQLite</span>
            </div>

            <h1 className="hero-headline">
              Precision Music Recommendations &amp; <span className="text-accent-primary">Listening Analytics</span>
            </h1>

            <p className="hero-lead-text">
              A full-stack relational database management system designed to process high-volume scrobble telemetry, execute adaptive multi-strategy recommendation procedures, and calculate live analytical views across 18,000+ catalog tracks.
            </p>

            <div className="hero-actions-row">
              {user ? (
                <Link to="/dashboard" className="btn btn-primary btn-lg" id="landing-dash-btn">
                  Go to Dashboard →
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary btn-lg" id="landing-register-btn">
                    Create Free Account
                  </Link>
                  <Link to="/login" className="btn btn-secondary btn-lg" id="landing-login-btn">
                    Sign In
                  </Link>
                </>
              )}
              <Link to="/library" className="btn btn-secondary btn-lg">
                Explore Catalog
              </Link>
            </div>

            {/* Quick Live Telemetry Counter Row */}
            <div className="hero-metrics-strip">
              <div className="metric-chip">
                <span className="metric-chip-value">18,002</span>
                <span className="metric-chip-label">Indexed Songs</span>
              </div>
              <div className="metric-chip-divider" aria-hidden="true"></div>
              <div className="metric-chip">
                <span className="metric-chip-value">3,311</span>
                <span className="metric-chip-label">Verified Artists</span>
              </div>
              <div className="metric-chip-divider" aria-hidden="true"></div>
              <div className="metric-chip">
                <span className="metric-chip-value">100,000+</span>
                <span className="metric-chip-label">Historical Scrobbles</span>
              </div>
              <div className="metric-chip-divider" aria-hidden="true"></div>
              <div className="metric-chip">
                <span className="metric-chip-value">10</span>
                <span className="metric-chip-label">Genre Taxonomies</span>
              </div>
            </div>
          </div>

          {/* Right Column: Live Interactive Architectural Showcase Card */}
          <div className="hero-preview-col">
            <div className="catalog-preview-card">
              <div className="preview-card-header">
                <div className="preview-header-left">
                  <span className="preview-terminal-dot"></span>
                  <span className="preview-terminal-title">Relational Telemetry Engine</span>
                </div>
                <span className="badge-provenance">Active Procedure: sp_get_recommendations</span>
              </div>

              {/* Simulated Interactive Track Player */}
              <div className="preview-track-box">
                <div className="preview-track-top">
                  <div className="preview-disc-art">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="12" r="10"></circle>
                      <circle cx="12" cy="12" r="4"></circle>
                      <circle cx="12" cy="12" r="1" fill="currentColor"></circle>
                    </svg>
                  </div>
                  <div className="preview-track-meta">
                    <div className="preview-track-title">Midnight City</div>
                    <div className="preview-track-artist">M83 • Hurry Up, We&apos;re Dreaming</div>
                  </div>
                  <button
                    className={`btn-play-trigger ${activeDemoTrackPlaying ? 'is-playing' : ''}`}
                    onClick={() => setActiveDemoTrackPlaying(!activeDemoTrackPlaying)}
                    title={activeDemoTrackPlaying ? 'Pause demo' : 'Simulate playback'}
                    aria-label="Toggle demo track playback"
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

                {/* Algorithmic Scoring Banner */}
                <div className="preview-rationale-box">
                  <div className="preview-rationale-tag">
                    <span className="rationale-bullet">●</span>
                    <span>Rationale: Content-Based Affinity (Electronic 92% • Pop 85%)</span>
                  </div>
                  <div className="preview-score-formula">
                    Score = (W_genre × 2) + R_song + ln(1 + Plays) = <strong>8.42</strong>
                  </div>
                </div>

                {/* Telemetry Status Grid */}
                <div className="preview-telemetry-grid">
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">DB Trigger</span>
                    <span className="telemetry-cell-value">trg_after_listen</span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Provenance</span>
                    <span className="telemetry-cell-value">source_namespace: local</span>
                  </div>
                  <div className="telemetry-cell">
                    <span className="telemetry-cell-label">Target View</span>
                    <span className="telemetry-cell-value">top_songs_view</span>
                  </div>
                </div>
              </div>

              <div className="preview-footer-note">
                ⚡ Real-time preference re-weighting is calculated dynamically via database event triggers.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Pre-seeded Evaluator Persona Access ───────────────── */}
      {!user && (
        <section className="evaluator-personas-section">
          <div className="section-header-block">
            <h2 className="section-title">One-Click Evaluator Personas</h2>
            <p className="section-subtitle">
              Pre-seeded with real listening logs, star ratings, and tailored preference matrices for instant verification:
            </p>
          </div>

          <div className="personas-grid">
            {/* Persona 1 */}
            <div className="persona-card hover-card">
              <div className="persona-card-top">
                <div className="persona-avatar">JD</div>
                <div className="persona-info">
                  <div className="persona-name">john_doe</div>
                  <div className="persona-email">john@example.com</div>
                </div>
                <span className="persona-taste-badge">Pop &amp; Rock</span>
              </div>
              <div className="persona-stats-row">
                <span>15 Scrobble Logs</span>
                <span>•</span>
                <span>4 Star Ratings</span>
              </div>
              <div className="persona-card-actions">
                <button
                  onClick={() => handleDemoLogin('john_doe')}
                  className="btn btn-primary btn-sm btn-full"
                  id="btn-demo-john"
                >
                  Instant Login →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>

            {/* Persona 2 */}
            <div className="persona-card hover-card">
              <div className="persona-card-top">
                <div className="persona-avatar">JS</div>
                <div className="persona-info">
                  <div className="persona-name">jane_smith</div>
                  <div className="persona-email">jane@example.com</div>
                </div>
                <span className="persona-taste-badge">Jazz &amp; Classical</span>
              </div>
              <div className="persona-stats-row">
                <span>12 Scrobble Logs</span>
                <span>•</span>
                <span>5 Star Ratings</span>
              </div>
              <div className="persona-card-actions">
                <button
                  onClick={() => handleDemoLogin('jane_smith')}
                  className="btn btn-primary btn-sm btn-full"
                  id="btn-demo-jane"
                >
                  Instant Login →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>

            {/* Persona 3 */}
            <div className="persona-card hover-card">
              <div className="persona-card-top">
                <div className="persona-avatar">ML</div>
                <div className="persona-info">
                  <div className="persona-name">music_lover</div>
                  <div className="persona-email">music@example.com</div>
                </div>
                <span className="persona-taste-badge">Electronic &amp; Hip-Hop</span>
              </div>
              <div className="persona-stats-row">
                <span>18 Scrobble Logs</span>
                <span>•</span>
                <span>6 Star Ratings</span>
              </div>
              <div className="persona-card-actions">
                <button
                  onClick={() => handleDemoLogin('music_lover')}
                  className="btn btn-primary btn-sm btn-full"
                  id="btn-demo-lover"
                >
                  Instant Login →
                </button>
                <CopyButton text="password123" label="Pass" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── 3. Database Architecture & Highlights ────────────────── */}
      <section className="landing-architecture-section">
        <div className="section-header-block">
          <h2 className="section-title">Database Architecture &amp; DBMS Highlights</h2>
          <p className="section-subtitle">
            Engineered to demonstrate relational rigor, ACID integrity, and high-performance analytical querying:
          </p>
        </div>

        <div className="grid-cols-3">
          <div className="arch-card hover-card">
            <div className="arch-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
              </svg>
            </div>
            <h3 className="arch-card-title">Normalized Relational Schema</h3>
            <p className="arch-card-text">
              Fully 3NF normalized across 9 core entity tables (`users`, `genres`, `artists`, `songs`, `playlists`, `playlist_songs`, `listening_history`, `ratings`, `user_preferences`) with cascade delete integrity and composite uniqueness constraints.
            </p>
            <div className="arch-meta-pill">3NF • Foreign Keys • Cascade</div>
          </div>

          <div className="arch-card hover-card">
            <div className="arch-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 className="arch-card-title">Stored Procedures &amp; Triggers</h3>
            <p className="arch-card-text">
              Adaptive scoring via `sp_get_recommendations` computing genre affinities and log play counts. Automated triggers (`trg_after_listen`, `trg_after_rating`) immediately re-calculate preference weights upon interaction.
            </p>
            <div className="arch-meta-pill">Procedures • Triggers • Scoring</div>
          </div>

          <div className="arch-card hover-card">
            <div className="arch-card-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3 className="arch-card-title">SQL Analytical Telemetry Views</h3>
            <p className="arch-card-text">
              High-efficiency analytical views (`top_songs_view`, `genre_popularity_view`, `user_analytics_view`) unifying live authenticated sessions (`source_namespace: local`) with historical Last.fm archives without synthetic hallucinations.
            </p>
            <div className="arch-meta-pill">Views • Telemetry • Provenance</div>
          </div>
        </div>
      </section>

      {/* ── 4. Frequently Asked Questions ────────────────────────── */}
      <section className="landing-faq-section">
        <div className="section-header-block">
          <h2 className="section-title">Frequently Asked Questions</h2>
          <p className="section-subtitle">
            System architectural details, recommendation formulas, and dataset provenance:
          </p>
        </div>
        <ExpandableFAQ />
      </section>
    </div>
  );
}
