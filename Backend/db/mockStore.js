const bcrypt = require('bcryptjs');

const GENRES = [
  { id: 1,  name: 'Pop',        description: 'Popular mainstream music with catchy melodies' },
  { id: 2,  name: 'Rock',       description: 'Guitar-driven music with powerful rhythms' },
  { id: 3,  name: 'Hip-Hop',    description: 'Rhythmic music with spoken-word vocals' },
  { id: 4,  name: 'R&B',        description: 'Rhythm and blues with soulful vocals' },
  { id: 5,  name: 'Electronic', description: 'Synthesizer-based music and beats' },
  { id: 6,  name: 'Jazz',       description: 'Improvisational music with complex harmonies' },
  { id: 7,  name: 'Classical',  description: 'Orchestral and composed instrumental music' },
  { id: 8,  name: 'Country',    description: 'Story-driven music with acoustic instruments' },
  { id: 9,  name: 'Indie',      description: 'Independent alternative music' },
  { id: 10, name: 'Metal',      description: 'Heavy, amplified rock music' },
];

const ARTISTS = [
  { id: 1,  name: 'Luna Nova',           bio: 'Chart-topping pop sensation known for electrifying live shows and vocal agility.' },
  { id: 2,  name: 'The Midnight Riders', bio: 'Classic rock band blending vintage analog riffs with modern stadium production.' },
  { id: 3,  name: 'DJ Phantom',          bio: 'Electronic producer and festival headliner pushing dance music frontiers.' },
  { id: 4,  name: 'Aria Sterling',       bio: 'Soulful R&B vocalist with an expressive four-octave range.' },
  { id: 5,  name: 'Marcus Cole',         bio: 'Lyrical hip-hop storyteller known for introspective poetry and rhythm.' },
  { id: 6,  name: 'The Jazz Collective', bio: 'Ensemble bringing progressive modal jazz to modern concert halls.' },
  { id: 7,  name: 'Elena Vasquez',       bio: 'Virtuoso classical pianist and composer acclaimed by European philharmonics.' },
  { id: 8,  name: 'Dusty Roads',         bio: 'Country singer-songwriter capturing dusty trails and heartland tales.' },
  { id: 9,  name: 'Echo Chamber',        bio: 'Atmospheric indie outfit creating lush reverb-drenched soundscapes.' },
  { id: 10, name: 'Iron Thunder',        bio: 'Heavy metal powerhouse with driving double-bass and melodic leads.' },
  { id: 11, name: 'Skyline',             bio: 'Electropop duo known for radiant hooks and synthwave undertones.' },
  { id: 12, name: 'Velvet Storm',        bio: 'Alternative rock band with deep guitars and raw emotional lyricism.' },
  { id: 13, name: 'Neon Pulse',          bio: 'Cyberpunk-inspired producer melding analog modular synths with heavy bass.' },
  { id: 14, name: 'Jasmine Ray',         bio: 'Neo-soul songstress exploring groove, tenderness, and modern intimacy.' },
  { id: 15, name: 'King Verse',          bio: 'Conscious hip-hop pioneer weaving boom-bap nostalgia with trap cadences.' },
  { id: 16, name: 'Blue Note Trio',      bio: 'Acoustic jazz trio inspired by 1950s Manhattan late-night sessions.' },
  { id: 17, name: 'Sophia Chen',         bio: 'Contemporary classical violinist reimagining orchestral sonatas.' },
  { id: 18, name: 'Wildflower',          bio: 'Folk-country storyteller singing of mountain cabins and prairie sunsets.' },
  { id: 19, name: 'Paper Planes',        bio: 'Dream-pop indie group featuring jangly guitars and ethereal vocals.' },
  { id: 20, name: 'Dark Horizon',        bio: 'Progressive metal group known for asymmetric time signatures and heavy drop tuning.' },
];

