const mysql = require('mysql2/promise');
const { executeMockQuery } = require('./mockStore');
require('dotenv').config();

const MOCK_MODE =
  process.env.MOCK_MODE === 'true' ||
  process.env.NODE_ENV === 'test';

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

const pool = {

  async query(sql, params = []) {
    if (MOCK_MODE || !mysqlPool) {
      return executeMockQuery(sql, params);
    }

    return mysqlPool.query(sql, params);
  },

  isMock: MOCK_MODE,
};

module.exports = pool;
