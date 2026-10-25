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
      <div className="page-header">
        <div>
          <h1 className="page-title">Welcome back, {user?.username}</h1>
          <p className="page-subtitle">
            {recMeta.isPersonalized
              ? 'Here is your live listening activity and personalized algorithmic recommendations.'
              : 'Here is your live listening activity and platform discovery recommendations.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Link to="/library" className="btn btn-secondary btn-sm">
            Browse All Songs
          </Link>
          <Link to="/analytics" className="btn btn-primary btn-sm">
            View Full Analytics
          </Link>
        </div>
      </div>

      {/* KPI Stats Row (from user_analytics_view) */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="stat-box">
          <div className="stat-box-value">{stats?.total_listens || 0}</div>
          <div className="stat-box-label">Total Songs Played</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{stats?.unique_songs || 0}</div>
          <div className="stat-box-label">Unique Songs Discovered</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{formatMinutes(stats?.total_listen_seconds)}</div>
          <div className="stat-box-label">Listening Time Logged</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">
            {stats?.avg_given_rating ? Number(stats.avg_given_rating).toFixed(1) : '0.0'} ★
          </div>
          <div className="stat-box-label">Average Rating Given</div>
        </div>
      </div>

      {/* Recommended For You Section */}
      <section style={{ marginBottom: '36px' }}>
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                {recMeta.isPersonalized ? '✨ Recommended For You' : '🎧 Catalog Recommendations'}
              </h2>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 10px',
                  borderRadius: '8px',
                  backgroundColor: recMeta.isPersonalized ? 'rgba(228, 160, 160, 0.15)' : 'rgba(238, 217, 160, 0.15)',
                  color: recMeta.isPersonalized ? 'var(--primary)' : 'var(--secondary)',
                  fontWeight: '600',
                  border: `1px solid ${recMeta.isPersonalized ? 'var(--primary)' : 'var(--secondary)'}`,
                }}
              >
                {recMeta.strategy === 'collaborative_filtering' && 'Collaborative Filtering (Peer Tastes)'}
                {recMeta.strategy === 'content_based' && 'Content-Based (Artist & Genre Affinity)'}
                {recMeta.strategy === 'popularity_baseline' && (recMeta.userState === 'cold_start' ? 'Platform Baseline (Cold Start)' : 'Catalog Popularity Baseline')}
              </span>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {recMeta.explanation}
            </p>
          </div>
          <button
            onClick={loadDashboardData}
            className="btn btn-secondary btn-sm"
            title="Recalculate recommendations"
          >
            ↻ Refresh Engine
          </button>
        </div>

        {/* Cold Start Notice Banner — transparent and truthful */}
        {!recMeta.isPersonalized && (
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              gap: '12px',
            }}
          >
            <span>
              ℹ️ <strong>New Listener Baseline:</strong> Recommendations are not marked as personalized because you do not have enough listening or rating history yet. These are platform-wide trending tracks across diverse genres. Rate or play tracks in the library to unlock personalized recommendations!
            </span>
            <Link to="/library" className="btn btn-secondary btn-sm" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              Explore Library →
            </Link>
          </div>
        )}

        {recommendations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
              No recommendations generated yet. Start listening and rating songs in the library to train your preference vectors!
            </p>
            <Link to="/library" className="btn btn-primary btn-sm">
              Explore Song Library
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
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

      {/* Grid: Recent History & Quick Playlists */}
      <div className="grid-cols-2">
        {/* Recent Listening History */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Recent Listening Log</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>audit trail</span>
          </div>

          {history.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No recent listens recorded yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '8px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {item.artist_name} • {item.genre_name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <div>{new Date(item.listened_at).toLocaleDateString()}</div>
                    <div>{Math.round(item.duration_listened / 60)}m listened</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Your Playlists */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>Your Playlists</h3>
            <Link to="/playlists" className="btn btn-secondary btn-sm">
              Manage (+ New)
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                You have not created any playlists yet.
              </p>
              <Link to="/playlists" className="btn btn-primary btn-sm">
                Create Playlist
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playlists.slice(0, 4).map((pl) => (
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
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{pl.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {pl.song_count || 0} tracks • {pl.is_public ? 'Public' : 'Private'}
                    </div>
                  </div>
                  <span style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>→</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
