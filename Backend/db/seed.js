/**
 * Seed script — populates the database with demo data idempotently.
 * Preserves existing users and Last.fm records; avoids duplicates.
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

const SONGS = [
  // Pop (genre 1)
  { title: 'Starlight Boulevard',   artistName: 'Luna Nova',           genreName: 'Pop', album: 'Neon Dreams', duration: 214, date: '2024-03-15' },
  { title: 'Electric Hearts',       artistName: 'Luna Nova',           genreName: 'Pop', album: 'Neon Dreams', duration: 198, date: '2024-03-15' },
  { title: 'Dancing in the Glow',   artistName: 'Luna Nova',           genreName: 'Pop', album: 'Midnight Sun', duration: 227, date: '2023-08-20' },
  { title: 'City Lights',           artistName: 'Skyline',             genreName: 'Pop', album: 'Horizons', duration: 203, date: '2024-01-10' },
  { title: 'Golden Hour',           artistName: 'Skyline',             genreName: 'Pop', album: 'Horizons', duration: 189, date: '2024-01-10' },
  { title: 'Paper Moon',            artistName: 'Skyline',             genreName: 'Pop', album: 'Horizons', duration: 241, date: '2024-01-10' },

  // Rock (genre 2)
  { title: 'Highway Thunder',       artistName: 'The Midnight Riders', genreName: 'Rock', album: 'Rebel Heart', duration: 265, date: '2023-11-05' },
  { title: 'Burning Bridges',       artistName: 'The Midnight Riders', genreName: 'Rock', album: 'Rebel Heart', duration: 298, date: '2023-11-05' },
  { title: 'Iron Will',             artistName: 'The Midnight Riders', genreName: 'Rock', album: 'Steel & Stone', duration: 312, date: '2022-06-18' },
  { title: 'Shattered Glass',       artistName: 'Velvet Storm',        genreName: 'Rock', album: 'Tempest', duration: 245, date: '2024-02-28' },
  { title: 'Echoes of Tomorrow',    artistName: 'Velvet Storm',        genreName: 'Rock', album: 'Tempest', duration: 278, date: '2024-02-28' },
  { title: 'Storm Chaser',          artistName: 'Velvet Storm',        genreName: 'Rock', album: 'Tempest', duration: 255, date: '2024-02-28' },

  // Hip-Hop (genre 3)
  { title: 'Crown & Glory',         artistName: 'Marcus Cole',         genreName: 'Hip-Hop', album: 'The Blueprint', duration: 232, date: '2024-04-01' },
  { title: 'Street Wisdom',         artistName: 'Marcus Cole',         genreName: 'Hip-Hop', album: 'The Blueprint', duration: 201, date: '2024-04-01' },
  { title: 'Concrete Jungle',       artistName: 'Marcus Cole',         genreName: 'Hip-Hop', album: 'Urban Tales', duration: 218, date: '2023-05-12' },
  { title: 'Royal Decree',          artistName: 'King Verse',          genreName: 'Hip-Hop', album: 'Throne Room', duration: 195, date: '2024-06-15' },
  { title: 'Midnight Hustle',       artistName: 'King Verse',          genreName: 'Hip-Hop', album: 'Throne Room', duration: 210, date: '2024-06-15' },
  { title: 'Legacy',                artistName: 'King Verse',          genreName: 'Hip-Hop', album: 'Throne Room', duration: 248, date: '2024-06-15' },

  // R&B (genre 4)
  { title: 'Velvet Sky',            artistName: 'Aria Sterling',       genreName: 'R&B', album: 'Silk & Soul', duration: 256, date: '2024-02-14' },
  { title: 'Slow Burn',             artistName: 'Aria Sterling',       genreName: 'R&B', album: 'Silk & Soul', duration: 234, date: '2024-02-14' },
  { title: 'Moonlit Serenade',      artistName: 'Aria Sterling',       genreName: 'R&B', album: 'After Hours', duration: 279, date: '2023-09-01' },
  { title: 'Ocean Eyes',            artistName: 'Jasmine Ray',         genreName: 'R&B', album: 'Dusk Till Dawn', duration: 223, date: '2024-05-20' },
  { title: 'Tender Love',           artistName: 'Jasmine Ray',         genreName: 'R&B', album: 'Dusk Till Dawn', duration: 245, date: '2024-05-20' },
  { title: 'Butterflies',           artistName: 'Jasmine Ray',         genreName: 'R&B', album: 'Dusk Till Dawn', duration: 198, date: '2024-05-20' },

  // Electronic (genre 5)
  { title: 'Neon Nights',           artistName: 'DJ Phantom',          genreName: 'Electronic', album: 'Digital Dreams', duration: 342, date: '2024-01-20' },
  { title: 'Pulse Wave',            artistName: 'DJ Phantom',          genreName: 'Electronic', album: 'Digital Dreams', duration: 385, date: '2024-01-20' },
  { title: 'Cyber Dawn',            artistName: 'DJ Phantom',          genreName: 'Electronic', album: 'Binary Sunset', duration: 298, date: '2023-07-07' },
  { title: 'Retrowave',             artistName: 'Neon Pulse',          genreName: 'Electronic', album: 'Synthwave City', duration: 312, date: '2024-03-30' },
  { title: 'Digital Love',          artistName: 'Neon Pulse',          genreName: 'Electronic', album: 'Synthwave City', duration: 276, date: '2024-03-30' },
  { title: 'Future Shock',          artistName: 'Neon Pulse',          genreName: 'Electronic', album: 'Synthwave City', duration: 334, date: '2024-03-30' },

  // Jazz (genre 6)
  { title: 'Blue Monday',           artistName: 'The Jazz Collective', genreName: 'Jazz', album: 'Late Night Sessions', duration: 367, date: '2023-10-15' },
  { title: 'Satin Smooth',          artistName: 'The Jazz Collective', genreName: 'Jazz', album: 'Late Night Sessions', duration: 289, date: '2023-10-15' },
  { title: 'Impromptu No. 5',       artistName: 'The Jazz Collective', genreName: 'Jazz', album: 'Free Flow', duration: 423, date: '2022-12-01' },
  { title: 'Midnight in Manhattan', artistName: 'Blue Note Trio',      genreName: 'Jazz', album: 'City Blues', duration: 301, date: '2024-04-18' },
  { title: 'Cool Breeze',           artistName: 'Blue Note Trio',      genreName: 'Jazz', album: 'City Blues', duration: 267, date: '2024-04-18' },
  { title: 'Swing Time',            artistName: 'Blue Note Trio',      genreName: 'Jazz', album: 'City Blues', duration: 245, date: '2024-04-18' },

  // Classical (genre 7)
  { title: 'Sonata in D Minor',     artistName: 'Elena Vasquez',       genreName: 'Classical', album: 'Nocturnes', duration: 480, date: '2023-03-25' },
  { title: 'Prelude to Dawn',       artistName: 'Elena Vasquez',       genreName: 'Classical', album: 'Nocturnes', duration: 356, date: '2023-03-25' },
  { title: 'Elegy for Strings',     artistName: 'Elena Vasquez',       genreName: 'Classical', album: 'Reflections', duration: 512, date: '2022-09-10' },
  { title: 'Autumn Concerto',       artistName: 'Sophia Chen',         genreName: 'Classical', album: 'Four Seasons', duration: 445, date: '2024-07-01' },
  { title: 'Whispers of Vienna',    artistName: 'Sophia Chen',         genreName: 'Classical', album: 'Four Seasons', duration: 398, date: '2024-07-01' },
  { title: 'Midnight Waltz',        artistName: 'Sophia Chen',         genreName: 'Classical', album: 'Four Seasons', duration: 367, date: '2024-07-01' },

  // Country (genre 8)
  { title: 'Dirt Road Anthem',      artistName: 'Dusty Roads',         genreName: 'Country', album: 'Backroads', duration: 223, date: '2023-12-10' },
  { title: 'Sunset Porch',          artistName: 'Dusty Roads',         genreName: 'Country', album: 'Backroads', duration: 198, date: '2023-12-10' },
  { title: 'Old Pickup Truck',      artistName: 'Dusty Roads',         genreName: 'Country', album: 'Simple Life', duration: 245, date: '2023-04-14' },
  { title: 'Meadow Song',           artistName: 'Wildflower',          genreName: 'Country', album: 'Wild Petals', duration: 212, date: '2024-05-05' },
  { title: 'Campfire Stories',      artistName: 'Wildflower',          genreName: 'Country', album: 'Wild Petals', duration: 234, date: '2024-05-05' },
  { title: 'Morning Dew',           artistName: 'Wildflower',          genreName: 'Country', album: 'Wild Petals', duration: 189, date: '2024-05-05' },

  // Indie (genre 9)
  { title: 'Faded Polaroids',       artistName: 'Echo Chamber',        genreName: 'Indie', album: 'Lo-Fi Diaries', duration: 234, date: '2024-02-10' },
  { title: 'Rooftop View',          artistName: 'Echo Chamber',        genreName: 'Indie', album: 'Lo-Fi Diaries', duration: 198, date: '2024-02-10' },
  { title: 'Analog Days',           artistName: 'Echo Chamber',        genreName: 'Indie', album: 'Warm Tones', duration: 256, date: '2023-06-22' },
  { title: 'Sunday Morning',        artistName: 'Paper Planes',        genreName: 'Indie', album: 'Postcards', duration: 201, date: '2024-08-12' },
  { title: 'Wishing Well',          artistName: 'Paper Planes',        genreName: 'Indie', album: 'Postcards', duration: 218, date: '2024-08-12' },
  { title: 'Paper Airplanes',       artistName: 'Paper Planes',        genreName: 'Indie', album: 'Postcards', duration: 187, date: '2024-08-12' },

  // Metal (genre 10)
  { title: 'Wrath Unchained',       artistName: 'Iron Thunder',        genreName: 'Metal', album: 'Forged in Fire', duration: 345, date: '2023-10-31' },
  { title: 'Crimson Fury',          artistName: 'Iron Thunder',        genreName: 'Metal', album: 'Forged in Fire', duration: 312, date: '2023-10-31' },
  { title: 'Titan\'s Fall',         artistName: 'Iron Thunder',        genreName: 'Metal', album: 'Apocalypse', duration: 378, date: '2022-08-15' },
  { title: 'Abyssal Gate',          artistName: 'Dark Horizon',        genreName: 'Metal', album: 'Event Horizon', duration: 401, date: '2024-06-06' },
  { title: 'Singularity',           artistName: 'Dark Horizon',        genreName: 'Metal', album: 'Event Horizon', duration: 356, date: '2024-06-06' },
  { title: 'Void Walker',           artistName: 'Dark Horizon',        genreName: 'Metal', album: 'Event Horizon', duration: 423, date: '2024-06-06' },
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
  });

  try {
    console.log('🌱 Idempotent Database Seeding (preserving Last.fm records and user data)...\n');

    // 1. Genres (ON DUPLICATE KEY UPDATE)
    for (const g of GENRES) {
      await conn.query(
        'INSERT INTO genres (name, description) VALUES (?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)',
        [g.name, g.description]
      );
    }
    console.log(`✓ Ensured ${GENRES.length} genres`);

    // Map genre names to IDs
    const [genreRows] = await conn.query('SELECT id, name FROM genres');
    const genreMap = {};
    for (const row of genreRows) {
      genreMap[row.name.toLowerCase()] = row.id;
    }

    // 2. Artists (Insert if not exists, tagged with source_namespace='local')
    for (const a of ARTISTS) {
      await conn.query(
        'INSERT INTO artists (name, bio, source_namespace) ' +
        'SELECT ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM artists WHERE LOWER(name) = LOWER(?))',
        [a.name, a.bio, a.name]
      );
    }
    console.log(`✓ Ensured ${ARTISTS.length} local artists`);

    // Map artist names to IDs
    const [artistRows] = await conn.query('SELECT id, name FROM artists');
    const artistMap = {};
    for (const row of artistRows) {
      artistMap[row.name.toLowerCase()] = row.id;
    }

    // 3. Songs (Insert if not exists, tagged with source_namespace='local')
    for (const s of SONGS) {
      const artistId = artistMap[s.artistName.toLowerCase()];
      const genreId = genreMap[s.genreName.toLowerCase()] || 1;
      if (!artistId) continue;

      await conn.query(
        'INSERT INTO songs (title, artist_id, genre_id, album, duration_seconds, release_date, source_namespace) ' +
        'SELECT ?, ?, ?, ?, ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM songs WHERE LOWER(title) = LOWER(?) AND artist_id = ?)',
        [s.title, artistId, genreId, s.album, s.duration, s.date, s.title, artistId]
      );
    }
    console.log(`✓ Ensured local baseline songs`);

    // 4. Users (Insert demo users if not exists)
    for (const u of USERS) {
      const hash = await bcrypt.hash(u.password, 10);
      await conn.query(
        'INSERT INTO users (username, email, password_hash, source_namespace) ' +
        'SELECT ?, ?, ?, "local" WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = ? OR email = ?)',
        [u.username, u.email, hash, u.username, u.email]
      );
    }
    console.log(`✓ Ensured ${USERS.length} demo users`);

    // Fetch user IDs for the demo users
    const [demoUsers] = await conn.query(
      'SELECT id, username FROM users WHERE username IN (?, ?, ?)',
      ['john_doe', 'jane_smith', 'music_lover']
    );
    const demoUserMap = {};
    for (const u of demoUsers) {
      demoUserMap[u.username] = u.id;
    }

    // 5. Listening history — seed only if demo user has 0 listens
    const [songList] = await conn.query('SELECT id, duration_seconds FROM songs WHERE source_namespace = "local"');

    for (const username of ['john_doe', 'jane_smith', 'music_lover']) {
      const userId = demoUserMap[username];
      if (!userId) continue;

      const [existingCount] = await conn.query(
        'SELECT COUNT(*) as count FROM listening_history WHERE user_id = ?',
        [userId]
      );

      if (existingCount[0].count === 0 && songList.length > 0) {
        const numListens = 35 + Math.floor(Math.random() * 20);
        for (let i = 0; i < numListens; i++) {
          const song = songList[Math.floor(Math.random() * songList.length)];
          const daysAgo = Math.floor(Math.random() * 60);
          const hoursAgo = Math.floor(Math.random() * 24);
          const listened = Math.floor(song.duration_seconds * (0.6 + Math.random() * 0.4));

          await conn.query(
            'INSERT INTO listening_history (user_id, song_id, listened_at, duration_listened, source_namespace) ' +
            'VALUES (?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR), ?, "local")',
            [userId, song.id, daysAgo * 24 + hoursAgo, listened]
          );
        }
        console.log(`  ✓ Seeded baseline listening history for ${username}`);
      } else {
        console.log(`  ℹ ${username} already has ${existingCount[0].count} listens — skipped re-seeding`);
      }
    }

    // 6. Ratings — seed only if demo user has 0 ratings
    for (const username of ['john_doe', 'jane_smith', 'music_lover']) {
      const userId = demoUserMap[username];
      if (!userId) continue;

      const [existingRatings] = await conn.query(
        'SELECT COUNT(*) as count FROM ratings WHERE user_id = ?',
        [userId]
      );

      if (existingRatings[0].count === 0 && songList.length > 0) {
        const songsToRate = [...songList].sort(() => Math.random() - 0.5).slice(0, 15);
        for (const song of songsToRate) {
          const rating = 3 + Math.floor(Math.random() * 3); // 3-5 stars
          await conn.query(
            'INSERT IGNORE INTO ratings (user_id, song_id, rating) VALUES (?, ?, ?)',
            [userId, song.id, rating]
          );
        }
        console.log(`  ✓ Seeded ratings for ${username}`);
      }
    }

    // 7. Playlists — seed only if no playlists exist for user
    const playlists = [
      { user: 'john_doe', name: 'Chill Vibes', desc: 'Relaxing tracks for a chill evening' },
      { user: 'john_doe', name: 'Workout Mix', desc: 'High-energy tracks to pump you up' },
      { user: 'jane_smith', name: 'Late Night Jazz', desc: 'Smooth jazz for late-night listening' },
      { user: 'jane_smith', name: 'Indie Favorites', desc: 'Best indie tracks hand-picked' },
      { user: 'music_lover', name: 'Everything Mix', desc: 'A little bit of everything' },
    ];

    for (const pl of playlists) {
      const userId = demoUserMap[pl.user];
      if (!userId) continue;

      const [existingPl] = await conn.query(
        'SELECT id FROM playlists WHERE user_id = ? AND name = ?',
        [userId, pl.name]
      );

      if (existingPl.length === 0) {
        const [res] = await conn.query(
          'INSERT INTO playlists (user_id, name, description) VALUES (?, ?, ?)',
          [userId, pl.name, pl.desc]
        );
        const plId = res.insertId;
        const songsToAdd = [...songList].sort(() => Math.random() - 0.5).slice(0, 5);
        for (let i = 0; i < songsToAdd.length; i++) {
          await conn.query(
            'INSERT IGNORE INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)',
            [plId, songsToAdd[i].id, i + 1]
          );
        }
      }
    }
    console.log(`✓ Ensured demo playlists`);

    // 8. Update preferences via stored procedure
    for (const username of ['john_doe', 'jane_smith', 'music_lover']) {
      const userId = demoUserMap[username];
      if (userId) {
        await conn.query('CALL sp_update_preferences(?)', [userId]);
      }
    }
    console.log('✓ Updated preferences via stored procedures');

    console.log('\n🎉 Idempotent Seeding complete!');
    console.log('   Demo accounts:');
    console.log('   • john_doe   / password123');
    console.log('   • jane_smith / password123');
    console.log('   • music_lover / password123\n');
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await conn.end();
  }
}

seed();
