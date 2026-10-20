import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  const currentPage = parseInt(searchParams.get('page') || '1');
  const limit = 15;

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
  }, [searchQuery, selectedGenre, selectedArtist, currentPage]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set('page', '1'); // reset page on filter change
    setSearchParams(next);
  };

  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="page-container" id="main-content">
      <div className="page-header">
        <div>
          <h1 className="page-title">Song Library</h1>
          <p className="page-subtitle">
            Browse, search, and rate songs across diverse genres. Every listen updates your relational preference matrix.
          </p>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Showing {songs.length} of {total} indexed tracks
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
              id="genre-filter-select"
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
              id="artist-filter-select"
            >
              <option value="">All Artists</option>
              {artists.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedGenre || selectedArtist) && (
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
    </div>
  );
}
