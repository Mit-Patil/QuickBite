const { Pool } = require('pg');
const { databaseUrl } = require('./env');

const pool = new Pool({ connectionString: databaseUrl });
pool.on('error', (err) => console.error('Postgres pool error:', err.message));

module.exports = pool;