const RAW_SONGS = [
  // Pop (genre 1)
  { title: 'Starlight Boulevard',   artist_id: 1,  genre_id: 1,  album: 'Neon Dreams', duration_seconds: 214, release_date: '2024-03-15' },
  { title: 'Electric Hearts',       artist_id: 1,  genre_id: 1,  album: 'Neon Dreams', duration_seconds: 198, release_date: '2024-03-15' },
  { title: 'Dancing in the Glow',   artist_id: 1,  genre_id: 1,  album: 'Midnight Sun', duration_seconds: 227, release_date: '2023-08-20' },
  { title: 'City Lights',           artist_id: 11, genre_id: 1,  album: 'Horizons', duration_seconds: 203, release_date: '2024-01-10' },
  { title: 'Golden Hour',           artist_id: 11, genre_id: 1,  album: 'Horizons', duration_seconds: 189, release_date: '2024-01-10' },
  { title: 'Paper Moon',            artist_id: 11, genre_id: 1,  album: 'Horizons', duration_seconds: 241, release_date: '2024-01-10' },

  // Rock (genre 2)
  { title: 'Highway Thunder',       artist_id: 2,  genre_id: 2,  album: 'Rebel Heart', duration_seconds: 265, release_date: '2023-11-05' },
  { title: 'Burning Bridges',       artist_id: 2,  genre_id: 2,  album: 'Rebel Heart', duration_seconds: 298, release_date: '2023-11-05' },
  { title: 'Iron Will',             artist_id: 2,  genre_id: 2,  album: 'Steel & Stone', duration_seconds: 312, release_date: '2022-06-18' },
  { title: 'Shattered Glass',       artist_id: 12, genre_id: 2,  album: 'Tempest', duration_seconds: 245, release_date: '2024-02-28' },
  { title: 'Echoes of Tomorrow',    artist_id: 12, genre_id: 2,  album: 'Tempest', duration_seconds: 278, release_date: '2024-02-28' },
  { title: 'Storm Chaser',          artist_id: 12, genre_id: 2,  album: 'Tempest', duration_seconds: 255, release_date: '2024-02-28' },

  // Hip-Hop (genre 3)
  { title: 'Crown & Glory',         artist_id: 5,  genre_id: 3,  album: 'The Blueprint', duration_seconds: 232, release_date: '2024-04-01' },
  { title: 'Street Wisdom',         artist_id: 5,  genre_id: 3,  album: 'The Blueprint', duration_seconds: 201, release_date: '2024-04-01' },
  { title: 'Concrete Jungle',       artist_id: 5,  genre_id: 3,  album: 'Urban Tales', duration_seconds: 218, release_date: '2023-05-12' },
  { title: 'Royal Decree',          artist_id: 15, genre_id: 3,  album: 'Throne Room', duration_seconds: 195, release_date: '2024-06-15' },
  { title: 'Midnight Hustle',       artist_id: 15, genre_id: 3,  album: 'Throne Room', duration_seconds: 210, release_date: '2024-06-15' },
  { title: 'Legacy',                artist_id: 15, genre_id: 3,  album: 'Throne Room', duration_seconds: 248, release_date: '2024-06-15' },

  // R&B (genre 4)
  { title: 'Velvet Sky',            artist_id: 4,  genre_id: 4,  album: 'Silk & Soul', duration_seconds: 256, release_date: '2024-02-14' },
  { title: 'Slow Burn',             artist_id: 4,  genre_id: 4,  album: 'Silk & Soul', duration_seconds: 234, release_date: '2024-02-14' },
  { title: 'Moonlit Serenade',      artist_id: 4,  genre_id: 4,  album: 'After Hours', duration_seconds: 279, release_date: '2023-09-01' },
  { title: 'Ocean Eyes',            artist_id: 14, genre_id: 4,  album: 'Dusk Till Dawn', duration_seconds: 223, release_date: '2024-05-20' },
  { title: 'Tender Love',           artist_id: 14, genre_id: 4,  album: 'Dusk Till Dawn', duration_seconds: 245, release_date: '2024-05-20' },
  { title: 'Butterflies',           artist_id: 14, genre_id: 4,  album: 'Dusk Till Dawn', duration_seconds: 198, release_date: '2024-05-20' },

  // Electronic (genre 5)
  { title: 'Neon Nights',           artist_id: 3,  genre_id: 5,  album: 'Digital Dreams', duration_seconds: 342, release_date: '2024-01-20' },
  { title: 'Pulse Wave',            artist_id: 3,  genre_id: 5,  album: 'Digital Dreams', duration_seconds: 385, release_date: '2024-01-20' },
  { title: 'Cyber Dawn',            artist_id: 3,  genre_id: 5,  album: 'Binary Sunset', duration_seconds: 298, release_date: '2023-07-07' },
  { title: 'Retrowave',             artist_id: 13, genre_id: 5,  album: 'Synthwave City', duration_seconds: 312, release_date: '2024-03-30' },
  { title: 'Digital Love',          artist_id: 13, genre_id: 5,  album: 'Synthwave City', duration_seconds: 276, release_date: '2024-03-30' },
  { title: 'Future Shock',          artist_id: 13, genre_id: 5,  album: 'Synthwave City', duration_seconds: 334, release_date: '2024-03-30' },

  // Jazz (genre 6)
  { title: 'Blue Monday',           artist_id: 6,  genre_id: 6,  album: 'Late Night Sessions', duration_seconds: 367, release_date: '2023-10-15' },
  { title: 'Satin Smooth',          artist_id: 6,  genre_id: 6,  album: 'Late Night Sessions', duration_seconds: 289, release_date: '2023-10-15' },
  { title: 'Impromptu No. 5',       artist_id: 6,  genre_id: 6,  album: 'Free Flow', duration_seconds: 423, release_date: '2022-12-01' },
  { title: 'Midnight in Manhattan', artist_id: 16, genre_id: 6,  album: 'City Blues', duration_seconds: 301, release_date: '2024-04-18' },
  { title: 'Cool Breeze',           artist_id: 16, genre_id: 6,  album: 'City Blues', duration_seconds: 267, release_date: '2024-04-18' },
  { title: 'Swing Time',            artist_id: 16, genre_id: 6,  album: 'City Blues', duration_seconds: 245, release_date: '2024-04-18' },

  // Classical (genre 7)
  { title: 'Sonata in D Minor',     artist_id: 7,  genre_id: 7,  album: 'Nocturnes', duration_seconds: 480, release_date: '2023-03-25' },
  { title: 'Prelude to Dawn',       artist_id: 7,  genre_id: 7,  album: 'Nocturnes', duration_seconds: 356, release_date: '2023-03-25' },
  { title: 'Elegy for Strings',     artist_id: 7,  genre_id: 7,  album: 'Reflections', duration_seconds: 512, release_date: '2022-09-10' },
  { title: 'Autumn Concerto',       artist_id: 17, genre_id: 7,  album: 'Four Seasons', duration_seconds: 445, release_date: '2024-07-01' },
  { title: 'Whispers of Vienna',    artist_id: 17, genre_id: 7,  album: 'Four Seasons', duration_seconds: 398, release_date: '2024-07-01' },
  { title: 'Midnight Waltz',        artist_id: 17, genre_id: 7,  album: 'Four Seasons', duration_seconds: 367, release_date: '2024-07-01' },

  // Country (genre 8)
  { title: 'Dirt Road Anthem',      artist_id: 8,  genre_id: 8,  album: 'Backroads', duration_seconds: 223, release_date: '2023-12-10' },
  { title: 'Sunset Porch',          artist_id: 8,  genre_id: 8,  album: 'Backroads', duration_seconds: 198, release_date: '2023-12-10' },
  { title: 'Old Pickup Truck',      artist_id: 8,  genre_id: 8,  album: 'Simple Life', duration_seconds: 245, release_date: '2023-04-14' },
  { title: 'Meadow Song',           artist_id: 18, genre_id: 8,  album: 'Wild Petals', duration_seconds: 212, release_date: '2024-05-05' },
  { title: 'Campfire Stories',      artist_id: 18, genre_id: 8,  album: 'Wild Petals', duration_seconds: 234, release_date: '2024-05-05' },
  { title: 'Morning Dew',           artist_id: 18, genre_id: 8,  album: 'Wild Petals', duration_seconds: 189, release_date: '2024-05-05' },

  // Indie (genre 9)
  { title: 'Faded Polaroids',       artist_id: 9,  genre_id: 9,  album: 'Lo-Fi Diaries', duration_seconds: 234, release_date: '2024-02-10' },
  { title: 'Rooftop View',          artist_id: 9,  genre_id: 9,  album: 'Lo-Fi Diaries', duration_seconds: 198, release_date: '2024-02-10' },
  { title: 'Analog Days',           artist_id: 9,  genre_id: 9,  album: 'Warm Tones', duration_seconds: 256, release_date: '2023-06-22' },
  { title: 'Sunday Morning',        artist_id: 19, genre_id: 9,  album: 'Postcards', duration_seconds: 201, release_date: '2024-08-12' },
  { title: 'Wishing Well',          artist_id: 19, genre_id: 9,  album: 'Postcards', duration_seconds: 218, release_date: '2024-08-12' },
  { title: 'Paper Airplanes',       artist_id: 19, genre_id: 9,  album: 'Postcards', duration_seconds: 187, release_date: '2024-08-12' },

  // Metal (genre 10)
  { title: 'Wrath Unchained',       artist_id: 10, genre_id: 10, album: 'Forged in Fire', duration_seconds: 345, release_date: '2023-10-31' },
  { title: 'Crimson Fury',          artist_id: 10, genre_id: 10, album: 'Forged in Fire', duration_seconds: 312, release_date: '2023-10-31' },
  { title: 'Titan\'s Fall',         artist_id: 10, genre_id: 10, album: 'Apocalypse', duration_seconds: 378, release_date: '2022-08-15' },
  { title: 'Abyssal Gate',          artist_id: 20, genre_id: 10, album: 'Event Horizon', duration_seconds: 401, release_date: '2024-06-06' },
  { title: 'Singularity',           artist_id: 20, genre_id: 10, album: 'Event Horizon', duration_seconds: 356, release_date: '2024-06-06' },
  { title: 'Void Walker',           artist_id: 20, genre_id: 10, album: 'Event Horizon', duration_seconds: 423, release_date: '2024-06-06' },
];

