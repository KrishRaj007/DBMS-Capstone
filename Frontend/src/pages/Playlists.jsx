import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API, useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner, ConfirmModal } from '../components/StandardWidgets';
import SongItem from '../components/SongItem';

export default function Playlists() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIsPublic, setEditIsPublic] = useState(true);

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

  const handleOpenEditModal = () => {
    if (!selectedPlaylist) return;
    setEditName(selectedPlaylist.name);
    setEditDesc(selectedPlaylist.description || '');
    setEditIsPublic(Boolean(selectedPlaylist.is_public));
    setShowEditModal(true);
  };

  const handleUpdatePlaylist = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !selectedPlaylist) return;
    try {
      await API.put(`/playlists/${selectedPlaylist.id}`, {
        name: editName.trim(),
        description: editDesc.trim(),
        is_public: editIsPublic,
      });
      success('Playlist updated successfully!');
      setShowEditModal(false);
      fetchPlaylists();
      loadPlaylistDetail(selectedPlaylist.id);
    } catch {
      error('Failed to update playlist');
    }
  };

  const handleRemoveSong = async (songId) => {
    if (!selectedPlaylist) return;
    try {
      await API.delete(`/playlists/${selectedPlaylist.id}/songs/${songId}`);
      success('Track removed from playlist');
      loadPlaylistDetail(selectedPlaylist.id);
      fetchPlaylists();
    } catch {
      error('Failed to remove track');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!deleteModal.targetId) return;
    try {
      await API.delete(`/playlists/${deleteModal.targetId}`);
      success(`Playlist deleted`);
      setDeleteModal({ open: false, type: null, targetId: null, targetName: '' });
      setSelectedPlaylist(null);
      fetchPlaylists();
    } catch {
      error('Failed to delete playlist');
    }
  };

  if (loading) {
    return (
      <div className="page-container" id="main-content">
        <LoadingSpinner message="Querying playlists and relational playlist_songs..." />
      </div>
    );
  }

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Playlists</h1>
          <p className="page-subtitle">
            Curate custom song collections with relational integrity and cascade-protected playlists.
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-sm">
          + New Playlist
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px' }}>
        {/* Playlists Left Panel */}
        <div className="card" style={{ padding: '16px', height: 'fit-content' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
            Your Collections ({playlists.length})
          </div>

          {playlists.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No playlists found.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {playlists.map((pl) => {
                const isSelected = selectedPlaylist?.id === pl.id;
                return (
                  <button
                    key={pl.id}
                    onClick={() => handleSelectPlaylist(pl.id)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      backgroundColor: isSelected ? 'var(--surface-hover)' : 'var(--bg)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)',
                      color: 'var(--text)',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{pl.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {pl.song_count || 0} tracks
                      </div>
                    </div>
                    {isSelected && <span style={{ color: 'var(--primary)' }}>●</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Playlist Right Detail Panel */}
        <div>
          {loadingDetail ? (
            <LoadingSpinner message="Loading playlist tracks..." />
          ) : selectedPlaylist ? (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text)' }}>
                      {selectedPlaylist.name}
                    </h2>
                    <span className="song-meta-pill">
                      {selectedPlaylist.is_public ? 'Public' : 'Private'}
                    </span>
                  </div>
                  {selectedPlaylist.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                      {selectedPlaylist.description}
                    </p>
                  )}
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    Created by {selectedPlaylist.username || user?.username} • {selectedPlaylist.songs?.length || 0} songs
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleOpenEditModal} className="btn btn-secondary btn-sm">
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, type: 'playlist', targetId: selectedPlaylist.id, targetName: selectedPlaylist.name })}
                    className="btn btn-danger btn-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* Tracks List */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                {!selectedPlaylist.songs || selectedPlaylist.songs.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '16px 0' }}>
                    No tracks in this playlist yet. Add tracks directly from the Library!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedPlaylist.songs.map((song) => (
                      <div key={song.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <SongItem song={song} playlists={playlists} />
                        </div>
                        <button
                          onClick={() => handleRemoveSong(song.id)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', padding: '8px' }}
                          title="Remove from playlist"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: 'var(--text-muted)' }}>Select a playlist to view its tracks.</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Playlist</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePlaylist}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Playlist Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Late Night Coding"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Short description..."
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="create-public-check"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                  />
                  <label htmlFor="create-public-check" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                    Make Playlist Public
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal-backdrop" onClick={() => setShowEditModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Playlist</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdatePlaylist}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Playlist Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Description</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    id="edit-public-check"
                    checked={editIsPublic}
                    onChange={(e) => setEditIsPublic(e.target.checked)}
                  />
                  <label htmlFor="edit-public-check" style={{ fontSize: '0.85rem', color: 'var(--text)' }}>
                    Make Playlist Public
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 17. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Playlist"
        message={`Are you sure you want to permanently delete "${deleteModal.targetName}"? This action cannot be undone.`}
        confirmText="Delete Playlist"
        onConfirm={handleDeletePlaylist}
        onCancel={() => setDeleteModal({ open: false, type: null, targetId: null, targetName: '' })}
      />
    </div>
  );
}
