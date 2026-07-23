const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { validationErrorFormatter } = require('../middleware/errorHandler');
const { sendPushNotification } = require('../utils/firebase');

const router = express.Router();

function serializePost(row) {
  return {
    id: row.id,
    content: row.content,
    createdAt: row.created_at,
    author: { id: row.user_id, username: row.username },
    likeCount: Number(row.like_count),
    commentCount: Number(row.comment_count),
    likedByMe: !!row.liked_by_me,
  };
}

// POST /posts - create a text-only post
router.post(
  '/',
  authenticate,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 500 })
      .withMessage('content must be 1-500 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const inserted = await db.query(
        'INSERT INTO posts (user_id, content) VALUES (?, ?)',
        [req.user.id, req.body.content]
      );
      const postResult = await db.query('SELECT * FROM posts WHERE id = ?', [inserted.insertId]);
      const post = postResult.rows[0];

      const row = {
        ...post,
        username: req.user.username,
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      };

      res.status(201).json({ post: serializePost(row) });
    } catch (err) {
      next(err);
    }
  }
);

// GET /posts - paginated, newest first, optional ?username= filter
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
    query('username').optional().trim().isLength({ min: 1, max: 30 }),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const page = req.query.page || 1;
      const limit = req.query.limit || 10;
      const offset = (page - 1) * limit;
      const usernameFilter = req.query.username;

      const whereClause = usernameFilter ? 'WHERE u.username LIKE ?' : '';
      const params = [req.user.id];
      if (usernameFilter) params.push(`%${usernameFilter}%`);
      params.push(limit, offset);

      const rowsResult = await db.query(
        `SELECT p.*, u.username,
                (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) as like_count,
                (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) as comment_count,
                EXISTS(SELECT 1 FROM likes l2 WHERE l2.post_id = p.id AND l2.user_id = ?) as liked_by_me
         FROM posts p JOIN users u ON u.id = p.user_id
         ${whereClause}
         ORDER BY p.created_at DESC, p.id DESC
         LIMIT ? OFFSET ?`,
        params
      );

      const countParams = usernameFilter ? [`%${usernameFilter}%`] : [];
      const countWhere = usernameFilter ? 'WHERE u.username LIKE ?' : '';
      const totalResult = await db.query(
        `SELECT COUNT(*) as count FROM posts p JOIN users u ON u.id = p.user_id ${countWhere}`,
        countParams
      );
      const total = Number(totalResult.rows[0].count);

      res.json({
        posts: rowsResult.rows.map((r) => serializePost(r)),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /posts/:id/like - like or unlike (toggle)
router.post(
  '/:id/like',
  authenticate,
  [param('id').isInt({ min: 1 }).toInt()],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const postResult = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
      const post = postResult.rows[0];
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const existingLike = await db.query(
        'SELECT id FROM likes WHERE post_id = ? AND user_id = ?',
        [post.id, req.user.id]
      );

      let liked;
      if (existingLike.rows.length) {
        await db.query('DELETE FROM likes WHERE id = ?', [existingLike.rows[0].id]);
        liked = false;
      } else {
        await db.query('INSERT INTO likes (post_id, user_id) VALUES (?, ?)', [
          post.id,
          req.user.id,
        ]);
        liked = true;

        // Notify the post owner (fire-and-forget, never blocks the response)
        if (post.user_id !== req.user.id) {
          const ownerResult = await db.query('SELECT fcm_token FROM users WHERE id = ?', [
            post.user_id,
          ]);
          const owner = ownerResult.rows[0];
          if (owner?.fcm_token) {
            sendPushNotification(owner.fcm_token, {
              title: 'New Like',
              body: `${req.user.username} liked your post`,
              data: { type: 'like', postId: post.id },
            }).catch(() => {});
          }
        }
      }

      const likeCountResult = await db.query(
        'SELECT COUNT(*) as c FROM likes WHERE post_id = ?',
        [post.id]
      );

      res.json({ liked, likeCount: Number(likeCountResult.rows[0].c) });
    } catch (err) {
      next(err);
    }
  }
);

// POST /posts/:id/comment - add a comment
router.post(
  '/:id/comment',
  authenticate,
  [
    param('id').isInt({ min: 1 }).toInt(),
    body('content')
      .trim()
      .isLength({ min: 1, max: 300 })
      .withMessage('content must be 1-300 characters'),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const postResult = await db.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
      const post = postResult.rows[0];
      if (!post) return res.status(404).json({ error: 'Post not found' });

      const inserted = await db.query(
        'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
        [post.id, req.user.id, req.body.content]
      );
      const commentResult = await db.query('SELECT * FROM comments WHERE id = ?', [
        inserted.insertId,
      ]);
      const comment = commentResult.rows[0];

      if (post.user_id !== req.user.id) {
        const ownerResult = await db.query('SELECT fcm_token FROM users WHERE id = ?', [
          post.user_id,
        ]);
        const owner = ownerResult.rows[0];
        if (owner?.fcm_token) {
          sendPushNotification(owner.fcm_token, {
            title: 'New Comment',
            body: `${req.user.username} commented: ${req.body.content.slice(0, 60)}`,
            data: { type: 'comment', postId: post.id },
          }).catch(() => {});
        }
      }

      res.status(201).json({
        comment: {
          id: comment.id,
          content: comment.content,
          createdAt: comment.created_at,
          author: { id: comment.user_id, username: req.user.username },
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /posts/:id/comments - list comments for a post (helper endpoint, paginated)
router.get(
  '/:id/comments',
  authenticate,
  [
    param('id').isInt({ min: 1 }).toInt(),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: validationErrorFormatter(errors) });
    }

    try {
      const postResult = await db.query('SELECT id FROM posts WHERE id = ?', [req.params.id]);
      if (!postResult.rows.length) return res.status(404).json({ error: 'Post not found' });

      const page = req.query.page || 1;
      const limit = req.query.limit || 20;
      const offset = (page - 1) * limit;

      const rowsResult = await db.query(
        `SELECT c.*, u.username FROM comments c JOIN users u ON u.id = c.user_id
         WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT ? OFFSET ?`,
        [req.params.id, limit, offset]
      );

      res.json({
        comments: rowsResult.rows.map((c) => ({
          id: c.id,
          content: c.content,
          createdAt: c.created_at,
          author: { id: c.user_id, username: c.username },
        })),
        pagination: { page, limit },
      });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
