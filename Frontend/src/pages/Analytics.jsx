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
    const match = personal?.daily?.find((d) => d.day === idx + 1);
    return {
      day: name,
      listens: match ? match.listens : 0,
    };
  });

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '8px 12px',
          color: 'var(--text)',
          fontSize: '0.8rem',
        }}>
          <p style={{ fontWeight: '600', marginBottom: '2px' }}>{label}</p>
          <p style={{ color: 'var(--primary)' }}>{payload[0].name || 'Plays'}: {payload[0].value}</p>
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

      {/* Analytics Navigation Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          className={`btn ${activeTab === 'personal' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('personal')}
        >
          Personal Listening Trends
        </button>
        <button
          className={`btn ${activeTab === 'global' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
          onClick={() => setActiveTab('global')}
        >
          Platform Global Trends
        </button>
      </div>

      {activeTab === 'personal' ? (
        <div>
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <span>
              🔒 <strong>Personal Telemetry Source:</strong> Session history (<code>source_namespace: local</code>). Every listen reflects real playback duration and timestamps.
            </span>
            <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>
              Individual Session Events
            </span>
          </div>

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
              <div className="stat-box-label">Listening Minutes Logged</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value" style={{ color: 'var(--secondary)' }}>
                {personal?.overview?.avg_given_rating ? Number(personal.overview.avg_given_rating).toFixed(1) : '0.0'} ★
              </div>
              <div className="stat-box-label">Rating Affinity</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                Time of Day Distribution (Hourly)
              </h3>
              <div style={{ height: '240px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E416E" vertical={false} />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E416E" vertical={false} />
                    <XAxis dataKey="day" stroke="#B8C2D9" fontSize={11} />
                    <YAxis stroke="#B8C2D9" fontSize={11} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="listens" fill="#EED9A0" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {personal?.trend?.length > 0 && (
            <div className="card" style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px' }}>
                Daily Listening Activity Timeline
              </h3>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={personal.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2E416E" vertical={false} />
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

          {/* Breakdown Tables */}
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
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>
                          {g.listens} plays
                        </span>
                        {g.avg_rating > 0 && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            {Number(g.avg_rating).toFixed(1)} ★
                          </div>
                        )}
                      </div>
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
                      <span style={{ fontSize: '0.8rem', color: 'var(--secondary)', flexShrink: 0, marginLeft: '8px' }}>
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
        /* Global Platform Trends */
        <div>
          <div
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.825rem',
              color: 'var(--text-muted)',
              lineHeight: '1.5',
            }}
          >
            <div style={{ fontWeight: '600', color: 'var(--text)', marginBottom: '4px' }}>
              📊 Multi-Tier Data Source & Aggregation Transparency
            </div>
            <div>
              Platform analytics partition data origins into:
              <strong style={{ color: 'var(--primary)' }}> Live App Activity</strong> (<code>source_namespace = 'local'</code>),
              <strong style={{ color: 'var(--secondary)' }}> Imported Dataset</strong> (<code>source_namespace = 'lastfm'</code>), and
              <strong style={{ color: 'var(--text)' }}> Catalog Totals</strong> (pre-aggregated frequency counts).
            </div>
          </div>

          <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.registered_app_users || 0}</div>
              <div className="stat-box-label">Active App Users (local)</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.imported_listener_profiles || 0}</div>
              <div className="stat-box-label">Imported Profiles (lastfm)</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_songs || 0}</div>
              <div className="stat-box-label">Total Catalog Songs</div>
            </div>
            <div className="stat-box">
              <div className="stat-box-value">{global?.totals?.total_ratings || 0}</div>
              <div className="stat-box-label">App User Ratings (local)</div>
            </div>
          </div>

          <div className="grid-cols-2" style={{ marginBottom: '24px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                  🔥 Most Played Songs
                </h3>
                <span className="badge-provenance">top_songs_view</span>
              </div>
              {!global?.mostPlayed || global.mostPlayed.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No songs recorded.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {global.mostPlayed.slice(0, 8).map((song, i) => (
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700' }}>
                  📊 Genre Popularity
                </h3>
                <span className="badge-provenance">genre_popularity_view</span>
              </div>
              {!global?.genrePopularity || global.genrePopularity.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No genre data recorded.</p>
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
                          {g.song_count} songs
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
        </div>
      )}
    </div>
  );
}