const SONGS = RAW_SONGS.map((s, idx) => ({ id: idx + 1, ...s, source_namespace: 'local' }));

// Safely load and merge pipeline-imported data without colliding with local primary keys
const fs = require('fs');
const path = require('path');
const importedPath = path.resolve(__dirname, 'importedData.json');
if (fs.existsSync(importedPath)) {
  try {
    const rawData = JSON.parse(fs.readFileSync(importedPath, 'utf8'));
    if (Array.isArray(rawData.artists)) {
      const existingNames = new Set(ARTISTS.map(a => a.name.toLowerCase()));
      let maxAid = Math.max(...ARTISTS.map(a => a.id), 20);
      for (const impA of rawData.artists) {
        if (!existingNames.has(impA.name.toLowerCase())) {
          existingNames.add(impA.name.toLowerCase());
          ARTISTS.push({
            id: ++maxAid,
            name: impA.name,
            bio: impA.bio,
            source_namespace: impA.source_namespace || 'lastfm',
            source_id: impA.source_id || impA.id
          });
        }
      }
    }
    if (Array.isArray(rawData.songs)) {
      const existingTitles = new Set(SONGS.map(s => `${s.artist_id}::${s.title.toLowerCase()}`));
      let maxSid = Math.max(...SONGS.map(s => s.id), 60);
      for (const impS of rawData.songs) {
        const key = `${impS.artist_id}::${impS.title.toLowerCase()}`;
        if (!existingTitles.has(key)) {
          existingTitles.add(key);
          SONGS.push({
            id: ++maxSid,
            title: impS.title,
            artist_id: impS.artist_id,
            genre_id: impS.genre_id,
            album: impS.album,
            duration_seconds: impS.duration_seconds,
            release_date: impS.release_date,
            source_namespace: impS.source_namespace || 'lastfm',
            source_id: impS.source_id || impS.id
          });
        }
      }
    }
  } catch (err) {
    // Non-fatal: mockStore will operate on baseline dataset
  }
}

