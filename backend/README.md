# Techzu Social Media — Backend

Node.js + Express REST API with JWT auth, MySQL storage and Firebase Cloud
Messaging (FCM) push notifications for likes/comments.

## Stack

- **Express 4** — HTTP framework
- **MySQL** (via `mysql2`) — relational database, connection-pooled
- **jsonwebtoken** + **bcryptjs** — auth
- **express-validator** — request validation
- **firebase-admin** — server-side FCM push notifications
- **helmet**, **cors**, **express-rate-limit**, **morgan** — security/logging hardening

## Setup

### 1. Get a MySQL instance

Any of these works — So I'm taking Option B: a host/port/user/password/database (a
single connection string from Aiven):

```bash
# Option A: local install
sudo apt install mysql-server
sudo mysql -e "CREATE DATABASE techzu_social_media;"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';"

# Option B: techzu_social_media a managed provider (Render & Aiven) —
# just copy the connection string/credentials.
```

### 2. Configure and run the API

```bash
cd backend
npm install
cp .env.example .env
# edit .env: set JWT_SECRET and DATABASE_URL (or the DB_* vars)
npm run dev        # auto-restarts on file changes (node --watch)
# or
npm start
```

Server starts on `http://localhost:4000` (configurable via `PORT`).
On boot, it runs `src/db/schema.sql` automatically (`CREATE TABLE IF NOT
EXISTS ...`), so the schema is created on first run and left alone after
that — no separate migration step needed for this project's scope.

If MySQL isn't reachable, the server logs a clear fatal error and exits
rather than starting in a broken state.

### Enabling push notifications (optional but required for full credit)

1. In the [Firebase Console](https://console.firebase.google.com/), create/open your project.
2. Project Settings → Service Accounts → **Generate new private key**.
3. Save the downloaded JSON as `backend/firebase-service-account.json` (already gitignored).
4. Restart the server. If the file is missing, the API still works — likes/comments
   just log `[FCM] ... disabled` instead of sending a push, so local dev never breaks.

The mobile app registers its Expo/FCM device token via `POST /auth/fcm-token`
after login; that token is what the backend sends notifications to.

## Deploying Option B**

**Database — pick one (all have generous free MySQL tiers, all require SSL):**
- [Aiven](https://aiven.io)

Create a database then copy the connection string to env.

**Backend — Render:**
1. Push this repo to GitHub.
2. On [render.com](https://render.com): New → Blueprint → pick the repo (uses
   `render.yaml` at the repo root, root dir `backend/`). Or without the
   blueprint: New → Web Service, root directory `backend`, build command
   `npm install`, start command `npm start`.
3. Set env vars in the Render dashboard (same keys as `.env.example`):
   `JWT_SECRET` (long random string), `DATABASE_URL` (from the DB provider
   above), `DB_SSL=true`.
4. Deploy. Render gives a permanent HTTPS URL like
   `https://techzu-social-media-api.onrender.com` — no port, no LAN, works from
   any network. `/health` is used as the health check.
5. Point the mobile app at it: set `expo.extra.apiUrl` in `mobile/app.json`
   to that URL.

Free Render services spin down after inactivity and take a few seconds
to wake on the next request — but I choose this as it is for testing use only. 
Never recommend for production deployment.



Defined in `src/db/schema.sql`, applied automatically on startup:

```
users(id INT AUTO_INCREMENT, username UNIQUE, email UNIQUE, password_hash, fcm_token, created_at)
posts(id INT AUTO_INCREMENT, user_id FK->users, content, created_at)
likes(id INT AUTO_INCREMENT, post_id FK->posts, user_id FK->users, created_at)   -- unique(post_id, user_id)
comments(id INT AUTO_INCREMENT, post_id FK->posts, user_id FK->users, content, created_at)
```

Foreign keys use `ON DELETE CASCADE`, so deleting a user or post cleans up
their likes/comments automatically.

## API Reference

All endpoints (except `/health`, `/auth/signup`, `/auth/login`) require:
`Authorization: Bearer <jwt>`

### Auth

| Method | Route | Body | Notes |
|---|---|---|---|
| POST | `/auth/signup` | `{ username, email, password }` | Returns `{ token, user }` |
| POST | `/auth/login` | `{ identifier, password }` | `identifier` = username or email |
| GET  | `/auth/me` | — | Returns the logged-in user |
| POST | `/auth/fcm-token` | `{ token }` | Registers the device's FCM token |

### Posts

| Method | Route | Body / Query | Notes |
|---|---|---|---|
| POST | `/posts` | `{ content }` (1–500 chars) | Creates a text-only post |
| GET | `/posts?page=1&limit=10&username=bob` | — | Paginated, newest first. `username` does a partial match filter |
| POST | `/posts/:id/like` | — | Toggles like/unlike. Notifies the post owner via FCM |
| POST | `/posts/:id/comment` | `{ content }` (1–300 chars) | Adds a comment. Notifies the post owner via FCM |
| GET | `/posts/:id/comments?page=1&limit=20` | — | Lists comments for a post |

### Example: create a post

```bash
curl -X POST http://localhost:4000/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"Hello world!"}'
```

### Error format

Validation errors:
```json
{ "errors": [{ "field": "content", "message": "content must be 1-500 characters" }] }
```
Other errors:
```json
{ "error": "Invalid or expired token" }
```

## Security notes

- Passwords hashed with bcrypt (cost factor 10).
- JWTs signed with `JWT_SECRET`, expire per `JWT_EXPIRES_IN` (default 7d).
- `helmet` sets standard security headers; `express-rate-limit` throttles `/auth/*`
  to 50 requests / 15 min per IP.
- All input validated with `express-validator`; SQL uses parameterized
  `mysql2` queries (`?` placeholders) throughout, no string concatenation,
  to prevent injection.

### Hope this aligns with what this assesment's criteria. 
### N.B. This architecture and tech recommendations are for testing purposes only.
