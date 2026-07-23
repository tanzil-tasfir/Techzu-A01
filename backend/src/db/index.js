const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const useSsl = process.env.DB_SSL === 'true';

// Prefer a single DATABASE_URL (mysql://user:pass@host:port/db) when present,
// otherwise fall back to the individual DB_* vars.
const pool = process.env.DATABASE_URL
  ? mysql.createPool({
      uri: process.env.DATABASE_URL,
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    })
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'techzu_social_media',
      waitForConnections: true,
      connectionLimit: 10,
      dateStrings: true,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
    });

/**
 * Thin wrapper that normalizes mysql2's [rows, fields] tuple into a shape
 * similar to `pg`'s result object, so route handlers can consistently do
 * `result.rows`. For INSERT/UPDATE/DELETE, mysql2 returns a ResultSetHeader
 * (not an array) — we expose that as `insertId` / `affectedRows` instead.
 */
async function query(sql, params = []) {
  const [result] = await pool.query(sql, params);
  if (Array.isArray(result)) {
    return { rows: result };
  }
  return { rows: [], insertId: result.insertId, affectedRows: result.affectedRows };
}

/**
 * Runs schema.sql against the pool, statement by statement. Safe to call on
 * every boot: CREATE TABLE uses IF NOT EXISTS, and CREATE INDEX (which MySQL
 * doesn't support IF NOT EXISTS for) has its "already exists" error ignored.
 */
async function initDb() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  const statements = schema
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);

  for (const statement of statements) {
    try {
      await pool.query(statement);
    } catch (err) {
      // ER_DUP_KEYNAME: index already exists — fine on repeat boots.
      if (err.code !== 'ER_DUP_KEYNAME') throw err;
    }
  }
}

module.exports = {
  pool,
  query,
  initDb,
};
