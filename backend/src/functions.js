// Firebase Cloud Functions (2nd gen) entry point.
// Reuses the same Express app as local dev (src/index.js) — only the
// HTTP transport differs. DB schema init runs once per container (lazily,
// on first request) rather than at deploy/cold-start time.
//
// Env vars (JWT_SECRET, DATABASE_URL, etc.) are loaded automatically by
// firebase-functions v2 from a .env / .env.<project-id> file placed in this
// backend/ directory — same variable names as .env.example. They are NOT
// deployed from your local `backend/.env`; create backend/.env.<project-id>
// (or set them as Secret Manager params) before `firebase deploy`.

const { onRequest } = require('firebase-functions/v2/https');
const db = require('./db');
const app = require('./index');

let dbReady;
function ensureDb() {
  if (!dbReady) dbReady = db.initDb();
  return dbReady;
}

exports.api = onRequest({ region: 'us-central1', memory: '256MiB' }, async (req, res) => {
  try {
    await ensureDb();
  } catch (err) {
    console.error('FATAL: Could not connect to MySQL / initialize schema.', err.message);
    res.status(500).json({ error: 'Database initialization failed' });
    return;
  }
  app(req, res);
});
