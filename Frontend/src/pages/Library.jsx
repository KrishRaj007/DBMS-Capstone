import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { API } from '../context/AuthContext';
import { LoadingSpinner } from '../components/StandardWidgets';
import SongItem from '../components/SongItem';

export default function Library() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [songs, setSongs] = useState([]);
  const [genres, setGenres] = useState([]);
  const [artists, setArtists] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filters from query params
  const searchQuery = searchParams.get('search') || '';
  const selectedGenre = searchParams.get('genre') || '';
  const selectedArtist = searchParams.get('artist') || '';
  const selectedSort = searchParams.get('sort') || 'title';
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 15;

  // Artist Detail Modal state
  const [artistModal, setArtistModal] = useState({ open: false, data: null, loading: false });

  // Load genres and artists for filters
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [genresRes, artistsRes, playlistsRes] = await Promise.all([
          API.get('/songs/genres/list'),
          API.get('/songs/artists/list'),
          API.get('/playlists').catch(() => ({ data: [] })),
        ]);
        setGenres(genresRes.data || []);
        setArtists(artistsRes.data || []);
        setPlaylists(playlistsRes.data || []);
      } catch (err) {
        console.error('Failed to load filter metadata:', err);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch songs when filters or page changes
  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedGenre) params.append('genre', selectedGenre);
        if (selectedArtist) params.append('artist', selectedArtist);
        if (selectedSort) params.append('sort', selectedSort);
        params.append('page', currentPage);
        params.append('limit', limit);

        const res = await API.get(`/songs?${params.toString()}`);
        setSongs(res.data.songs || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error('Failed to fetch songs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, [searchQuery, selectedGenre, selectedArtist, selectedSort, currentPage]);

  const handleViewArtist = async (artistId) => {
    try {
      setArtistModal({ open: true, data: null, loading: true });
      const res = await API.get(`/songs/artists/${artistId}`);
      setArtistModal({ open: true, data: res.data, loading: false });
    } catch {
      setArtistModal({ open: false, data: null, loading: false });
    }
  };

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Song Library</h1>
          <p className="page-subtitle">
            Browse, search, and rate tracks across diverse genres. Every listen updates your relational preference matrix.
          </p>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Showing {songs.length} of {total.toLocaleString()} catalog tracks
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '2', minWidth: '220px' }}>
            <input
              type="text"
              className="form-input"
              placeholder="Search title, artist, or album..."
              value={searchQuery}
              onChange={(e) => updateParam('search', e.target.value)}
              id="library-search-input"
            />
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <select
              className="form-input"
              value={selectedGenre}
              onChange={(e) => updateParam('genre', e.target.value)}
              aria-label="Filter by genre"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.song_count || 0})
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '150px' }}>
            <select
              className="form-input"
              value={selectedArtist}
              onChange={(e) => updateParam('artist', e.target.value)}
              aria-label="Filter by artist"
            >
              <option value="">All Artists</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1', minWidth: '160px' }}>
            <select
              className="form-input"
              value={selectedSort}
              onChange={(e) => updateParam('sort', e.target.value)}
              aria-label="Sort tracks by"
            >
              <option value="title">Sort: Title (A-Z)</option>
              <option value="popular">Sort: Most Popular</option>
              <option value="rating">Sort: Highest Rated</option>
              <option value="recent">Sort: Recently Added</option>
              <option value="duration">Sort: Longest Duration</option>
            </select>
          </div>

          {selectedArtist && (
            <button
              onClick={() => handleViewArtist(selectedArtist)}
              className="btn btn-primary btn-sm"
              title="View Artist Profile & Bio"
            >
              👤 Artist Info
            </button>
          )}

          {(searchQuery || selectedGenre || selectedArtist || selectedSort !== 'title') && (
            <button
              onClick={() => setSearchParams({})}
              className="btn btn-secondary btn-sm"
              title="Reset all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Song List */}
      {loading ? (
        <LoadingSpinner message="Searching indexed catalog with MySQL B-Tree indexes..." />
      ) : songs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
            No songs found matching your search criteria.
          </p>
          <button onClick={() => setSearchParams({})} className="btn btn-primary btn-sm">
            Reset Filters
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {songs.map((song) => (
            <SongItem
              key={song.id}
              song={song}
              playlists={playlists}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '32px' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage <= 1}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set('page', String(currentPage - 1));
              setSearchParams(next);
            }}
          >
            ← Previous
          </button>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', padding: '0 8px' }}>
            Page {currentPage} of {totalPages}
          </span>

          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage >= totalPages}
            onClick={() => {
              const next = new URLSearchParams(searchParams);
              next.set('page', String(currentPage + 1));
              setSearchParams(next);
            }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Artist Detail Modal */}
      {artistModal.open && (
        <div
          className="modal-backdrop"
          onClick={() => setArtistModal({ open: false, data: null, loading: false })}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '600px', width: '100%' }}
          >
            <div className="modal-header">
              <h3 className="modal-title">Artist Profile</h3>
              <button
                className="modal-close"
                onClick={() => setArtistModal({ open: false, data: null, loading: false })}
                aria-label="Close artist profile"
              >
                ✕
              </button>
            </div>

            {artistModal.loading ? (
              <LoadingSpinner message="Querying artist record from MySQL..." />
            ) : artistModal.data ? (
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '6px' }}>
                        {artistModal.data.name}
                      </h2>
                      {artistModal.data.mbid && (
                        <span className="badge-provenance">
                          MBID: {artistModal.data.mbid}
                        </span>
                      )}
                    </div>
                    <span className="song-meta-pill">
                      {artistModal.data.source_namespace === 'lastfm' ? 'Last.fm Import' : 'App Catalog'}
                    </span>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '10px', lineHeight: '1.6' }}>
                    {artistModal.data.bio || 'No biography available for this artist.'}
                  </p>
                </div>

                <div className="grid-cols-2" style={{ gap: '12px' }}>
                  <div className="stat-box">
                    <div className="stat-box-value">{artistModal.data.song_count || 0}</div>
                    <div className="stat-box-label">Songs in Catalog</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-value">{(artistModal.data.total_plays || 0).toLocaleString()}</div>
                    <div className="stat-box-label">Total Scrobbles</div>
                  </div>
                </div>

                {artistModal.data.topTracks && artistModal.data.topTracks.length > 0 && (
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Top Tracks
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {artistModal.data.topTracks.map((track, idx) => (
                        <div
                          key={track.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 12px',
                            backgroundColor: 'var(--bg)',
                            borderRadius: 'var(--radius)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', flexShrink: 0 }}>
                              {idx + 1}.
                            </span>
                            <Link
                              to={`/songs/${track.id}`}
                              style={{ color: 'var(--text)', fontWeight: '600', fontSize: '0.875rem', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                              onClick={() => setArtistModal({ open: false, data: null, loading: false })}
                            >
                              {track.title}
                            </Link>
                          </div>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexShrink: 0 }}>
                            {track.genre_name && (
                              <span className="song-meta-pill" style={{ fontSize: '0.7rem' }}>{track.genre_name}</span>
                            )}
                            <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                              {(track.play_count || 0).toLocaleString()} plays
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
