import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CopyButton } from './StandardWidgets';

export default function SongItem({ song, onPlaySuccess, onRateSuccess, playlists = [] }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rating, setRating] = useState(0); // 0 = user has not rated yet (personal rating unknown)
  const [showPlaylistSelect, setShowPlaylistSelect] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');

  const formatDuration = (sec) => {
    if (!sec) return '0:00';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handlePlay = async () => {
    if (!user) return;
    try {
      setIsPlaying(true);
      await API.post('/listen', {
        song_id: song.id,
        duration_listened: song.duration_seconds || 180,
      });
      success(`Now playing "${song.title}" — listening session logged!`);
      if (onPlaySuccess) onPlaySuccess(song);
    } catch {
      error('Failed to log listening session');
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  };

  const handleRate = async (newRating) => {
    if (!user) return;
    try {
      setRating(newRating);
      await API.post('/ratings', {
        song_id: song.id,
        rating: newRating,
      });
      success(`Rated "${song.title}" ${newRating} stars`);
      if (onRateSuccess) onRateSuccess(song.id, newRating);
    } catch {
      error('Failed to save rating');
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId) return;
    try {
      await API.post(`/playlists/${selectedPlaylistId}/songs`, { song_id: song.id });
      success(`Added "${song.title}" to playlist!`);
      setShowPlaylistSelect(false);
      setSelectedPlaylistId('');
    } catch (err) {
      if (err.response?.status === 409) {
        error('Song is already in this playlist');
      } else {
        error('Failed to add song to playlist');
      }
    }
  };

  const shareUrl = `${window.location.origin}/songs/${song.id}`;

  return (
    <div className="song-row hover-card" id={`song-item-${song.id}`}>
      <div className="song-left">
        <button
          onClick={handlePlay}
          className="btn-icon"
          title={`Play ${song.title}`}
          aria-label={`Play ${song.title}`}
          disabled={isPlaying}
        >
          {isPlaying ? (
            <span style={{ fontSize: '10px', color: 'var(--primary)' }}>▶...</span>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          )}
        </button>

        <div className="song-badge">
          {song.genre_name ? song.genre_name.slice(0, 2).toUpperCase() : 'MP'}
        </div>

        <div className="song-details">
          <Link to={`/songs/${song.id}`} className="song-title-text" title={song.title}>
            {song.title}
          </Link>
          <div className="song-subtitle-text">
            <span>{song.artist_name || 'Unknown Artist'}</span>
            {song.album && <span> • {song.album}</span>}
          </div>
        </div>
      </div>

      <div className="song-right">
        {song.genre_name && (
          <span className="song-meta-pill">{song.genre_name}</span>
        )}

        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {formatDuration(song.duration_seconds)}
        </span>

        {/* 5-star interactive rating */}
        <div className="star-rating" title={`Rate ${song.title}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= rating ? 'active' : ''}`}
              onClick={() => handleRate(star)}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Add to Playlist button */}
        {playlists.length > 0 && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowPlaylistSelect(!showPlaylistSelect)}
              title="Add to Playlist"
            >
              + List
            </button>
            {showPlaylistSelect && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 20,
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '200px',
                  marginTop: '4px',
                }}
              >
                <select
                  className="form-input"
                  style={{ padding: '6px' }}
                  value={selectedPlaylistId}
                  onChange={(e) => setSelectedPlaylistId(e.target.value)}
                >
                  <option value="">Select playlist...</option>
                  {playlists.map((pl) => (
                    <option key={pl.id} value={pl.id}>{pl.name}</option>
                  ))}
                </select>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={handleAddToPlaylist}
                    disabled={!selectedPlaylistId}
                  >
                    Add
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowPlaylistSelect(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <CopyButton text={shareUrl} label="Share" />
      </div>
    </div>
  );
}
