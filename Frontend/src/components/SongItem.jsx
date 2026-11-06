import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, API } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CopyButton } from './StandardWidgets';

export default function SongItem({ song, onPlaySuccess, onRateSuccess, playlists = [] }) {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
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
      success(`Session logged for "${song.title}" — added to your Recently Played in MySQL (metadata mode)`);
      if (onPlaySuccess) onPlaySuccess(song);
    } catch {
      error('Failed to log listening session');
    } finally {
      setTimeout(() => setIsPlaying(false), 2400);
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
      success(`Rated "${song.title}" ${newRating} stars — user preferences updated!`);
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
  const activeStars = hoverRating || rating;

  return (
    <div className={`song-row ${isPlaying ? 'song-row-active' : ''}`} id={`song-item-${song.id}`}>
      <div className="song-left">
        {/* Play Button */}
        <button
          onClick={handlePlay}
          className={`btn-play-trigger ${isPlaying ? 'is-playing' : ''}`}
          title={`Play ${song.title}`}
          aria-label={`Play ${song.title}`}
          disabled={isPlaying}
        >
          {isPlaying ? (
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

        {/* Art Badge */}
        <div className="song-art-badge" aria-hidden="true">
          <span className="song-art-genre-label">
            {song.genre_name ? song.genre_name.slice(0, 3).toUpperCase() : 'REC'}
          </span>
        </div>

        {/* Song Info */}
        <div className="song-details">
          <Link to={`/songs/${song.id}`} className="song-title-text" title={song.title}>
            {song.title}
          </Link>
          <div className="song-subtitle-text">
            <span>{song.artist_name || 'Unknown Artist'}</span>
            {song.album && <span> • {song.album}</span>}
            {song.recommendation_reason && (
              <span style={{ color: 'var(--secondary)' }}> • {song.recommendation_reason}</span>
            )}
          </div>
        </div>
      </div>

      <div className="song-right">
        {song.genre_name && (
          <span className="song-meta-pill">{song.genre_name}</span>
        )}

        <span className="song-duration-label">
          {formatDuration(song.duration_seconds)}
        </span>

        {/* Star Rating */}
        <div className="star-rating" role="group" aria-label={`Rate ${song.title}`}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={`star-btn ${star <= activeStars ? 'active' : ''}`}
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`Rate ${star} out of 5 stars`}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill={star <= activeStars ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </button>
          ))}
        </div>

        {/* Add to Playlist */}
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
              <div className="playlist-dropdown-menu">
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
