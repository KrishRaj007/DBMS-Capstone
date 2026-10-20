import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner, CopyButton } from '../components/StandardWidgets';

export default function SongDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { success, error } = useToast();
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const fetchSong = async () => {
      try {
        setLoading(true);
        const [songRes, ratingRes, playlistRes] = await Promise.all([
          API.get(`/songs/${id}`),
          API.get(`/ratings/song/${id}`).catch(() => ({ data: { user_rating: null } })),
          API.get('/playlists').catch(() => ({ data: [] })),
        ]);
        setSong(songRes.data);
        if (ratingRes.data.user_rating) {
          setUserRating(ratingRes.data.user_rating);
        }
        setPlaylists(playlistRes.data || []);
      } catch (err) {
        console.error('Failed to load song detail:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSong();
  }, [id]);

  const handlePlay = async () => {
    if (!user) return;
    try {
      setIsPlaying(true);
      await API.post('/listen', {
        song_id: song.id,
        duration_listened: song.duration_seconds || 200,
      });
      success(`Logged play for "${song.title}"! Preference triggers updated.`);
      setSong((prev) => ({ ...prev, play_count: (prev.play_count || 0) + 1 }));
    } catch {
      error('Failed to log listening session');
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  const handleRate = async (star) => {
    if (!user) return;
    try {
      setUserRating(star);
      await API.post('/ratings', { song_id: song.id, rating: star });
      success(`Saved rating of ${star} stars for "${song.title}"`);
    } catch {
      error('Failed to save rating');
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) return;
    try {
      await API.post(`/playlists/${selectedPlaylistId}/songs`, { song_id: song.id });
      success(`Added to playlist!`);
      setSelectedPlaylistId('');
    } catch (err) {
      if (err.response?.status === 409) {
        error('Song is already in this playlist');
      } else {
        error('Failed to add to playlist');
      }
    }
  };

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Fetching relational song record & artist metadata..." />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="page-container" id="main-content">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <h2>Song Not Found</h2>
          <p style={{ color: 'var(--text-muted)', margin: '12px 0 24px' }}>
            The song you are looking for does not exist in the database.
          </p>
          <Link to="/library" className="btn btn-primary">
            Return to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      <div style={{ marginBottom: '24px' }}>
        <Link to="/library" style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          ← Back to Song Library
        </Link>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div
            style={{
              width: '160px',
              height: '160px',
              backgroundColor: 'var(--bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              color: 'var(--primary)',
              flexShrink: 0,
            }}
          >
            🎵
          </div>

          <div style={{ flex: 1, minWidth: '260px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="song-meta-pill">{song.genre_name}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Released: {song.release_date ? new Date(song.release_date).getFullYear() : '2024'}
              </span>
              <CopyButton text={window.location.href} label="Share Song" />
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '8px' }}>
              {song.title}
            </h1>

            <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              by <strong style={{ color: 'var(--text)' }}>{song.artist_name}</strong> {song.album && `• Album: ${song.album}`}
            </p>

            {/* Metrics row */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', margin: '20px 0', padding: '16px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--primary)' }}>
                  {song.play_count || 0}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Plays Logged</div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--secondary)' }}>
                  {Number(song.avg_rating || 0).toFixed(1)} ★
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Average Rating ({song.rating_count || 0} votes)
                </div>
              </div>

              <div>
                <div style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text)' }}>
                  {Math.floor((song.duration_seconds || 0) / 60)}:
                  {((song.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Duration</div>
              </div>
            </div>

            {/* Actions: Play, Rate, Playlist */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handlePlay}
                className="btn btn-primary"
                disabled={isPlaying}
                id="song-play-btn"
              >
                {isPlaying ? 'Logging Listen...' : '▶ Play Song'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Your Rating:</span>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${star <= userRating ? 'active' : ''}`}
                      onClick={() => handleRate(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>

              {playlists.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <select
                    className="form-input"
                    style={{ padding: '8px', minWidth: '160px' }}
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  >
                    <option value="">Add to playlist...</option>
                    {playlists.map((pl) => (
                      <option key={pl.id} value={pl.id}>{pl.name}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleAddToPlaylist}
                    className="btn btn-secondary btn-sm"
                    disabled={!selectedPlaylistId}
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Artist Information & DBMS Insights */}
      <div className="grid-cols-2">
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px' }}>
            About the Artist: {song.artist_name}
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.6' }}>
            {song.artist_bio || 'No biographical information available for this artist.'}
          </p>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', color: 'var(--secondary)' }}>
            DBMS Relational Query Insights
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.6', marginBottom: '12px' }}>
            This song entity is bound to foreign keys <code style={{ color: 'var(--primary)' }}>artist_id = {song.artist_id}</code> and <code style={{ color: 'var(--primary)' }}>genre_id = {song.genre_id}</code>.
            Aggregated metrics are computed across <code style={{ color: 'var(--primary)' }}>listening_history</code> and <code style={{ color: 'var(--primary)' }}>ratings</code> tables using composite indices.
          </p>
          <div style={{ fontSize: '0.75rem', backgroundColor: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <code>SELECT s.*, AVG(r.rating) FROM songs s LEFT JOIN ratings r ON s.id = r.song_id WHERE s.id = {song.id};</code>
          </div>
        </div>
      </div>
    </div>
  );
}
