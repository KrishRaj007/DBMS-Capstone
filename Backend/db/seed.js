/**
 * Seed script — populates the database with demo data.
 * Run:  npm run seed
 */
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const GENRES = [
  { name: 'Pop',        description: 'Popular mainstream music with catchy melodies' },
  { name: 'Rock',       description: 'Guitar-driven music with powerful rhythms' },
  { name: 'Hip-Hop',    description: 'Rhythmic music with spoken-word vocals' },
  { name: 'R&B',        description: 'Rhythm and blues with soulful vocals' },
  { name: 'Electronic', description: 'Synthesizer-based music and beats' },
  { name: 'Jazz',       description: 'Improvisational music with complex harmonies' },
  { name: 'Classical',  description: 'Orchestral and composed instrumental music' },
  { name: 'Country',    description: 'Story-driven music with acoustic instruments' },
  { name: 'Indie',      description: 'Independent alternative music' },
  { name: 'Metal',      description: 'Heavy, amplified rock music' },
];

const ARTISTS = [
  { name: 'Luna Nova',           bio: 'Chart-topping pop sensation known for electrifying live shows.' },
  { name: 'The Midnight Riders', bio: 'Classic rock band blending vintage riffs with modern production.' },
  { name: 'DJ Phantom',          bio: 'Electronic producer and DJ pushing the boundaries of dance music.' },
  { name: 'Aria Sterling',       bio: 'Soulful R&B vocalist with a four-octave range.' },
  { name: 'Marcus Cole',         bio: 'Lyrical hip-hop artist known for storytelling and wordplay.' },
  { name: 'The Jazz Collective', bio: 'Ensemble bringing contemporary jazz to new audiences.' },
  { name: 'Elena Vasquez',       bio: 'Classical pianist and composer with international acclaim.' },
  { name: 'Dusty Roads',         bio: 'Country singer-songwriter capturing life on the open road.' },
  { name: 'Echo Chamber',        bio: 'Indie band crafting atmospheric soundscapes.' },
  { name: 'Iron Thunder',        bio: 'Heavy metal powerhouse with thunderous riffs.' },
  { name: 'Skyline',             bio: 'Pop duo blending synth-pop with heartfelt lyrics.' },
  { name: 'Velvet Storm',        bio: 'Alternative rock band with an edgy, emotional sound.' },
  { name: 'Neon Pulse',          bio: 'Electronic artist fusing retro synths with modern beats.' },
  { name: 'Jasmine Ray',         bio: 'Neo-soul and R&B singer exploring love and identity.' },
  { name: 'King Verse',          bio: 'Hip-hop artist blending trap beats with conscious lyrics.' },
  { name: 'Blue Note Trio',      bio: 'Jazz trio reviving the golden age of cool jazz.' },
  { name: 'Sophia Chen',         bio: 'Classically trained violinist with a contemporary edge.' },
  { name: 'Wildflower',          bio: 'Country-folk artist with an earthy, authentic voice.' },
  { name: 'Paper Planes',        bio: 'Indie-pop band with jangly guitars and dreamy vocals.' },
  { name: 'Dark Horizon',        bio: 'Progressive metal band with complex compositions.' },
];

