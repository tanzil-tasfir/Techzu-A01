const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validationErrorFormatter } = require('../middleware/errorHandler');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email };
}

// POST /auth/signup
router.post(
  '/signup',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage('Username must be 3-30 chars, alphanumeric/underscore/dot only'),
    body('email').trim().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const { username, email, password } = req.body;

      const existing = await db.query(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email]
      );
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Username or email already in use' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      const inserted = await db.query(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]
      );

      const userResult = await db.query('SELECT * FROM users WHERE id = ?', [inserted.insertId]);
      const user = userResult.rows[0];
      const token = signToken(user);
      res.status(201).json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /auth/login
router.post(
  '/login',
  [
    body('identifier').trim().notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const { identifier, password } = req.body;
      const result = await db.query(
        'SELECT * FROM users WHERE username = ? OR email = ?',
        [identifier, identifier]
      );
      const user = result.rows[0];

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = signToken(user);
      res.json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const result = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// POST /auth/fcm-token - register/update the device push token for the logged-in user
router.post(
  '/fcm-token',
  authenticate,
  [body('token').trim().notEmpty().withMessage('token is required')],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }
    try {
      await db.query('UPDATE users SET fcm_token = ? WHERE id = ?', [
        req.body.token,
        req.user.id,
      ]);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /auth/username - change display name
router.patch(
  '/username',
  authenticate,
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage('Username must be 3-30 chars, alphanumeric/underscore/dot only'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }
    try {
      const { username } = req.body;
      const existing = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [
        username,
        req.user.id,
      ]);
      if (existing.rows.length) {
        return res.status(409).json({ error: 'Username already in use' });
      }
      await db.query('UPDATE users SET username = ? WHERE id = ?', [username, req.user.id]);
      const result = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const user = result.rows[0];
      const token = signToken(user); // username changed -> reissue token
      res.json({ token, user: publicUser(user) });
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /auth/password - change password (requires current password)
router.patch(
  '/password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }
    try {
      const result = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
      const user = result.rows[0];
      if (!bcrypt.compareSync(req.body.currentPassword, user.password_hash)) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      const newHash = bcrypt.hashSync(req.body.newPassword, 10);
      await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);
      res.json({ ok: true });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