const hashedPassword = bcrypt.hashSync('password123', 10);
const USERS = [
  { id: 1, username: 'john_doe',   email: 'john@example.com',  password_hash: hashedPassword, created_at: new Date() },
  { id: 2, username: 'jane_smith', email: 'jane@example.com',   password_hash: hashedPassword, created_at: new Date() },
  { id: 3, username: 'music_lover', email: 'music@example.com', password_hash: hashedPassword, created_at: new Date() },
];

// Pre-seed listening history
const LISTENING_HISTORY = [];
let listenId = 1;
for (let uId = 1; uId <= 3; uId++) {
  const count = 40;
  for (let i = 0; i < count; i++) {
    const song = SONGS[Math.floor(Math.random() * SONGS.length)];
    const hoursAgo = Math.floor(Math.random() * (60 * 24));
    const listenedAt = new Date(Date.now() - hoursAgo * 3600 * 1000);
    LISTENING_HISTORY.push({
      id: listenId++,
      user_id: uId,
      song_id: song.id,
      listened_at: listenedAt.toISOString(),
      duration_listened: Math.floor(song.duration_seconds * 0.8),
    });
  }
}

// Pre-seed ratings
const RATINGS = [];
let ratingId = 1;
for (let uId = 1; uId <= 3; uId++) {
  const sample = [...SONGS].sort(() => Math.random() - 0.5).slice(0, 18);
  for (const s of sample) {
    RATINGS.push({
      id: ratingId++,
      user_id: uId,
      song_id: s.id,
      rating: 3 + Math.floor(Math.random() * 3), // 3-5 stars
      created_at: new Date().toISOString(),
    });
  }
}

// Pre-seed playlists
const PLAYLISTS = [
  { id: 1, user_id: 1, name: 'Chill Vibes',     description: 'Relaxing tracks for a chill evening', is_public: true, created_at: new Date(), updated_at: new Date() },
  { id: 2, user_id: 1, name: 'Workout Mix',     description: 'High-energy tracks to pump you up',   is_public: true, created_at: new Date(), updated_at: new Date() },
  { id: 3, user_id: 2, name: 'Late Night Jazz', description: 'Smooth jazz for late-night listening', is_public: true, created_at: new Date(), updated_at: new Date() },
  { id: 4, user_id: 2, name: 'Indie Favorites', description: 'Best indie tracks hand-picked',       is_public: true, created_at: new Date(), updated_at: new Date() },
  { id: 5, user_id: 3, name: 'Everything Mix',  description: 'A little bit of everything',          is_public: true, created_at: new Date(), updated_at: new Date() },
];

const PLAYLIST_SONGS = [
  { id: 1, playlist_id: 1, song_id: 1, position: 1, added_at: new Date() },
  { id: 2, playlist_id: 1, song_id: 4, position: 2, added_at: new Date() },
  { id: 3, playlist_id: 1, song_id: 19, position: 3, added_at: new Date() },
  { id: 4, playlist_id: 2, song_id: 7, position: 1, added_at: new Date() },
  { id: 5, playlist_id: 2, song_id: 8, position: 2, added_at: new Date() },
  { id: 6, playlist_id: 2, song_id: 55, position: 3, added_at: new Date() },
  { id: 7, playlist_id: 3, song_id: 31, position: 1, added_at: new Date() },
  { id: 8, playlist_id: 3, song_id: 32, position: 2, added_at: new Date() },
];

let nextUserId = 4;
let nextPlaylistId = 6;
let nextPlaylistSongId = 9;

