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
const IMPORTED_USERS = [];
const AGGREGATED_COUNTS = [];

if (fs.existsSync(importedPath)) {
  try {
    const rawData = JSON.parse(fs.readFileSync(importedPath, 'utf8'));
    if (Array.isArray(rawData.users)) {
      for (const impU of rawData.users) {
        IMPORTED_USERS.push({
          id: impU.id,
          username: impU.username,
          email: impU.email,
          gender: impU.gender,
          age: impU.age,
          country: impU.country,
          source_namespace: 'lastfm',
          source_id: impU.source_id || impU.id,
          created_at: impU.created_at || '2008-01-01',
        });
      }
    }
    if (Array.isArray(rawData.aggregated_listening_counts)) {
      for (const alc of rawData.aggregated_listening_counts) {
        AGGREGATED_COUNTS.push({
          user_id: alc.user_id,
          artist_id: alc.artist_id,
          song_id: alc.song_id,
          play_count: alc.play_count || 0,
          source_namespace: 'dataset',
        });
      }
    }
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
            album: impS.album || null,
            duration_seconds: impS.duration_seconds || 0,
            release_date: impS.release_date || null,
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
  { id: 1, username: 'john_doe',   email: 'john@example.com',  password_hash: hashedPassword, source_namespace: 'local', created_at: new Date() },
  { id: 2, username: 'jane_smith', email: 'jane@example.com',   password_hash: hashedPassword, source_namespace: 'local', created_at: new Date() },
  { id: 3, username: 'music_lover', email: 'music@example.com', password_hash: hashedPassword, source_namespace: 'local', created_at: new Date() },
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
      source_namespace: 'local',
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
      source_namespace: 'local',
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
    const newUser = { id: nextUserId++, username, email, password_hash, source_namespace: 'local', created_at: new Date() };
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
      const gAggPlays = AGGREGATED_COUNTS.filter(ac => songIds.has(ac.song_id)).reduce((sum, ac) => sum + (ac.play_count || 0), 0);
      const gRatings = RATINGS.filter(r => songIds.has(r.song_id));
      const avg = gRatings.length ? gRatings.reduce((sum, r) => sum + r.rating, 0) / gRatings.length : 0;
      return {
        id: g.id,
        name: g.name,
        description: g.description,
        song_count: gSongs.length,
        total_plays: gPlays + gAggPlays,
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
      if (norm.includes('g.id = ?')) {
        list = list.filter(s => s.genre_id === filterVal);
      } else if (norm.includes('a.id = ?')) {
        list = list.filter(s => s.artist_id === filterVal);
      } else {
        list = list.filter(s => s.genre_id === filterVal || s.artist_id === filterVal);
      }
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
      user_id: parseInt(userId),
      song_id: parseInt(songId),
      listened_at: new Date().toISOString(),
      duration_listened: parseInt(duration) || 180,
      source_namespace: 'local',
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
    const uId = parseInt(userId);
    const sId = parseInt(songId);
    const rVal = parseInt(rating);
    const existingIdx = RATINGS.findIndex(r => r.user_id === uId && r.song_id === sId);
    if (existingIdx >= 0) {
      RATINGS[existingIdx].rating = rVal;
      RATINGS[existingIdx].created_at = new Date().toISOString();
    } else {
      RATINGS.push({
        id: ratingId++,
        user_id: uId,
        song_id: sId,
        rating: rVal,
        source_namespace: 'local',
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

  // 20.5. Playlists: Max position
  if (norm.includes('max(position)') && norm.includes('from playlist_songs')) {
    const [plId] = params;
    const pSongs = PLAYLIST_SONGS.filter(ps => ps.playlist_id === parseInt(plId));
    const maxPos = pSongs.length ? Math.max(...pSongs.map(ps => ps.position)) : 0;
    return [[{ maxPos }]];
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

  // 23. Recommendations: Adaptive recommendation engine (CF, Content-Based, and Popularity Baseline)
  if (norm.includes('sp_get_recommendations') || norm.includes('order by coalesce(rc.avg_rating')) {
    const userId = parseInt(params[0]) || 1;
    const limit = parseInt(params[params.length - 1]) || 6;
    const recResult = computeRecommendations(userId, limit);
    // Stored procedure returns array of result sets [rows]
    return [[recResult.recommendations]];
  }

  // 24. Analytics: Personal overview (user_analytics_view)
  if (norm.includes('from user_analytics_view where user_id = ?')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const unique = new Set(uListens.map(lh => lh.song_id)).size;
    const totalSecs = uListens.reduce((sum, lh) => sum + (lh.duration_listened || 0), 0);
    const uRatings = RATINGS.filter(r => r.user_id === userId);
    const avgRating = uRatings.length ? (uRatings.reduce((s, r) => s + r.rating, 0) / uRatings.length) : 0;
    const u = USERS.find(u => u.id === userId) || {};

    const overview = {
      user_id: userId,
      username: u.username,
      total_listens: uListens.length,
      unique_songs: unique,
      total_listen_seconds: totalSecs,
      total_ratings: uRatings.length,
      avg_given_rating: avgRating,
      source_namespace: u.source_namespace || 'local',
      telemetry_tier: 'Granular Application User Session Logs',
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
      .map(([name, listens]) => {
        const genreObj = GENRES.find(g => g.name === name);
        const genreSongIds = genreObj ? SONGS.filter(s => s.genre_id === genreObj.id).map(s => s.id) : [];
        const genreRatings = RATINGS.filter(r => r.user_id === userId && genreSongIds.includes(r.song_id));
        const avg = genreRatings.length ? (genreRatings.reduce((sum, r) => sum + r.rating, 0) / genreRatings.length) : 0;
        return { name, listens, avg_rating: avg };
      })
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
        artist_name: artist.name || 'Unknown Artist',
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

  // 30. Analytics: Trend (Aggregated by date with actual duration sum)
  if (norm.includes('group by date(listened_at)')) {
    const [userId] = params;
    const uListens = LISTENING_HISTORY.filter(lh => lh.user_id === userId);
    const dateMap = {};
    for (const lh of uListens) {
      const date = new Date(lh.listened_at).toISOString().slice(0, 10);
      if (!dateMap[date]) dateMap[date] = { count: 0, duration: 0 };
      dateMap[date].count += 1;
      dateMap[date].duration += (lh.duration_listened || 0);
    }
    const rows = Object.entries(dateMap)
      .map(([date, data]) => ({ date, listens: data.count, total_duration: data.duration }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-15);
    return [rows];
  }

  // 31. Analytics: Global most played (top_songs_view)
  if (norm.includes('from top_songs_view')) {
    const rows = SONGS.map(s => {
      const artist = ARTISTS.find(a => a.id === s.artist_id) || {};
      const genre = GENRES.find(g => g.id === s.genre_id) || {};
      const directPlays = LISTENING_HISTORY.filter(lh => lh.song_id === s.id).length;
      const aggPlays = AGGREGATED_COUNTS.filter(ac => ac.song_id === s.id).reduce((sum, ac) => sum + (ac.play_count || 0), 0);
      const songRatings = RATINGS.filter(r => r.song_id === s.id);
      const avg = songRatings.length ? (songRatings.reduce((sum, r) => sum + r.rating, 0) / songRatings.length) : 0;
      return {
        id: s.id,
        title: s.title,
        album: s.album,
        duration_seconds: s.duration_seconds,
        artist_name: artist.name || 'Unknown Artist',
        genre_name: genre.name || 'General',
        play_count: directPlays + aggPlays,
        direct_plays: directPlays,
        aggregated_plays: aggPlays,
        avg_rating: avg,
        rating_count: songRatings.length,
        source_namespace: s.source_namespace || 'local',
      };
    }).sort((a, b) => b.play_count - a.play_count).slice(0, 10);
    return [rows];
  }

  // 32. Analytics: Global totals (Categorized by provenance & aggregation level)
  if (norm.includes('select count(*) from users') || norm.includes('as total_users')) {
    const liveAppListens = LISTENING_HISTORY.filter(lh => (lh.source_namespace || 'local') === 'local').length;
    const importedScrobbles = LISTENING_HISTORY.filter(lh => lh.source_namespace === 'lastfm').length;
    const aggPlays = AGGREGATED_COUNTS.reduce((sum, c) => sum + (c.play_count || 0), 0);
    const totalListens = LISTENING_HISTORY.length + aggPlays;

    return [[{
      total_users: USERS.length + IMPORTED_USERS.length,
      registered_app_users: USERS.filter(u => (u.source_namespace || 'local') === 'local').length,
      imported_listener_profiles: IMPORTED_USERS.length,
      total_songs: SONGS.length,
      total_listens: totalListens,
      live_app_listens: liveAppListens,
      imported_scrobbles: importedScrobbles,
      aggregated_plays: aggPlays,
      total_ratings: RATINGS.length,
    }]];
  }

  // 33. Analytics: Global active users (Badged with source_namespace)
  if (norm.includes('group by u.id, u.username')) {
    const rows = USERS.map(u => {
      const count = LISTENING_HISTORY.filter(lh => lh.user_id === u.id).length;
      return {
        id: u.id,
        username: u.username,
        source_namespace: u.source_namespace || 'local',
        total_listens: count,
      };
    }).sort((a, b) => b.total_listens - a.total_listens);
    return [rows];
  }

  // 34. Analytics: Global top rated songs (Based on verified ratings)
  if (norm.includes('having count(r.id)') || (norm.includes('avg(r.rating) as avg_rating') && norm.includes('from ratings r'))) {
    const ratingGroups = {};
    for (const r of RATINGS) {
      if (!ratingGroups[r.song_id]) ratingGroups[r.song_id] = [];
      ratingGroups[r.song_id].push(r.rating);
    }
    let entries = Object.entries(ratingGroups).filter(([_, arr]) => arr.length >= 1);
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
          source_namespace: 'local',
        };
      })
      .sort((a, b) => b.avg_rating - a.avg_rating || b.rating_count - a.rating_count)
      .slice(0, 10);
    return [rows];
  }

  return [[]];
}

/**
 * Multi-Strategy Adaptive Recommendation Engine
 * - Evaluates Collaborative Filtering only when interaction overlap exists
 * - Evaluates Content-Based Filtering only when relevant user features exist
 * - Gracefully provides a diversified Popularity Baseline for cold-start users
 * - Prevents repeatedly recommending tracks the user already listened to or rated
 * - Deduplicates by song.id and canonical (artist_id, title)
 * - Limits max 2 tracks per artist for diversity
 */
function computeRecommendations(userId, limit = 6) {
  const targetUserId = parseInt(userId);

  // 1. Target user interaction history
  const userListens = LISTENING_HISTORY.filter(lh => lh.user_id === targetUserId);
  const userRatings = RATINGS.filter(r => r.user_id === targetUserId);

  const listenedSongIds = new Set(userListens.map(lh => lh.song_id));
  const ratedSongIds = new Set(userRatings.map(r => r.song_id));
  const userInteractedSongIds = new Set([...listenedSongIds, ...ratedSongIds]);

  // Canonical keys already heard: artist_id + '::' + normalized_title
  const heardTrackKeys = new Set();
  for (const sId of userInteractedSongIds) {
    const s = SONGS.find(song => song.id === sId);
    if (s) {
      heardTrackKeys.add(`${s.artist_id}::${s.title.trim().toLowerCase()}`);
    }
  }

  // Helper to fetch actual song stats from real data without dummy fallback values
  function getSongStats(songId) {
    const directPlays = LISTENING_HISTORY.filter(lh => lh.song_id === songId).length;
    const aggPlays = AGGREGATED_COUNTS.filter(ac => ac.song_id === songId).reduce((s, c) => s + c.play_count, 0);
    const songRatings = RATINGS.filter(r => r.song_id === songId);
    const ratingCount = songRatings.length;
    const avgRating = ratingCount > 0 ? (songRatings.reduce((sum, r) => sum + r.rating, 0) / ratingCount) : 0;
    return {
      totalPlays: directPlays + aggPlays,
      directPlays,
      ratingCount,
      avgRating,
    };
  }

  // 2. COLLABORATIVE FILTERING EVALUATION
  // Requires: target user has >= 2 interactions AND has overlapping interactions with other users
  let cfCandidates = [];
  let useCF = false;

  if (userInteractedSongIds.size >= 2) {
    const otherUserIds = new Set();
    for (const lh of LISTENING_HISTORY) {
      if (lh.user_id !== targetUserId) otherUserIds.add(lh.user_id);
    }
    for (const r of RATINGS) {
      if (r.user_id !== targetUserId) otherUserIds.add(r.user_id);
    }

    const peerSimilarities = [];
    for (const peerId of otherUserIds) {
      const peerListens = new Set(LISTENING_HISTORY.filter(lh => lh.user_id === peerId).map(lh => lh.song_id));
      const peerRatings = new Set(RATINGS.filter(r => r.user_id === peerId).map(r => r.song_id));
      const peerSongs = new Set([...peerListens, ...peerRatings]);

      let intersection = 0;
      for (const sId of userInteractedSongIds) {
        if (peerSongs.has(sId)) intersection++;
      }

      if (intersection >= 1) {
        const union = new Set([...userInteractedSongIds, ...peerSongs]).size;
        const similarity = union > 0 ? (intersection / union) : 0;
        if (similarity > 0) {
          peerSimilarities.push({ peerId, similarity, peerSongs });
        }
      }
    }

    if (peerSimilarities.length > 0) {
      const cfScores = new Map();
      for (const { peerId, similarity } of peerSimilarities) {
        const peerRated = RATINGS.filter(r => r.user_id === peerId && r.rating >= 3);
        const peerPlays = LISTENING_HISTORY.filter(lh => lh.user_id === peerId);
        const playCounts = {};
        for (const p of peerPlays) playCounts[p.song_id] = (playCounts[p.song_id] || 0) + 1;

        const peerPositiveSongs = new Set([
          ...peerRated.map(r => r.song_id),
          ...Object.keys(playCounts).filter(sId => playCounts[sId] >= 1).map(Number)
        ]);

        for (const sId of peerPositiveSongs) {
          if (userInteractedSongIds.has(sId)) continue;
          const s = SONGS.find(song => song.id === sId);
          if (!s) continue;
          const trackKey = `${s.artist_id}::${s.title.trim().toLowerCase()}`;
          if (heardTrackKeys.has(trackKey)) continue;

          const ratingObj = peerRated.find(r => r.song_id === sId);
          const peerWeight = ratingObj ? ratingObj.rating : (1 + Math.log(1 + (playCounts[sId] || 1)));
          const itemScore = similarity * peerWeight;

          if (!cfScores.has(sId)) {
            cfScores.set(sId, { songId: sId, score: 0, peers: 0 });
          }
          const curr = cfScores.get(sId);
          curr.score += itemScore;
          curr.peers += 1;
        }
      }

      if (cfScores.size >= Math.min(3, limit)) {
        useCF = true;
        cfCandidates = Array.from(cfScores.values())
          .sort((a, b) => b.score - a.score)
          .map(item => item.songId);
      }
    }
  }

  // 3. CONTENT-BASED FILTERING EVALUATION
  // Requires: target user has >= 1 interaction with identifiable artist or genre features
  let cbCandidates = [];
  let useCB = false;

  if (userInteractedSongIds.size >= 1) {
    const artistScores = {};
    const genreScores = {};

    for (const lh of userListens) {
      const s = SONGS.find(song => song.id === lh.song_id);
      if (s) {
        artistScores[s.artist_id] = (artistScores[s.artist_id] || 0) + 1.0;
        genreScores[s.genre_id] = (genreScores[s.genre_id] || 0) + 1.0;
      }
    }
    for (const r of userRatings) {
      const s = SONGS.find(song => song.id === r.song_id);
      if (s) {
        const ratingWeight = r.rating >= 4 ? 2.5 : (r.rating === 3 ? 1.0 : -1.0);
        artistScores[s.artist_id] = (artistScores[s.artist_id] || 0) + ratingWeight;
        genreScores[s.genre_id] = (genreScores[s.genre_id] || 0) + ratingWeight;
      }
    }

    const topArtistIds = Object.entries(artistScores).filter(([_, sc]) => sc > 0).sort((a, b) => b[1] - a[1]).map(([aid]) => parseInt(aid));
    const topGenreIds = Object.entries(genreScores).filter(([_, sc]) => sc > 0).sort((a, b) => b[1] - a[1]).map(([gid]) => parseInt(gid));

    if (topArtistIds.length > 0 || topGenreIds.length > 0) {
      useCB = true;
      const scoredCB = [];
      for (const s of SONGS) {
        if (userInteractedSongIds.has(s.id)) continue;
        const trackKey = `${s.artist_id}::${s.title.trim().toLowerCase()}`;
        if (heardTrackKeys.has(trackKey)) continue;

        const artistAffinity = artistScores[s.artist_id] || 0;
        const genreAffinity = genreScores[s.genre_id] || 0;
        if (artistAffinity <= 0 && genreAffinity <= 0) continue;

        const stats = getSongStats(s.id);
        const popularityBonus = Math.log(1 + stats.totalPlays);
        const ratingBonus = stats.ratingCount > 0 ? (stats.avgRating * (stats.ratingCount / (stats.ratingCount + 2))) : 0;
        const score = (artistAffinity * 3.5) + (genreAffinity * 1.8) + popularityBonus + ratingBonus;

        let reason = '';
        if (artistAffinity > 0 && genreAffinity > 0) {
          const a = ARTISTS.find(art => art.id === s.artist_id);
          reason = `Because you enjoy ${a ? a.name : 'this artist'}`;
        } else if (artistAffinity > 0) {
          const a = ARTISTS.find(art => art.id === s.artist_id);
          reason = `More from ${a ? a.name : 'this artist'}`;
        } else {
          const g = GENRES.find(gen => gen.id === s.genre_id);
          reason = `Popular in your preferred genre ${g ? g.name : 'General'}`;
        }

        scoredCB.push({ songId: s.id, score, reason });
      }

      scoredCB.sort((a, b) => b.score - a.score);
      cbCandidates = scoredCB;
    }
  }

  // 4. POPULARITY BASELINE (Ground truth catalog engagement without dummy numbers)
  const scoredBaseline = SONGS
    .filter(s => !userInteractedSongIds.has(s.id))
    .map(s => {
      const stats = getSongStats(s.id);
      const ratingScore = stats.ratingCount > 0 ? (stats.avgRating * (stats.ratingCount / (stats.ratingCount + 2))) : 0;
      const score = Math.log(1 + stats.totalPlays) + ratingScore;
      return { songId: s.id, genreId: s.genre_id, artistId: s.artist_id, score, totalPlays: stats.totalPlays };
    })
    .sort((a, b) => b.score - a.score);

  // 5. ASSEMBLE CANDIDATES & DETERMINE STRATEGY
  const chosenSongs = [];
  let activeStrategy = 'popularity_baseline';
  let isPersonalized = false;
  let userState = userInteractedSongIds.size === 0 ? 'cold_start' : 'active';
  let explanation = '';

  const seenTrackKeys = new Set();
  const artistTrackCounts = {};

  function tryAddCandidate(sId, strategyName, reason) {
    const s = SONGS.find(song => song.id === sId);
    if (!s) return false;
    const trackKey = `${s.artist_id}::${s.title.trim().toLowerCase()}`;
    if (heardTrackKeys.has(trackKey) || seenTrackKeys.has(trackKey)) return false;
    if ((artistTrackCounts[s.artist_id] || 0) >= 2) return false;

    seenTrackKeys.add(trackKey);
    artistTrackCounts[s.artist_id] = (artistTrackCounts[s.artist_id] || 0) + 1;

    const artist = ARTISTS.find(a => a.id === s.artist_id) || {};
    const genre = GENRES.find(g => g.id === s.genre_id) || {};
    const stats = getSongStats(s.id);

    chosenSongs.push({
      id: s.id,
      title: s.title,
      album: s.album,
      duration_seconds: s.duration_seconds,
      cover_url: null,
      release_date: s.release_date,
      artist_name: artist.name || 'Unknown Artist',
      artist_id: artist.id,
      genre_name: genre.name || 'General',
      genre_id: genre.id,
      play_count: stats.totalPlays,
      avg_rating: stats.avgRating,
      rating_count: stats.ratingCount,
      recommendation_reason: reason,
      strategy: strategyName,
      is_personalized: strategyName !== 'popularity_baseline',
    });
    return true;
  }

  if (useCF && cfCandidates.length >= Math.min(3, limit)) {
    activeStrategy = 'collaborative_filtering';
    isPersonalized = true;
    explanation = 'Personalized recommendations based on listeners with overlapping musical tastes to yours';

    for (const sId of cfCandidates) {
      if (chosenSongs.length >= limit) break;
      tryAddCandidate(sId, 'collaborative_filtering', 'Recommended by listeners with overlapping taste');
    }
    // Backfill with content-based if needed
    if (chosenSongs.length < limit && useCB) {
      for (const cand of cbCandidates) {
        if (chosenSongs.length >= limit) break;
        tryAddCandidate(cand.songId, 'content_based', cand.reason);
      }
    }
  } else if (useCB && cbCandidates.length > 0) {
    activeStrategy = 'content_based';
    isPersonalized = true;
    explanation = 'Personalized recommendations based on your affinity for top artists and genres';

    for (const cand of cbCandidates) {
      if (chosenSongs.length >= limit) break;
      tryAddCandidate(cand.songId, 'content_based', cand.reason);
    }
  } else {
    activeStrategy = 'popularity_baseline';
    isPersonalized = false;
    explanation = userState === 'cold_start'
      ? 'Platform Baseline: Popular and trending tracks across diverse genres (New listener baseline)'
      : 'Platform Baseline: Top trending catalog tracks across genres';
  }

  // If needed, backfill with diverse Popularity Baseline
  if (chosenSongs.length < limit) {
    const genreBuckets = {};
    for (const item of scoredBaseline) {
      if (!genreBuckets[item.genreId]) genreBuckets[item.genreId] = [];
      genreBuckets[item.genreId].push(item.songId);
    }
    const gIds = Object.keys(genreBuckets);
    let pass = 0;
    let addedInPass = true;
    while (chosenSongs.length < limit && addedInPass && pass < 10) {
      addedInPass = false;
      for (const gid of gIds) {
        if (chosenSongs.length >= limit) break;
        const sId = genreBuckets[gid][pass];
        if (sId) {
          const g = GENRES.find(gen => gen.id === parseInt(gid));
          const reason = `Platform popular track in ${g ? g.name : 'General'}`;
          if (tryAddCandidate(sId, 'popularity_baseline', reason)) {
            addedInPass = true;
          }
        }
      }
      pass++;
    }
    // Fallback if still under limit
    for (const item of scoredBaseline) {
      if (chosenSongs.length >= limit) break;
      const g = GENRES.find(gen => gen.id === item.genreId);
      tryAddCandidate(item.songId, 'popularity_baseline', `Popular catalog track in ${g ? g.name : 'General'}`);
    }
  }

  return {
    recommendations: chosenSongs.slice(0, limit),
    strategy: activeStrategy,
    is_personalized: isPersonalized,
    user_state: userState,
    explanation,
    count: chosenSongs.length,
  };
}

module.exports = { executeMockQuery, computeRecommendations };
