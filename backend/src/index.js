require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const db = require('./db');
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const { errorHandler, notFound } = require('./middleware/errorHandler');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET is not set. Copy .env.example to .env and configure it.');
  process.exit(1);
}

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic rate limiting to protect auth endpoints from brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/auth', authLimiter, authRoutes);
app.use('/posts', postRoutes);
app.use('/users', require('./routes/users'));

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await db.initDb();
    console.log('MySQL schema ready.');
    app.listen(PORT, () => {
      console.log(`Techzu Social Media API listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('FATAL: Could not connect to MySQL / initialize schema.');
    console.error(err.message);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}

module.exports = app;
