import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { LoadingSpinner } from '../components/StandardWidgets';
import SongItem from '../components/SongItem';

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [recMeta, setRecMeta] = useState({
    isPersonalized: false,
    strategy: 'popularity_baseline',
    explanation: 'Platform catalog baseline',
    userState: 'cold_start',
  });
  const [history, setHistory] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, recRes, historyRes, playlistRes] = await Promise.all([
        API.get('/analytics/personal'),
        API.get('/recommendations?limit=6'),
        API.get('/listen/history?limit=5'),
        API.get('/playlists'),
      ]);

      setStats(analyticsRes.data.overview || {});

      const recData = recRes.data;
      const recItems = Array.isArray(recData) ? recData : (recData?.recommendations || []);
      setRecommendations(recItems);
      setRecMeta({
        isPersonalized: Boolean(recData?.is_personalized ?? recItems.some(r => r.is_personalized)),
        strategy: recData?.strategy ?? recItems[0]?.strategy ?? 'popularity_baseline',
        explanation: recData?.explanation ?? (recItems[0]?.is_personalized
          ? 'Personalized based on your musical taste'
          : 'Platform catalog baseline for new listeners'),
        userState: recData?.user_state ?? (recItems.some(r => r.is_personalized) ? 'active' : 'cold_start'),
      });

      setHistory(historyRes.data.history || []);
      setPlaylists(playlistRes.data || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const formatMinutes = (sec) => {
    const mins = Math.floor((sec || 0) / 60);
    return `${mins} min`;
  };

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Querying MySQL analytical views and stored procedures..." />
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      {/* ── Dashboard Page Header ─────────────────────────────────── */}
      <div className="page-header">
        <div>
          <div className="badge-provenance" style={{ display: 'inline-flex', marginBottom: '8px' }}>
            <span>Authenticated Session • User ID #{user?.id || 1}</span>
          </div>
          <h1 className="page-title">Welcome back, {user?.username}</h1>
          <p className="page-subtitle">
            {recMeta.isPersonalized
              ? 'Real-time telemetry and algorithmic recommendations derived from your relational profile.'
              : 'Live listening activity and platform catalog recommendations for new listeners.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/library" className="btn btn-secondary btn-sm">
            Browse All Songs
          </Link>
          <Link to="/analytics" className="btn btn-primary btn-sm">
            View Full Analytics →
          </Link>
        </div>
      </div>

      {/* ── KPI Telemetry Row (from user_analytics_view) ───────────── */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="stat-box hover-card">
          <div className="stat-box-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div className="stat-box-value">{stats?.total_listens || 0}</div>
          <div className="stat-box-label">Total Songs Played</div>
          <div className="stat-box-sub">From listening_history</div>
        </div>

        <div className="stat-box hover-card">
          <div className="stat-box-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="10 8 16 12 10 16 10 8"></polygon>
            </svg>
          </div>
          <div className="stat-box-value">{stats?.unique_songs || 0}</div>
          <div className="stat-box-label">Unique Songs Discovered</div>
          <div className="stat-box-sub">Distinct song_id diversity</div>
        </div>

        <div className="stat-box hover-card">
          <div className="stat-box-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
          </div>
          <div className="stat-box-value">{formatMinutes(stats?.total_listen_seconds)}</div>
          <div className="stat-box-label">Listening Duration Logged</div>
          <div className="stat-box-sub">Sum(duration_listened)</div>
        </div>

        <div className="stat-box hover-card">
          <div className="stat-box-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </div>
          <div className="stat-box-value">
            {stats?.avg_given_rating ? Number(stats.avg_given_rating).toFixed(1) : '0.0'} ★
          </div>
          <div className="stat-box-label">Mean Rating Given</div>
          <div className="stat-box-sub">Verified ratings table</div>
        </div>
      </div>

      {/* ── Recommended For You Section ───────────────────────────── */}
      <section style={{ marginBottom: '36px' }}>
        <div className="recommendation-header-card">
          <div className="rec-header-content">
            <div className="rec-title-row">
              <h2 className="rec-section-title">
                {recMeta.isPersonalized ? 'Recommended Tracks' : 'Platform Catalog Discovery'}
              </h2>
              <span
                className={`strategy-pill ${recMeta.isPersonalized ? 'strategy-personalized' : 'strategy-baseline'}`}
              >
                {recMeta.strategy === 'collaborative_filtering' && 'Collaborative Filtering (Peer Tastes)'}
                {recMeta.strategy === 'content_based' && 'Content-Based (Artist & Genre Affinity)'}
                {recMeta.strategy === 'popularity_baseline' && (recMeta.userState === 'cold_start' ? 'Platform Baseline (Cold Start)' : 'Catalog Popularity Baseline')}
              </span>
            </div>
            <p className="rec-explanation-text">
              {recMeta.explanation}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn btn-secondary btn-sm"
            title="Recalculate recommendations from stored procedure"
          >
            ↻ Re-Query Engine
          </button>
        </div>

        {/* Cold Start Notice Banner — transparent and truthful */}
        {!recMeta.isPersonalized && (
          <div className="cold-start-banner">
            <div className="cold-start-text">
              <span className="cold-start-icon">ℹ️</span>
              <span>
                <strong>New Listener Cold-Start Mode:</strong> Recommendations currently reflect verified catalog engagement because your account has few recorded listens. Play or rate songs in the library to trigger preference recalculation!
              </span>
            </div>
            <Link to="/library" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              Explore Library →
            </Link>
          </div>
        )}

        {recommendations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '14px' }}>
              No recommendations generated yet. Start listening and rating songs in the library to train your preference vectors!
            </p>
            <Link to="/library" className="btn btn-primary btn-sm">
              Explore Song Library
            </Link>
          </div>
        ) : (
          <div className="song-items-stack">
            {recommendations.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                playlists={playlists}
                onPlaySuccess={() => loadDashboardData()}
                onRateSuccess={() => loadDashboardData()}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Grid: Recent History & Playlists ──────────────────────── */}
      <div className="grid-cols-2">
        {/* Recent Listening History */}
        <div className="card">
          <div className="panel-header-row">
            <div>
              <h3 className="panel-title">Recent Listening Telemetry</h3>
              <p className="panel-sub">Logged to listening_history with exact timestamps</p>
            </div>
            <span className="badge-provenance">Audit Log</span>
          </div>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '12px 0' }}>
              No recent listens recorded yet. Click play on any track to start logging telemetry!
            </p>
          ) : (
            <div className="history-items-list">
              {history.map((item) => (
                <div key={item.id} className="history-row-item">
                  <div className="history-row-left">
                    <span className="history-track-bullet" aria-hidden="true">▶</span>
                    <div>
                      <div className="history-track-title">{item.title}</div>
                      <div className="history-track-sub">
                        {item.artist_name} • <span className="song-meta-pill" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>{item.genre_name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="history-row-right">
                    <div className="history-date">{new Date(item.listened_at).toLocaleDateString()}</div>
                    <div className="history-dur">{Math.round(item.duration_listened / 60)}m listened</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Playlists */}
        <div className="card">
          <div className="panel-header-row">
            <div>
              <h3 className="panel-title">Curated Playlists</h3>
              <p className="panel-sub">Many-to-Many relational ordering in playlist_songs</p>
            </div>
            <Link to="/playlists" className="btn btn-secondary btn-sm">
              + New List
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
                You have not created any custom playlists yet.
              </p>
              <Link to="/playlists" className="btn btn-primary btn-sm">
                Create First Playlist
              </Link>
            </div>
          ) : (
            <div className="playlists-stack">
              {playlists.slice(0, 4).map((pl) => (
                <Link
                  key={pl.id}
                  to={`/playlists?id=${pl.id}`}
                  className="playlist-item-card hover-card"
                >
                  <div>
                    <div className="playlist-card-title">{pl.name}</div>
                    <div className="playlist-card-sub">
                      {pl.song_count || 0} tracks • {pl.is_public ? 'Public' : 'Private'}
                    </div>
                  </div>
                  <span className="playlist-arrow">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
