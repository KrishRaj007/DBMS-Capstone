/**
 * Database Connection — MySQL Primary Data Source
 *
 * In normal (dev/prod) mode:
 *   - MySQL is the ONLY data source.
 *   - If MySQL is unavailable the query fails loudly with a clear error.
 *   - No silent fallback, no mock data, no guessing.
 *
 * In explicit test/mock mode (NODE_ENV=test OR MOCK_MODE=true):
 *   - Falls back to the in-memory mock store so Jest tests run offline.
 *
 * Run `npm run init-db` once before starting the server to create the schema.
 */
const mysql = require('mysql2/promise');
const { executeMockQuery } = require('./mockStore');
require('dotenv').config();

// ── Determine runtime mode ───────────────────────────────────────────────────
const MOCK_MODE =
  process.env.MOCK_MODE === 'true' ||
  process.env.NODE_ENV === 'test';

// ── Build MySQL pool (only when NOT in mock mode) ───────────────────────────
let mysqlPool = null;

if (!MOCK_MODE) {
  mysqlPool = mysql.createPool({
    host:             process.env.DB_HOST     || 'localhost',
    port:             parseInt(process.env.DB_PORT || '3306'),
    user:             process.env.DB_USER     || 'root',
    password:         process.env.DB_PASSWORD || '',
    database:         process.env.DB_NAME     || 'music_analytics',
    waitForConnections: true,
    connectionLimit:  10,
    queueLimit:       0,
    connectTimeout:   10000,
  });

  // Eagerly validate the connection so startup fails fast if credentials are wrong.
  mysqlPool.getConnection()
    .then(conn => {
      console.log(
        `✅ Connected to MySQL ${process.env.DB_NAME || 'music_analytics'}` +
        ` @ ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`
      );
      conn.release();
    })
    .catch(err => {
      console.error('\n❌ FATAL: Cannot connect to MySQL database.');
      console.error(`   Code   : ${err.code}`);
      console.error(`   Message: ${err.message}`);
      console.error('\n👉 Check Backend/.env — ensure DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME are correct.');
      console.error('👉 Run `npm run init-db` to initialise the schema if the database does not exist yet.\n');
      process.exit(1);
    });
} else {
  console.log(`⚡ Running in ${process.env.NODE_ENV === 'test' ? 'TEST' : 'MOCK'} mode — using in-memory mock store.`);
}

// ── Unified pool API ─────────────────────────────────────────────────────────
const pool = {
  /**
   * Execute a SQL query.
   * In normal mode: hits MySQL, throws on any error (no fallback).
   * In mock/test mode: hits the in-memory mock store.
   */
  async query(sql, params = []) {
    if (MOCK_MODE || !mysqlPool) {
      return executeMockQuery(sql, params);
    }
    // Let MySQL errors propagate — callers/routes handle them.
    return mysqlPool.query(sql, params);
  },

  /** Expose isMock flag so routes/tests can inspect the active mode. */
  isMock: MOCK_MODE,
};

module.exports = pool;