// genre index (1-based) maps to GENRES array
const SONGS = [
  // Pop (genre 1) — artists 1, 11
  { title: 'Starlight Boulevard',   artist: 1,  genre: 1,  album: 'Neon Dreams',        duration: 214, date: '2024-03-15' },
  { title: 'Electric Hearts',       artist: 1,  genre: 1,  album: 'Neon Dreams',        duration: 198, date: '2024-03-15' },
  { title: 'Dancing in the Glow',   artist: 1,  genre: 1,  album: 'Midnight Sun',       duration: 227, date: '2023-08-20' },
  { title: 'City Lights',           artist: 11, genre: 1,  album: 'Horizons',           duration: 203, date: '2024-01-10' },
  { title: 'Golden Hour',           artist: 11, genre: 1,  album: 'Horizons',           duration: 189, date: '2024-01-10' },
  { title: 'Paper Moon',            artist: 11, genre: 1,  album: 'Horizons',           duration: 241, date: '2024-01-10' },

  // Rock (genre 2) — artists 2, 12
  { title: 'Highway Thunder',       artist: 2,  genre: 2,  album: 'Rebel Heart',        duration: 265, date: '2023-11-05' },
  { title: 'Burning Bridges',       artist: 2,  genre: 2,  album: 'Rebel Heart',        duration: 298, date: '2023-11-05' },
  { title: 'Iron Will',             artist: 2,  genre: 2,  album: 'Steel & Stone',      duration: 312, date: '2022-06-18' },
  { title: 'Shattered Glass',       artist: 12, genre: 2,  album: 'Tempest',            duration: 245, date: '2024-02-28' },
  { title: 'Echoes of Tomorrow',    artist: 12, genre: 2,  album: 'Tempest',            duration: 278, date: '2024-02-28' },
  { title: 'Storm Chaser',          artist: 12, genre: 2,  album: 'Tempest',            duration: 255, date: '2024-02-28' },

  // Hip-Hop (genre 3) — artists 5, 15
  { title: 'Crown & Glory',         artist: 5,  genre: 3,  album: 'The Blueprint',      duration: 232, date: '2024-04-01' },
  { title: 'Street Wisdom',         artist: 5,  genre: 3,  album: 'The Blueprint',      duration: 201, date: '2024-04-01' },
  { title: 'Concrete Jungle',       artist: 5,  genre: 3,  album: 'Urban Tales',        duration: 218, date: '2023-05-12' },
  { title: 'Royal Decree',          artist: 15, genre: 3,  album: 'Throne Room',        duration: 195, date: '2024-06-15' },
  { title: 'Midnight Hustle',       artist: 15, genre: 3,  album: 'Throne Room',        duration: 210, date: '2024-06-15' },
  { title: 'Legacy',                artist: 15, genre: 3,  album: 'Throne Room',        duration: 248, date: '2024-06-15' },

  // R&B (genre 4) — artists 4, 14
  { title: 'Velvet Sky',            artist: 4,  genre: 4,  album: 'Silk & Soul',        duration: 256, date: '2024-02-14' },
  { title: 'Slow Burn',             artist: 4,  genre: 4,  album: 'Silk & Soul',        duration: 234, date: '2024-02-14' },
  { title: 'Moonlit Serenade',      artist: 4,  genre: 4,  album: 'After Hours',        duration: 279, date: '2023-09-01' },
  { title: 'Ocean Eyes',            artist: 14, genre: 4,  album: 'Dusk Till Dawn',     duration: 223, date: '2024-05-20' },
  { title: 'Tender Love',           artist: 14, genre: 4,  album: 'Dusk Till Dawn',     duration: 245, date: '2024-05-20' },
  { title: 'Butterflies',           artist: 14, genre: 4,  album: 'Dusk Till Dawn',     duration: 198, date: '2024-05-20' },

  // Electronic (genre 5) — artists 3, 13
  { title: 'Neon Nights',           artist: 3,  genre: 5,  album: 'Digital Dreams',     duration: 342, date: '2024-01-20' },
  { title: 'Pulse Wave',            artist: 3,  genre: 5,  album: 'Digital Dreams',     duration: 385, date: '2024-01-20' },
  { title: 'Cyber Dawn',            artist: 3,  genre: 5,  album: 'Binary Sunset',      duration: 298, date: '2023-07-07' },
  { title: 'Retrowave',             artist: 13, genre: 5,  album: 'Synthwave City',     duration: 312, date: '2024-03-30' },
  { title: 'Digital Love',          artist: 13, genre: 5,  album: 'Synthwave City',     duration: 276, date: '2024-03-30' },
  { title: 'Future Shock',          artist: 13, genre: 5,  album: 'Synthwave City',     duration: 334, date: '2024-03-30' },

  // Jazz (genre 6) — artists 6, 16
  { title: 'Blue Monday',           artist: 6,  genre: 6,  album: 'Late Night Sessions', duration: 367, date: '2023-10-15' },
  { title: 'Satin Smooth',          artist: 6,  genre: 6,  album: 'Late Night Sessions', duration: 289, date: '2023-10-15' },
  { title: 'Impromptu No. 5',       artist: 6,  genre: 6,  album: 'Free Flow',          duration: 423, date: '2022-12-01' },
  { title: 'Midnight in Manhattan',  artist: 16, genre: 6,  album: 'City Blues',         duration: 301, date: '2024-04-18' },
  { title: 'Cool Breeze',           artist: 16, genre: 6,  album: 'City Blues',         duration: 267, date: '2024-04-18' },
  { title: 'Swing Time',            artist: 16, genre: 6,  album: 'City Blues',         duration: 245, date: '2024-04-18' },

  // Classical (genre 7) — artists 7, 17
  { title: 'Sonata in D Minor',     artist: 7,  genre: 7,  album: 'Nocturnes',          duration: 480, date: '2023-03-25' },
  { title: 'Prelude to Dawn',       artist: 7,  genre: 7,  album: 'Nocturnes',          duration: 356, date: '2023-03-25' },
  { title: 'Elegy for Strings',     artist: 7,  genre: 7,  album: 'Reflections',        duration: 512, date: '2022-09-10' },
  { title: 'Autumn Concerto',       artist: 17, genre: 7,  album: 'Four Seasons Reimagined', duration: 445, date: '2024-07-01' },
  { title: 'Whispers of Vienna',    artist: 17, genre: 7,  album: 'Four Seasons Reimagined', duration: 398, date: '2024-07-01' },
  { title: 'Midnight Waltz',        artist: 17, genre: 7,  album: 'Four Seasons Reimagined', duration: 367, date: '2024-07-01' },

  // Country (genre 8) — artists 8, 18
  { title: 'Dirt Road Anthem',      artist: 8,  genre: 8,  album: 'Backroads',          duration: 223, date: '2023-12-10' },
  { title: 'Sunset Porch',          artist: 8,  genre: 8,  album: 'Backroads',          duration: 198, date: '2023-12-10' },
  { title: 'Old Pickup Truck',      artist: 8,  genre: 8,  album: 'Simple Life',        duration: 245, date: '2023-04-14' },
  { title: 'Meadow Song',           artist: 18, genre: 8,  album: 'Wild Petals',        duration: 212, date: '2024-05-05' },
  { title: 'Campfire Stories',      artist: 18, genre: 8,  album: 'Wild Petals',        duration: 234, date: '2024-05-05' },
  { title: 'Morning Dew',           artist: 18, genre: 8,  album: 'Wild Petals',        duration: 189, date: '2024-05-05' },

  // Indie (genre 9) — artists 9, 19
  { title: 'Faded Polaroids',       artist: 9,  genre: 9,  album: 'Lo-Fi Diaries',      duration: 234, date: '2024-02-10' },
  { title: 'Rooftop View',          artist: 9,  genre: 9,  album: 'Lo-Fi Diaries',      duration: 198, date: '2024-02-10' },
  { title: 'Analog Days',           artist: 9,  genre: 9,  album: 'Warm Tones',         duration: 256, date: '2023-06-22' },
  { title: 'Sunday Morning',        artist: 19, genre: 9,  album: 'Postcards',          duration: 201, date: '2024-08-12' },
  { title: 'Wishing Well',          artist: 19, genre: 9,  album: 'Postcards',          duration: 218, date: '2024-08-12' },
  { title: 'Paper Airplanes',       artist: 19, genre: 9,  album: 'Postcards',          duration: 187, date: '2024-08-12' },

  // Metal (genre 10) — artists 10, 20
  { title: 'Wrath Unchained',       artist: 10, genre: 10, album: 'Forged in Fire',     duration: 345, date: '2023-10-31' },
  { title: 'Crimson Fury',          artist: 10, genre: 10, album: 'Forged in Fire',     duration: 312, date: '2023-10-31' },
  { title: 'Titan\'s Fall',         artist: 10, genre: 10, album: 'Apocalypse',         duration: 378, date: '2022-08-15' },
  { title: 'Abyssal Gate',          artist: 20, genre: 10, album: 'Event Horizon',      duration: 401, date: '2024-06-06' },
  { title: 'Singularity',           artist: 20, genre: 10, album: 'Event Horizon',      duration: 356, date: '2024-06-06' },
  { title: 'Void Walker',           artist: 20, genre: 10, album: 'Event Horizon',      duration: 423, date: '2024-06-06' },
];

const USERS = [
  { username: 'john_doe',   email: 'john@example.com',  password: 'password123' },
  { username: 'jane_smith', email: 'jane@example.com',   password: 'password123' },
  { username: 'music_lover', email: 'music@example.com', password: 'password123' },
];

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'music_analytics',
    multipleStatements: true,
  });

  try {
    console.log('🌱 Seeding database (preserving existing user records and application relationships)...\n');

    // Genres
    for (const g of GENRES) {
      await conn.query('INSERT INTO genres (name, description) VALUES (?, ?)', [g.name, g.description]);
    }
    console.log(`✓ Inserted ${GENRES.length} genres`);

    // Artists
    for (const a of ARTISTS) {
      await conn.query('INSERT INTO artists (name, bio) VALUES (?, ?)', [a.name, a.bio]);
    }
    console.log(`✓ Inserted ${ARTISTS.length} artists`);

    // Songs
    for (const s of SONGS) {
      await conn.query(
        'INSERT INTO songs (title, artist_id, genre_id, album, duration_seconds, release_date) VALUES (?, ?, ?, ?, ?, ?)',
        [s.title, s.artist, s.genre, s.album, s.duration, s.date]
      );
    }
    console.log(`✓ Inserted ${SONGS.length} songs`);

    // Users
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [u.username, u.email, hash]
      );
    }
    console.log(`✓ Inserted ${USERS.length} users`);

    // Listening history — random listens for demo users
    const [songRows] = await conn.query('SELECT id, duration_seconds FROM songs');
    let listenCount = 0;

    for (let userId = 1; userId <= 3; userId++) {
      const numListens = 30 + Math.floor(Math.random() * 40); // 30-70 listens per user
      for (let i = 0; i < numListens; i++) {
        const song = songRows[Math.floor(Math.random() * songRows.length)];
        const daysAgo = Math.floor(Math.random() * 90);
        const hoursAgo = Math.floor(Math.random() * 24);
        const listened = Math.floor(song.duration_seconds * (0.5 + Math.random() * 0.5));
        await conn.query(
          'INSERT INTO listening_history (user_id, song_id, listened_at, duration_listened) VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR), ?)',
          [userId, song.id, daysAgo * 24 + hoursAgo, listened]
        );
        listenCount++;
      }
    }
    console.log(`✓ Inserted ${listenCount} listening history records`);

    // Ratings — random ratings for demo users
    let ratingCount = 0;
    for (let userId = 1; userId <= 3; userId++) {
      const songsToRate = songRows
        .sort(() => Math.random() - 0.5)
        .slice(0, 15 + Math.floor(Math.random() * 15)); // 15-30 ratings per user
      for (const song of songsToRate) {
        const rating = Math.ceil(Math.random() * 5);
        try {
          await conn.query(
            'INSERT INTO ratings (user_id, song_id, rating) VALUES (?, ?, ?)',
            [userId, song.id, rating]
          );
          ratingCount++;
        } catch (e) {
          // skip duplicate
        }
      }
    }
    console.log(`✓ Inserted ${ratingCount} ratings`);

    // Playlists
    const playlists = [
      { userId: 1, name: 'Chill Vibes',     desc: 'Relaxing tracks for a chill evening',    songs: [1, 4, 19, 22, 49] },
      { userId: 1, name: 'Workout Mix',     desc: 'High-energy tracks to pump you up',      songs: [7, 8, 55, 56, 13] },
      { userId: 2, name: 'Late Night Jazz',  desc: 'Smooth jazz for late-night listening',   songs: [31, 32, 33, 34, 35] },
      { userId: 2, name: 'Indie Favorites',  desc: 'Best indie tracks hand-picked',          songs: [49, 50, 51, 52, 53] },
      { userId: 3, name: 'Everything Mix',   desc: 'A little bit of everything',             songs: [1, 7, 13, 19, 25, 31, 37, 43, 49, 55] },
    ];

    for (const pl of playlists) {
      const [result] = await conn.query(
        'INSERT INTO playlists (user_id, name, description) VALUES (?, ?, ?)',
        [pl.userId, pl.name, pl.desc]
      );
      const plId = result.insertId;
      for (let i = 0; i < pl.songs.length; i++) {
        try {
          await conn.query(
            'INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
            [plId, pl.songs[i], i + 1]
          );
        } catch (e) {
          // skip if song id doesn't exist
        }
      }
    }
    console.log(`✓ Inserted ${playlists.length} playlists`);

    // Update preferences via stored procedure
    for (let userId = 1; userId <= 3; userId++) {
      await conn.query('CALL sp_update_preferences(?)', [userId]);
    }
    console.log('✓ Updated user preferences\n');

    console.log('🎉 Seeding complete!');
    console.log('   Demo accounts:');
    console.log('   • john_doe   / password123');
    console.log('   • jane_smith / password123');
    console.log('   • music_lover / password123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  } finally {
    await conn.end();
  }
}

seed();
