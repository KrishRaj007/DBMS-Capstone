import { useState, useEffect } from 'react';
import { useAuth, API } from '../context/AuthContext';
import { LoadingSpinner, LastUpdatedDate } from '../components/StandardWidgets';

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const [statsRes, ratingsRes] = await Promise.all([
          API.get('/analytics/personal'),
          API.get('/ratings/user'),
        ]);
        setStats(statsRes.data.overview || {});
        setRatings(ratingsRes.data || []);
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Querying user profile and rating history..." />
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">User Profile & Account</h1>
          <p className="page-subtitle">
            Relational DBMS account details, personalized preferences, and rated song history.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handlePrint} className="btn btn-secondary btn-sm" title="Print this profile record">
            🖨 Print Report
          </button>
          <button onClick={logout} className="btn btn-danger btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* User Information Card */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--primary)',
              color: '#1B2A4A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.8rem',
              fontWeight: '800',
            }}
          >
            {user?.username ? user.username[0].toUpperCase() : 'U'}
          </div>

          <div style={{ flex: 1, minWidth: '200px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{user?.username}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{user?.email}</p>
            <div style={{ marginTop: '6px' }}>
              <span className="song-meta-pill" style={{ fontSize: '0.75rem' }}>
                Account ID: #{user?.id} • Standard Listener
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Cumulative Stats */}
      <div className="grid-cols-4" style={{ marginBottom: '32px' }}>
        <div className="stat-box">
          <div className="stat-box-value">{stats?.total_listens || 0}</div>
          <div className="stat-box-label">Total Songs Listened</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{stats?.unique_songs || 0}</div>
          <div className="stat-box-label">Distinct Songs</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">{ratings.length}</div>
          <div className="stat-box-label">Songs Rated</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value">
            {stats?.avg_given_rating ? Number(stats.avg_given_rating).toFixed(1) : '0.0'} ★
          </div>
          <div className="stat-box-label">Average Score</div>
        </div>
      </div>

      {/* Your Rated Songs */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px' }}>
          Your Rated Songs ({ratings.length})
        </h3>

        {ratings.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            You haven't rated any songs yet. Go to the Library to rate your favorite tracks!
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {ratings.map((item) => (
              <div
                key={item.song_id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border)',
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{item.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {item.artist_name} • {item.genre_name}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '0.9rem' }}>
                    {'★'.repeat(item.rating)}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '24px' }}>
        <LastUpdatedDate />
      </div>
    </div>
  );
}
