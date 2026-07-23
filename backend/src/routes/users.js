const express = require('express');
const { param, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validationErrorFormatter } = require('../middleware/errorHandler');

const router = express.Router();

// GET /users/:username - public profile lookup (name + email) for the feed's user icons
router.get(
  '/:username',
  authenticate,
  [param('username').trim().notEmpty()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }
    try {
      const result = await db.query(
        'SELECT id, username, email FROM users WHERE username = ?',
        [req.params.username]
      );
      const user = result.rows[0];
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({ user });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
