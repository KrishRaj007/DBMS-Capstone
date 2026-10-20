import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner, ConfirmModal, CopyButton } from '../components/StandardWidgets';

export default function Playlists() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Create playlist modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  // Delete modal state (17. Confirmation Modal)
  const [deleteModal, setDeleteModal] = useState({ open: false, type: null, targetId: null, targetName: '' });

  const activeId = searchParams.get('id');

  const fetchPlaylists = async () => {
    try {
      setLoading(true);
      const res = await API.get('/playlists');
      setPlaylists(res.data || []);

      if (activeId) {
        loadPlaylistDetail(activeId);
      } else if (res.data.length > 0) {
        loadPlaylistDetail(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load playlists:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlaylistDetail = async (id) => {
    try {
      setLoadingDetail(true);
      const res = await API.get(`/playlists/${id}`);
      setSelectedPlaylist(res.data);
    } catch (err) {
      console.error('Failed to load playlist tracks:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [activeId]);

  const handleSelectPlaylist = (id) => {
    setSearchParams({ id });
    loadPlaylistDetail(id);
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const res = await API.post('/playlists', {
        name: newName.trim(),
        description: newDesc.trim(),
        is_public: isPublic,
      });
      success(`Playlist "${newName}" created!`);
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
      setIsPublic(true);
      fetchPlaylists();
      handleSelectPlaylist(res.data.id);
    } catch {
      error('Failed to create playlist');
    }
  };

  const confirmDelete = async () => {
    if (deleteModal.type === 'playlist') {
      try {
        await API.delete(`/playlists/${deleteModal.targetId}`);
        success('Playlist deleted');
        setDeleteModal({ open: false, type: null, targetId: null, targetName: '' });
        setSelectedPlaylist(null);
        setSearchParams({});
        fetchPlaylists();
      } catch {
        error('Failed to delete playlist');
      }
    } else if (deleteModal.type === 'song') {
      try {
        await API.delete(`/playlists/${selectedPlaylist.id}/songs/${deleteModal.targetId}`);
        success('Song removed from playlist');
        setDeleteModal({ open: false, type: null, targetId: null, targetName: '' });
        loadPlaylistDetail(selectedPlaylist.id);
      } catch {
        error('Failed to remove song');
      }
    }
  };

  const handlePlaySong = async (song) => {
    try {
      await API.post('/listen', { song_id: song.id, duration_listened: song.duration_seconds || 180 });
      success(`Playing "${song.title}" from playlist!`);
    } catch {
      error('Failed to log play');
    }
  };

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Loading relational playlists and M:N bridge tables..." />
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Playlists Management</h1>
          <p className="page-subtitle">
            Organize custom playlists using relational many-to-many bridge tables (<code style={{ color: 'var(--primary)' }}>playlist_songs</code>) with strict sequence ordering.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary btn-sm"
          id="create-playlist-btn"
        >
          + New Playlist
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
        {/* Left column: Playlists list */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px' }}>
            Your Collections ({playlists.length})
          </h3>

          {playlists.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                No playlists yet. Create your first playlist to organize songs!
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
                Create One Now
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {playlists.map((pl) => {
                const isSelected = selectedPlaylist?.id === pl.id;
                return (
                  <div
                    key={pl.id}
                    onClick={() => handleSelectPlaylist(pl.id)}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: isSelected ? 'var(--surface-hover)' : 'var(--surface)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: '600', fontSize: '0.95rem' }}>{pl.name}</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {pl.song_count || 0} tracks
                      </span>
                    </div>
                    {pl.description && (
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {pl.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column: Selected playlist tracks */}
        <div>
          {loadingDetail ? (
            <LoadingSpinner message="Fetching ordered playlist songs..." />
          ) : selectedPlaylist ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="song-meta-pill">
                      {selectedPlaylist.is_public ? 'Public Playlist' : 'Private'}
                    </span>
                    <CopyButton text={window.location.href} label="Share" />
                  </div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: '800' }}>{selectedPlaylist.name}</h2>
                  {selectedPlaylist.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '4px' }}>
                      {selectedPlaylist.description}
                    </p>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Link to="/library" className="btn btn-secondary btn-sm">
                    + Add Songs
                  </Link>
                  <button
                    onClick={() => setDeleteModal({
                      open: true,
                      type: 'playlist',
                      targetId: selectedPlaylist.id,
                      targetName: selectedPlaylist.name,
                    })}
                    className="btn btn-danger btn-sm"
                    id="delete-playlist-btn"
                  >
                    Delete Playlist
                  </button>
                </div>
              </div>

              {/* Tracks Table */}
              {selectedPlaylist.songs?.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                    This playlist is currently empty.
                  </p>
                  <Link to="/library" className="btn btn-primary btn-sm">
                    Browse Library to Add Songs
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedPlaylist.songs.map((song, idx) => (
                    <div
                      key={song.id}
                      className="song-row"
                      style={{ padding: '8px 12px' }}
                    >
                      <div className="song-left">
                        <span style={{ width: '20px', color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>
                          {idx + 1}
                        </span>
                        <button
                          onClick={() => handlePlaySong(song)}
                          className="btn-icon"
                          style={{ width: '32px', height: '32px' }}
                          title={`Play ${song.title}`}
                        >
                          ▶
                        </button>
                        <div className="song-details">
                          <Link to={`/songs/${song.id}`} className="song-title-text" style={{ fontSize: '0.9rem' }}>
                            {song.title}
                          </Link>
                          <div className="song-subtitle-text">
                            {song.artist_name} • {song.genre_name}
                          </div>
                        </div>
                      </div>

                      <div className="song-right">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {Math.floor((song.duration_seconds || 0) / 60)}:
                          {((song.duration_seconds || 0) % 60).toString().padStart(2, '0')}
                        </span>
                        <button
                          onClick={() => setDeleteModal({
                            open: true,
                            type: 'song',
                            targetId: song.id,
                            targetName: song.title,
                          })}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', borderColor: 'var(--border)' }}
                          title="Remove from playlist"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a playlist from the list to view tracks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-box">
            <h3 className="modal-title">Create New Playlist</h3>
            <form onSubmit={handleCreatePlaylist}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-playlist-name">Playlist Name *</label>
                <input
                  id="new-playlist-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Late Night Focus"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="new-playlist-desc">Description</label>
                <textarea
                  id="new-playlist-desc"
                  className="form-input"
                  rows="2"
                  placeholder="A curated mix for deep study and coding sessions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  id="new-playlist-public"
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
                <label htmlFor="new-playlist-public" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                  Public (visible in community feeds)
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" id="save-playlist-btn">
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal (Feature 17) */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title={deleteModal.type === 'playlist' ? 'Delete Playlist?' : 'Remove Song?'}
        message={
          deleteModal.type === 'playlist'
            ? `Are you sure you want to permanently delete the playlist "${deleteModal.targetName}"? This action cannot be undone.`
            : `Remove "${deleteModal.targetName}" from this playlist?`
        }
        confirmText={deleteModal.type === 'playlist' ? 'Delete Playlist' : 'Remove Song'}
        isDanger={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModal({ open: false, type: null, targetId: null, targetName: '' })}
      />
    </div>
  );
}
