import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { API } from '../context/AuthContext';
import { LoadingSpinner } from '../components/StandardWidgets';

export default function Analytics() {
  const [activeTab, setActiveTab] = useState('personal');
  const [personal, setPersonal] = useState(null);
  const [global, setGlobal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const [personalRes, globalRes] = await Promise.all([
        API.get('/analytics/personal').catch(() => ({ data: null })),
        API.get('/analytics/global'),
      ]);
      setPersonal(personalRes.data);
      setGlobal(globalRes.data);
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Unable to aggregate listening telemetry from the database. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Aggregating listening telemetry and computing SQL group-by metrics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container" id="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '600px', margin: '40px auto' }}>
          <div style={{ color: 'var(--danger)', fontSize: '2rem', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '8px' }}>Analytics Query Error</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>{error}</p>
          <button onClick={fetchAnalytics} className="btn btn-primary btn-sm">
            ↻ Retry Telemetry Query
          </button>
        </div>
      </div>
    );
  }

  // Format hourly distribution to 24-hour labels
  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const match = personal?.hourly?.find((h) => h.hour === i);
    return {
      hour: `${i}:00`,
      listens: match ? match.listens : 0,
    };
  });

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dailyData = dayNames.map((name, idx) => {
    // MySQL DAYOFWEEK: 1=Sun, 2=Mon... 7=Sat
    const match = personal?.daily?.find((d) => d.day === idx + 1);
    return {
      day: name,
      listens: match ? match.listens : 0,
    };
  });

  // Custom Recharts Tooltip styled with design system
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#24345A',
          border: '1px solid #2F426F',
          borderRadius: '8px',
          padding: '8px 12px',
          color: '#FFFFFF',
          fontSize: '0.8rem',
        }}>
          <p style={{ fontWeight: '600', marginBottom: '2px' }}>{label}</p>
          <p style={{ color: '#E4A0A0' }}>{payload[0].name || 'Plays'}: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Listening Analytics & Telemetry</h1>
          <p className="page-subtitle">
            Explore listening patterns, time-of-day frequency heatmaps, and platform-wide database view analytics.
          </p>
        </div>
      </div>

      {/* Analytics Tabs */}
      <div className="tab-list">
        <button
          className={`tab-btn ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Listening Trends
        </button>
        <button
          className={`tab-btn ${activeTab === 'global' ? 'active' : ''}`}
          onClick={() => setActiveTab('global')}
        >
          Platform Global Trends
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div>
          {/* KPI Metrics */}
          <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
            <div className="stat-box">
              <div className="stat-box-value">{personal?.overview?.total_listens || 0}</div>
              <div className="stat-box-label">All-time Plays</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{personal?.overview?.unique_songs || 0}</div>
              <div className="stat-box-label">Distinct Tracks</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">
                {Math.floor((personal?.overview?.total_listen_seconds || 0) / 60)}m
              </div>
              <div className="stat-box-label">Listening Minutes</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">
                {personal?.overview?.avg_given_rating ? Number(personal.overview.avg_given_rating).toFixed(1) : '0.0'} ★
              </div>
              <div className="stat-box-label">Rating Affinity</div>
            </div>
          </div>

          {/* Charts Row: Hourly & Daily */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                Time of Day Distribution (Hourly)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2F426F" vertical={false} />
                    <XAxis dataKey="hour" stroke="#B8C2D9" fontSize={11} interval={3} />
                    <YAxis stroke="#B8C2D9" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="listens" fill="#E4A0A0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                Day of Week Listening Frequency
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2F426F" vertical={false} />
                    <XAxis dataKey="day" stroke="#B8C2D9" fontSize={11} />
                    <YAxis stroke="#B8C2D9" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="listens" fill="#EED9A0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Listening Trend Timeline */}
          {personal?.trend?.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                Daily Listening Activity Timeline
              </h3>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={personal.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2F426F" vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke="#B8C2D9"
                      fontSize={11}
                      tickFormatter={(val) => val ? val.slice(5) : ''}
                    />
                    <YAxis stroke="#B8C2D9" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="listens" stroke="#E4A0A0" strokeWidth={2} dot={{ fill: '#E4A0A0', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Top Genres, Top Artists & Top Songs Tables */}
          <div className="grid-cols-3">
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                Top Preferred Genres
              </h3>
              {!personal?.topGenres || personal.topGenres.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No genre activity logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {personal.topGenres.map((g, i) => (
                    <div
                      key={`genre-${g.name}-${i}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {i + 1}. {g.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                        {g.listens} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                Top Listened Artists
              </h3>
              {!personal?.topArtists || personal.topArtists.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No artist activity logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {personal.topArtists.map((a, i) => (
                    <div
                      key={`artist-${a.name}-${i}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                        {i + 1}. {a.name}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {a.listens} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                Your Most Repeated Songs
              </h3>
              {!personal?.topSongs || personal.topSongs.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No play activity logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {personal.topSongs.map((s, i) => (
                    <div
                      key={`song-${s.id}-${i}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {i + 1}. {s.title}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {s.artist_name}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', flexShrink: 0 }}>
                        {s.listens} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Global Platform Analytics Tab */
        <div>
          {/* Totals */}
          <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_users || 0}</div>
              <div className="stat-box-label">Registered Listeners</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_songs || 0}</div>
              <div className="stat-box-label">Catalog Songs</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_listens || 0}</div>
              <div className="stat-box-label">Total Platform Listens</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_ratings || 0}</div>
              <div className="stat-box-label">Ratings Recorded</div>
            </div>
          </div>

          {/* Global Most Played & Trending Genres */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                🔥 Most Played Songs (from <code style={{ color: 'var(--primary)' }}>top_songs_view</code>)
              </h3>
              {!global?.mostPlayed || global.mostPlayed.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No song play history recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {global.mostPlayed.map((song, i) => (
                    <div
                      key={song.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {i + 1}. {song.title}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {song.artist_name} • {song.genre_name}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {song.play_count} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                📊 Genre Popularity (from <code style={{ color: 'var(--secondary)' }}>genre_popularity_view</code>)
              </h3>
              {!global?.genrePopularity || global.genrePopularity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No genre popularity data recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {global.genrePopularity.map((g, i) => (
                    <div
                      key={g.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {i + 1}. {g.name}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {g.song_count} songs • {Number(g.avg_rating || 0).toFixed(1)} ★ avg
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                        {g.total_plays || 0} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Global Top Rated Songs & Active Listeners */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                ⭐ Highest Rated Songs (from <code style={{ color: 'var(--secondary)' }}>ratings</code>)
              </h3>
              {!global?.topRated || global.topRated.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No rated songs found in catalog.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {global.topRated.map((song, i) => (
                    <div
                      key={`rated-${song.id}-${i}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          {i + 1}. {song.title}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {song.artist_name} • {song.genre_name}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '12px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--secondary)', fontWeight: '600' }}>
                          {Number(song.avg_rating || 0).toFixed(1)} ★
                        </span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                          {song.rating_count} {song.rating_count === 1 ? 'rating' : 'ratings'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '14px' }}>
                🏆 Most Active Listeners (by log frequency)
              </h3>
              {!global?.activeUsers || global.activeUsers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active listener history found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {global.activeUsers.map((u, i) => (
                    <div
                      key={`user-${u.id}-${i}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg)',
                        borderRadius: 'var(--radius)',
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600' }}>
                          #{i + 1} {u.username}
                        </span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Registered Account #{u.id}
                        </div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>
                        {u.total_listens} plays
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
