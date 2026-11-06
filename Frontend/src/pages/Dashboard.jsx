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
    explanation: 'Popular tracks across the platform',
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
          : 'Popular tracks across the catalog for new listeners'),
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
        <LoadingSpinner message="Loading your personalized dashboard..." />
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.username}</h1>
          <p className="page-subtitle">
            {recMeta.isPersonalized
              ? 'Your recommendations are shaped by your listening activity and ratings.'
              : 'Listen to a few tracks to start building your personalized taste profile.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/library" className="btn btn-secondary btn-sm">
            Browse All Tracks
          </Link>
          <Link to="/analytics" className="btn btn-primary btn-sm">
            View Analytics →
          </Link>
        </div>
      </div>

      {/* ── Listening Overview Metrics ───────────────────────────── */}
      <div className="grid-cols-4" style={{ marginBottom: '36px' }}>
        <div className="stat-box">
          <div className="stat-box-value">{stats?.total_listens || 0}</div>
          <div className="stat-box-label">Total plays</div>
          <div className="stat-box-sub">Logged in your history</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-value">{stats?.unique_songs || 0}</div>
          <div className="stat-box-label">Distinct tracks</div>
          <div className="stat-box-sub">Different songs heard</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-value">{formatMinutes(stats?.total_listen_seconds)}</div>
          <div className="stat-box-label">Time listened</div>
          <div className="stat-box-sub">Total session time</div>
        </div>

        <div className="stat-box">
          <div className="stat-box-value" style={{ color: 'var(--secondary)' }}>
            {stats?.avg_given_rating ? Number(stats.avg_given_rating).toFixed(1) : '0.0'} ★
          </div>
          <div className="stat-box-label">Average rating</div>
          <div className="stat-box-sub">Your ratings weight</div>
        </div>
      </div>

      {/* ── Recommendations Section ──────────────────────────────── */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--text)' }}>
              Recommended for you
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {recMeta.isPersonalized ? 'Based on your co-listening and genre patterns' : 'Popular catalog favorites'}
            </p>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {recMeta.strategy === 'collaborative_filtering' ? 'Collaborative Filtering' : recMeta.strategy === 'content_based' ? 'Genre Affinity' : 'Catalog Baseline'}
          </span>
        </div>

        {recommendations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '36px' }}>
            <p style={{ color: 'var(--text-muted)' }}>
              No recommendations available yet. Start playing tracks in the library to build your preference matrix!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {recommendations.map((song) => (
              <SongItem
                key={song.id}
                song={song}
                playlists={playlists}
                onPlaySuccess={loadDashboardData}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Recent Activity & Playlists Row ───────────────────────── */}
      <div className="grid-cols-2">
        {/* Recently Played */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text)' }}>
              Recently played
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest sessions</span>
          </div>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No tracks played yet. Click play on any song in the catalog to record your sessions.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {history.map((item, idx) => (
                <div
                  key={`${item.song_id}-${idx}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: 'var(--radius)',
                    fontSize: '0.85rem',
                  }}
                >
                  <div style={{ minWidth: 0, overflow: 'hidden' }}>
                    <Link
                      to={`/songs/${item.song_id}`}
                      style={{ fontWeight: '600', color: 'var(--text)', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {item.title}
                    </Link>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{item.artist_name}</span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0, marginLeft: '8px' }}>
                    {item.played_at ? new Date(item.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Saved Playlists */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: 'var(--text)' }}>
              Your playlists
            </h3>
            <Link to="/playlists" className="btn btn-secondary btn-sm">
              Manage →
            </Link>
          </div>

          {playlists.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              You haven't created any playlists yet. Click Manage to create your first collection.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playlists.map((pl) => (
                <Link
                  key={pl.id}
                  to={`/playlists?id=${pl.id}`}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg)',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text)',
                    textDecoration: 'none',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pl.song_count || 0} tracks • {pl.is_public ? 'Public' : 'Private'}
                    </div>
                  </div>
                  <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>View →</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
