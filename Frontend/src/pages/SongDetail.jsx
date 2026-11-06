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
      success(`Session logged for "${song.title}" in MySQL (metadata mode)`);
      setSong((prev) => ({ ...prev, play_count: (Number(prev.play_count) || 0) + 1 }));
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
        <LoadingSpinner message="Fetching relational track record from MySQL..." />
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
          <Link to="/library" className="btn btn-primary btn-sm">
            ← Back to Library
          </Link>
        </div>
      </div>
    );
  }

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="page-container" id="main-content">
      <div style={{ marginBottom: '20px' }}>
        <Link to="/library" style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          ← Back to Library
        </Link>
      </div>

      <div className="card" style={{ padding: '32px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="badge-provenance" style={{ marginBottom: '12px' }}>
              <span>Catalog Record ID #{song.id}</span>
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text)', marginBottom: '8px' }}>
              {song.title}
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: '600' }}>
              {song.artist_name || 'Unknown Artist'}
            </p>
            {song.album && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
                Album: {song.album}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button
              onClick={handlePlay}
              className={`btn btn-primary btn-lg ${isPlaying ? 'is-playing' : ''}`}
            >
              {isPlaying ? 'Logging Session...' : '▶ Log Play'}
            </button>
            <CopyButton text={window.location.href} label="Share" />
          </div>
        </div>

        {/* Track Metadata Grid */}
        <div className="grid-cols-4" style={{ marginTop: '28px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Genre</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px' }}>{song.genre_name || 'General'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Duration</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px' }}>{formatDuration(song.duration_seconds)}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Play Count</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px' }}>{(Number(song.play_count) || 0).toLocaleString()}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Average Rating</div>
            <div style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: '4px', color: 'var(--secondary)' }}>
              {song.avg_rating ? Number(song.avg_rating).toFixed(1) : '0.0'} ★
            </div>
          </div>
        </div>
      </div>

      {/* Rating & Playlist Interactive Deck */}
      <div className="grid-cols-2">
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
            Rate This Song
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Rating tracks modifies your database preference weights (`trg_after_rating`).
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`btn btn-secondary ${star <= userRating ? 'active' : ''}`}
                style={{
                  color: star <= userRating ? 'var(--secondary)' : 'var(--text-muted)',
                  borderColor: star <= userRating ? 'var(--secondary)' : 'var(--border)',
                  padding: '8px 14px',
                  fontWeight: '700',
                }}
                onClick={() => handleRate(star)}
              >
                ★ {star}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
            Add to Playlist
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
            Save this track to any of your custom relational playlists.
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <select
              className="form-input"
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="">Select a playlist...</option>
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>{pl.name}</option>
              ))}
            </select>
            <button
              onClick={handleAddToPlaylist}
              className="btn btn-primary btn-sm"
              disabled={!selectedPlaylistId}
            >
              Add Track
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
