/**
 * Database Migration Runner
 * Safely executes pending SQL migrations in Backend/db/migrations/
 * Tracks applied migrations in the schema_migrations table.
 * Preserves all existing tables, foreign keys, user accounts, and data.
 *
 * Usage: node Backend/db/migrate.js
 */
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

async function runMigrations() {
  console.log('🔄 Checking Database Migrations...\n');

  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  };

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
  } catch (err) {
    console.warn(`⚠️  Could not connect to MySQL (${err.message}). Skipping MySQL migration.`);
    return;
  }

  try {
    const dbName = process.env.DB_NAME || 'music_analytics';
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await conn.query(`USE \`${dbName}\``);

    // Track migration history
    await conn.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        version VARCHAR(100) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const [appliedRows] = await conn.query('SELECT version FROM schema_migrations');
    const appliedVersions = new Set(appliedRows.map((r) => r.version));

    if (!fs.existsSync(MIGRATIONS_DIR)) {
      console.log('ℹ No migrations directory found.');
      return;
    }

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    let appliedCount = 0;
    for (const file of files) {
      if (appliedVersions.has(file)) {
        continue;
      }

      console.log(`⏳ Applying migration: ${file}...`);
      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf-8');

      try {
        await conn.query(sql);
        await conn.query('INSERT INTO schema_migrations (version) VALUES (?)', [file]);
        console.log(`  ✓ Successfully applied ${file}`);
        appliedCount++;
      } catch (migErr) {
        console.error(`❌ Migration ${file} failed:`, migErr.message);
        throw migErr;
      }
    }

    if (appliedCount === 0) {
      console.log('✅ Database schema is up to date. No pending migrations.');
    } else {
      console.log(`\n🎉 Applied ${appliedCount} new migration(s) successfully.`);
    }
  } catch (err) {
    console.error('Migration error:', err.message);
  } finally {
    if (conn) await conn.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };
