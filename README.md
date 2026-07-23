# Techzu Social Media App

A lightweight Social Media Application: users sign up, post text only updates, like,
comment on posts and also gets real time push notifications (via Firebase Cloud
Messaging) when someone interacts with their post.

## Repo layout

```
techzu-social-media/
├── backend/    Node.js + Express + SQLite REST API (JWT auth, FCM push)
└── mobile/     React Native (Expo) app — feed, post composer, notifications
```

See **`backend/README.md`** and **`mobile/README.md`** for full setup,
API reference and APK build instructions respectively.

## Quick start

```bash
# 1) Backend (needs a MySQL instance — see backend/README.md for options)
cd backend
npm install
cp .env.example .env        # set JWT_SECRET and DATABASE_URL
npm run dev                 # http://localhost:4000

# 2) Mobile (in a second terminal)
cd mobile
npm install
# edit app.json -> expo.extra.apiUrl to your machine's LAN IP:4000 or Backend host url.
npx expo start
```

## What's implemented

**Backend**
- JWT signup/login (`/auth/signup`, `/auth/login`, `/auth/me`)
- `POST /posts`, `GET /posts` (paginated, newest first, `?username=` filter)
- `POST /posts/:id/like` (toggle like/unlike)
- `POST /posts/:id/comment`, `GET /posts/:id/comments`
- FCM push notification on like/comment via `firebase-admin` (gracefully
  disabled if no service account is configured, so local dev never breaks)
- Validation on every input (`express-validator`), rate limiting on auth
  routes, `helmet` security headers, parameterized SQL (no injection risk)

**Mobile**
- Login / Signup screens with client + server-side validation and inline
  error messages
- Feed: pull-to-refresh, infinite scroll pagination, optimistic like
  toggling, and a live **username filter** search box
- Create Post screen with a 500-char counter
- Comments modal (view + add, live count updates on the feed)
- Push notification permission request + FCM token registration on login
- Session persistence via AsyncStorage (stay logged in across app restarts)