// Mock query router
async function executeMockQuery(sql, params = []) {
  const norm = sql.trim().toLowerCase();

  // 1. Auth: Check existing user
  if (norm.includes('select id from users where email = ? or username = ?')) {
    const [email, username] = params;
    const found = USERS.filter(u => u.email === email || u.username === username);
    return [found];
  }

  // 2. Auth: Insert new user
  if (norm.startsWith('insert into users')) {
    const [username, email, password_hash] = params;
    const newUser = { id: nextUserId++, username, email, password_hash, created_at: new Date() };
    USERS.push(newUser);
    return [{ insertId: newUser.id }];
  }

  // 3. Auth: Login query
  if (norm.includes('from users where email = ?')) {
    const [email] = params;
    const found = USERS.filter(u => u.email === email);
    return [found];
  }

  // 4. Songs: Genres list (genre_popularity_view)
  if (norm.includes('from genre_popularity_view') || (norm.includes('from genres') && norm.includes('song_count'))) {
    const rows = GENRES.map(g => {
      const gSongs = SONGS.filter(s => s.genre_id === g.id);
      const songIds = new Set(gSongs.map(s => s.id));
      const gPlays = LISTENING_HISTORY.filter(lh => songIds.has(lh.song_id)).length;
      const gRatings = RATINGS.filter(r => songIds.has(r.song_id));
      const avg = gRatings.length ? gRatings.reduce((sum, r) => sum + r.rating, 0) / gRatings.length : 4.0;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        song_count: gSongs.length,
        total_plays: gPlays,
        avg_rating: avg,
      };
    }).sort((a, b) => b.total_plays - a.total_plays);
    return [rows];
  }

  // 5. Songs: Artists list
  if (norm.includes('from artists a left join songs s')) {
    const rows = ARTISTS.map(a => ({
      id: a.id,
      name: a.name,
      image_url: null,
      song_count: SONGS.filter(s => s.artist_id === a.id).length,
    })).sort((a, b) => a.name.localeCompare(b.name));
    return [rows];
  }

  // 6. Songs: Detail by ID
  if (norm.includes('from songs s') && norm.includes('where s.id = ?')) {
    const songId = parseInt(params[0]);
    const song = SONGS.find(s => s.id === songId);
    if (!song) return [[]];
    const artist = ARTISTS.find(a => a.id === song.artist_id) || {};
    const genre = GENRES.find(g => g.id === song.genre_id) || {};
    const plays = LISTENING_HISTORY.filter(lh => lh.song_id === songId).length;
    const songRatings = RATINGS.filter(r => r.song_id === songId);
    const avg = songRatings.length ? songRatings.reduce((sum, r) => sum + r.rating, 0) / songRatings.length : 4.2;

    const row = {
      ...song,
      artist_name: artist.name,
      artist_bio: artist.bio,
      genre_name: genre.name,
      play_count: plays,
      avg_rating: avg,
      rating_count: songRatings.length,
    };
    return [[row]];
  }

  // 7. Songs: Count total songs with filters
  if (norm.includes('select count(*) as total from songs')) {
    let filtered = [...SONGS];
    // extract filters
    if (params.length === 1 && typeof params[0] === 'number') {
      // genre or artist filter
      filtered = filtered.filter(s => s.genre_id === params[0] || s.artist_id === params[0]);
    }
    return [[{ total: filtered.length }]];
  }

  // 8. Songs: List songs with search/filter/pagination
  if (norm.includes('from songs s') && norm.includes('join artists a')) {
    let list = SONGS.map(s => {
      const artist = ARTISTS.find(a => a.id === s.artist_id) || {};
      const genre = GENRES.find(g => g.id === s.genre_id) || {};
      const plays = LISTENING_HISTORY.filter(lh => lh.song_id === s.id).length;
      const songRatings = RATINGS.filter(r => r.song_id === s.id);
      const avg = songRatings.length ? songRatings.reduce((sum, r) => sum + r.rating, 0) / songRatings.length : 4.0;
      return {
        id: s.id,
        title: s.title,
        album: s.album,
        duration_seconds: s.duration_seconds,
        cover_url: null,
        release_date: s.release_date,
        artist_id: artist.id,
        artist_name: artist.name,
        genre_id: genre.id,
        genre_name: genre.name,
        play_count: plays,
        avg_rating: avg,
      };
    });

    // Check search term
    const searchParam = params.find(p => typeof p === 'string' && p.startsWith('%'));
    if (searchParam) {
      const q = searchParam.replace(/%/g, '').toLowerCase();
      list = list.filter(s => s.title.toLowerCase().includes(q) || s.artist_name.toLowerCase().includes(q) || (s.album && s.album.toLowerCase().includes(q)));
    }

    // Genre/artist filter
    const numParams = params.filter(p => typeof p === 'number');
    if (numParams.length >= 3) {
      // genre or artist + limit + offset
      const filterVal = numParams[0];
      list = list.filter(s => s.genre_id === filterVal || s.artist_id === filterVal);
    }

    const limit = numParams[numParams.length - 2] || 15;
    const offset = numParams[numParams.length - 1] || 0;
    const paged = list.slice(offset, offset + limit);
    return [paged];
  }

  // 9. Listening: Log a listen
  if (norm.startsWith('insert into listening_history')) {
    const [userId, songId, duration] = params;
    LISTENING_HISTORY.push({
      id: listenId++,
      user_id: userId,
      song_id: songId,
      listened_at: new Date().toISOString(),
      duration_listened: duration || 180,
    });
    return [{ insertId: listenId }];
  }

  // 10. Listening: User history count
  if (norm.includes('count(*) as total from listening_history where user_id = ?')) {
    const [userId] = params;
    const total = LISTENING_HISTORY.filter(lh => lh.user_id === userId).length;
    return [[{ total }]];
  }

  // 11. Listening: User history list
  if (norm.includes('from listening_history lh') && norm.includes('where lh.user_id = ?') && !norm.includes('group by')) {
    const [userId, limit = 30, offset = 0] = params;
    const userListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId)
      .sort((a, b) => new Date(b.listened_at) - new Date(a.listened_at))
      .slice(offset, offset + limit);

    const rows = userListens.map(lh => {
      const song = SONGS.find(s => s.id === lh.song_id) || {};
      const artist = ARTISTS.find(a => a.id === song.artist_id) || {};
      const genre = GENRES.find(g => g.id === song.genre_id) || {};
      return {
        id: lh.id,
        listened_at: lh.listened_at,
        duration_listened: lh.duration_listened,
        song_id: song.id,
        title: song.title,
        album: song.album,
        cover_url: null,
        duration_seconds: song.duration_seconds,
        artist_name: artist.name,
        genre_name: genre.name,
      };
    });
    return [rows];
  }

  // 12. Ratings: Upsert rating
  if (norm.startsWith('insert into ratings')) {
    const [userId, songId, rating] = params;
    const existingIdx = RATINGS.findIndex(r => r.user_id === userId && r.song_id === songId);
    if (existingIdx >= 0) {
      RATINGS[existingIdx].rating = rating;
      RATINGS[existingIdx].created_at = new Date().toISOString();
    } else {
      RATINGS.push({
        id: ratingId++,
        user_id: userId,
        song_id: songId,
        rating: rating,
        created_at: new Date().toISOString(),
      });
    }
    return [{ message: 'Rating saved' }];
  }

  // 13. Ratings: Get user's ratings
  if (norm.includes('from ratings r') && norm.includes('where r.user_id = ?')) {
    const [userId] = params;
    const userRatings = RATINGS.filter(r => r.user_id === userId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const rows = userRatings.map(r => {
      const song = SONGS.find(s => s.id === r.song_id) || {};
      const artist = ARTISTS.find(a => a.id === song.artist_id) || {};
      const genre = GENRES.find(g => g.id === song.genre_id) || {};
      return {
        song_id: r.song_id,
        rating: r.rating,
        created_at: r.created_at,
        title: song.title,
        album: song.album,
        cover_url: null,
        artist_name: artist.name,
        genre_name: genre.name,
      };
    });
    return [rows];
  }

  // 14. Ratings: Song stats
  if (norm.includes('select coalesce(avg(rating),0) as avg_rating, count(*) as count from ratings where song_id = ?')) {
    const [songId] = params;
    const songRatings = RATINGS.filter(r => r.song_id === parseInt(songId));
    const avg = songRatings.length ? songRatings.reduce((s, r) => s + r.rating, 0) / songRatings.length : 0;
    return [[{ avg_rating: avg, count: songRatings.length }]];
  }

  // 15. Ratings: Single user rating for song
  if (norm.includes('select rating from ratings where user_id = ? and song_id = ?')) {
    const [userId, songId] = params;
    const match = RATINGS.filter(r => r.user_id === userId && r.song_id === parseInt(songId));
    return [match];
  }

  // 16. Playlists: List for user
  if (norm.includes('from playlists p') && norm.includes('where p.user_id = ?')) {
    const [userId] = params;
    const userPlaylists = PLAYLISTS.filter(p => p.user_id === userId).map(p => {
      const songCount = PLAYLIST_SONGS.filter(ps => ps.playlist_id === p.id).length;
      return { ...p, song_count: songCount };
    });
    return [userPlaylists];
  }

  // 17. Playlists: Create
  if (norm.startsWith('insert into playlists')) {
    const [userId, name, description, is_public] = params;
    const newPl = {
      id: nextPlaylistId++,
      user_id: userId,
      name,
      description: description || '',
      is_public: Boolean(is_public),
      created_at: new Date(),
      updated_at: new Date(),
    };
    PLAYLISTS.push(newPl);
    return [{ insertId: newPl.id }];
  }

  // 18. Playlists: Detail by ID
  if (norm.includes('from playlists where id = ?')) {
    const [id] = params;
    const pl = PLAYLISTS.find(p => p.id === parseInt(id));
    return [pl ? [pl] : []];
  }

  // 19. Playlists: Songs in playlist
  if (norm.includes('from playlist_songs ps') && norm.includes('where ps.playlist_id = ?')) {
    const [plId] = params;
    const pSongs = PLAYLIST_SONGS.filter(ps => ps.playlist_id === parseInt(plId))
      .sort((a, b) => a.position - b.position);

    const rows = pSongs.map(ps => {
      const song = SONGS.find(s => s.id === ps.song_id) || {};
      const artist = ARTISTS.find(a => a.id === song.artist_id) || {};
      const genre = GENRES.find(g => g.id === song.genre_id) || {};
      return {
        position: ps.position,
        added_at: ps.added_at,
        id: song.id,
        title: song.title,
        album: song.album,
        duration_seconds: song.duration_seconds,
        cover_url: null,
        artist_name: artist.name,
        genre_name: genre.name,
      };
    });
    return [rows];
  }

  // 20. Playlists: Delete playlist
  if (norm.startsWith('delete from playlists where id = ?')) {
    const [id] = params;
    const idx = PLAYLISTS.findIndex(p => p.id === parseInt(id));
    if (idx >= 0) {
      PLAYLISTS.splice(idx, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 21. Playlists: Add song to playlist
  if (norm.startsWith('insert into playlist_songs')) {
    const [plId, songId, position] = params;
    PLAYLIST_SONGS.push({
      id: nextPlaylistSongId++,
      playlist_id: parseInt(plId),
      song_id: parseInt(songId),
      position: position || 1,
      added_at: new Date(),
    });
    return [{ insertId: nextPlaylistSongId }];
  }

  // 22. Playlists: Remove song from playlist
  if (norm.includes('delete ps from playlist_songs ps')) {
    const [plId, songId] = params;
    const idx = PLAYLIST_SONGS.findIndex(ps => ps.playlist_id === parseInt(plId) && ps.song_id === parseInt(songId));
    if (idx >= 0) {
      PLAYLIST_SONGS.splice(idx, 1);
      return [{ affectedRows: 1 }];
    }
    return [{ affectedRows: 0 }];
  }

  // 23. Recommendations: Stored procedure sp_get_recommendations or fallback
  if (norm.includes('sp_get_recommendations') || norm.includes('order by coalesce(rc.avg_rating')) {
    const limit = parseInt(params[params.length - 1]) || 6;
    const scored = SONGS.map(s => {
      const artist = ARTISTS.find(a => a.id === s.artist_id) || {};
      const genre = GENRES.find(g => g.id === s.genre_id) || {};
      const plays = LISTENING_HISTORY.filter(lh => lh.song_id === s.id).length;
      const songRatings = RATINGS.filter(r => r.song_id === s.id);
      const avg = songRatings.length ? songRatings.reduce((sum, r) => sum + r.rating, 0) / songRatings.length : 4.0;
      // Formula from stored procedure: score = (genre_weight * 2) + avg_rating + log(1 + plays)
      const score = (1.5 * 2) + avg + Math.log(1 + plays);
      return {
        id: s.id,
        title: s.title,
        album: s.album,
        duration_seconds: s.duration_seconds,
        cover_url: null,
        release_date: s.release_date,
        artist_name: artist.name,
        artist_id: artist.id,
        genre_name: genre.name,
        genre_id: genre.id,
        play_count: plays,
        avg_rating: avg,
        score,
      };
    }).sort((a, b) => b.score - a.score).slice(0, limit);

    // Stored procedure returns array of result sets [rows]
    return [[scored]];
  }

  // 24. Analytics: Personal overview (user_analytics_view)
  if (norm.includes('from user_analytics_view where user_id = ?')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const unique = new Set(uListens.map(lh => lh.song_id)).size;
    const totalSecs = uListens.reduce((sum, lh) => sum + (lh.duration_listened || 180), 0);
    const uRatings = RATINGS.filter(r => r.user_id === userId);
    const avgRating = uRatings.length ? uRatings.reduce((s, r) => s + r.rating, 0) / uRatings.length : 0;
    const u = USERS.find(u => u.id === userId) || {};

    const overview = {
      user_id: userId,
      username: u.username,
      total_listens: uListens.length,
      unique_songs: unique,
      total_listen_seconds: totalSecs,
      total_ratings: uRatings.length,
      avg_given_rating: avgRating,
    };
    return [[overview]];
  }

  // 25. Analytics: Personal top genres
  if (norm.includes('from listening_history lh') && norm.includes('group by g.id, g.name')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      const s = SONGS.find(s => s.id === lh.song_id);
      if (s) {
        const g = GENRES.find(g => g.id === s.genre_id);
        if (g) counts[g.name] = (counts[g.name] || 0) + 1;
      }
    }
    const rows = Object.entries(counts)
      .map(([name, listens]) => ({ name, listens, avg_rating: 4.5 }))
      .sort((a, b) => b.listens - a.listens)
      .slice(0, 10);
    return [rows];
  }

  // 26. Analytics: Personal top artists
  if (norm.includes('group by a.id, a.name')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      const s = SONGS.find(s => s.id === lh.song_id);
      if (s) {
        const a = ARTISTS.find(a => a.id === s.artist_id);
        if (a) counts[a.name] = (counts[a.name] || 0) + 1;
      }
    }
    const rows = Object.entries(counts)
      .map(([name, listens]) => ({ name, listens }))
      .sort((a, b) => b.listens - a.listens)
      .slice(0, 10);
    return [rows];
  }

  // 27. Analytics: Personal top songs
  if (norm.includes('group by s.id, s.title, a.name') && norm.includes('from listening_history')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      counts[lh.song_id] = (counts[lh.song_id] || 0) + 1;
    }
    const rows = Object.entries(counts).map(([songId, listens]) => {
      const song = SONGS.find(s => s.id === parseInt(songId)) || {};
      const artist = ARTISTS.find(a => a.id === song.artist_id) || {};
      return {
        id: song.id,
        title: song.title,
        artist_name: artist.name,
        listens,
      };
    }).sort((a, b) => b.listens - a.listens).slice(0, 10);
    return [rows];
  }

  // 28. Analytics: Hourly distribution
  if (norm.includes('group by hour(listened_at)')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      const h = new Date(lh.listened_at).getHours();
      counts[h] = (counts[h] || 0) + 1;
    }
    const rows = Object.entries(counts).map(([h, listens]) => ({ hour: parseInt(h), listens }));
    return [rows];
  }

  // 29. Analytics: Day of week distribution
  if (norm.includes('group by dayofweek(listened_at)')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      const d = new Date(lh.listened_at).getDay() + 1; // 1 = Sun
      counts[d] = (counts[d] || 0) + 1;
    }
    const rows = Object.entries(counts).map(([d, listens]) => ({ day: parseInt(d), listens }));
    return [rows];
  }

  // 30. Analytics: Trend
  if (norm.includes('group by date(listened_at)')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const counts = {};
    for (const lh of uListens) {
      const date = new Date(lh.listened_at).toISOString().slice(0, 10);
      counts[date] = (counts[date] || 0) + 1;
    }
    const rows = Object.entries(counts)
      .map(([date, listens]) => ({ date, listens, total_duration: listens * 200 }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);
    return [rows];
  }

  // 31. Analytics: Global most played (top_songs_view)
  if (norm.includes('from top_songs_view')) {
    const rows = SONGS.map(s => {
      const artist = ARTISTS.find(a => a.id === s.artist_id) || {};
      const genre = GENRES.find(g => g.id === s.genre_id) || {};
      const plays = LISTENING_HISTORY.filter(lh => lh.song_id === s.id).length;
      const songRatings = RATINGS.filter(r => r.song_id === s.id);
      const avg = songRatings.length ? songRatings.reduce((sum, r) => sum + r.rating, 0) / songRatings.length : 4.0;
      return {
        id: s.id,
        title: s.title,
        album: s.album,
        duration_seconds: s.duration_seconds,
        artist_name: artist.name,
        genre_name: genre.name,
        play_count: plays,
        avg_rating: avg,
        rating_count: songRatings.length,
      };
    }).sort((a, b) => b.play_count - a.play_count).slice(0, 10);
    return [rows];
  }

  // 32. Analytics: Global totals
  if (norm.includes('select count(*) from users') || norm.includes('as total_users')) {
    return [[{
      total_users: USERS.length,
      total_songs: SONGS.length,
      total_listens: LISTENING_HISTORY.length,
      total_ratings: RATINGS.length,
    }]];
  }

  // 33. Analytics: Global active users
  if (norm.includes('group by u.id, u.username')) {
    const rows = USERS.map(u => {
      const count = LISTENING_HISTORY.filter(lh => lh.user_id === u.id).length;
      return { id: u.id, username: u.username, total_listens: count };
    }).sort((a, b) => b.total_listens - a.total_listens);
    return [rows];
  }

  // 34. Analytics: Global top rated songs
  if (norm.includes('having count(r.id)') || (norm.includes('avg(r.rating) as avg_rating') && norm.includes('from ratings r'))) {
    const ratingGroups = {};
    for (const r of RATINGS) {
      if (!ratingGroups[r.song_id]) ratingGroups[r.song_id] = [];
      ratingGroups[r.song_id].push(r.rating);
    }
    let entries = Object.entries(ratingGroups).filter(([_, arr]) => arr.length >= 2);
    if (entries.length === 0) {
      entries = Object.entries(ratingGroups);
    }
    const rows = entries
      .map(([songId, arr]) => {
        const s = SONGS.find(s => s.id === parseInt(songId)) || {};
        const a = ARTISTS.find(a => a.id === s.artist_id) || {};
        const g = GENRES.find(g => g.id === s.genre_id) || {};
        const avg = arr.reduce((sum, v) => sum + v, 0) / arr.length;
        return {
          id: s.id,
          title: s.title || `Track #${songId}`,
          artist_name: a.name || 'Various Artists',
          genre_name: g.name || 'General',
          avg_rating: avg,
          rating_count: arr.length,
        };
      })
      .sort((a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count)
      .slice(0, 10);
    return [rows];
  }

  return [[]];
}

module.exports = { executeMockQuery };
