# Techzu Social Media

A light-weight App, Techzu Social Media app. Users sign up, post text
updates, like and comment on each other's posts, view profiles and get
real time push notifications with tap to trigger notification feature.

Built with **React Native (Expo)** on the frontend 
and **Node.js + Express + MySQL** on the backend, 
with **Firebase Cloud Messaging** for push Notifications.

---

## Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Repo layout](#repo-layout)
- [Screens](#screens)
- [API reference](#api-reference)
- [Getting started](#getting-started)
- [Deploying for free](#deploying-for-free)
- [Push notifications setup](#push-notifications-setup)
- [Design system](#design-system)
- [Security](#security)

---

## Features

### Core social feed
- Sign up / log in with JWT auth (username **or** email + password)
- Text posts (500-char limit) with a live character counter
- Like / unlike (optimistic UI, instant feedback)
- Comment on posts; comment count updates live on the feed
- Paginated feed with pull to refresh and infinite scroll
- Filter the feed by username (case-insensitive, partial match)

### Profiles
- **My Profile** — view your info, change your display name, change your
  password (current-password verification required), log out
- **User Profile** — tap any avatar (on a post or in the comments view) to
  see that user's name and email on their own profile page

### Notifications
- Real push notifications via Firebase Cloud Messaging when someone likes
  or comments on your post
- In-app **Notifications** screen — a running history of everything
  you've received, with a bell icon on the feed
- Tapping a notification (from the tray *or* the in app list whether the
  app was foregrounded, backgrounded or fully killed) navigates straight
  to that post and opens its comments

### Design
- Custom logo and app icon (indigo → violet gradient bubble mark)
- Cohesive design system (`mobile/theme/colors.js`) — consistent colors,
  spacing, radii and shadows across every screen
- Gradient buttons/header/floating action button, icon set via
  `@expo/vector-icons`
- Password visibility toggle on all password fields
- Keyboard-aware forms (inputs never hide behind the keyboard)

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile | React Native (Expo), React Navigation, Axios, AsyncStorage |
| Backend | Node.js, Express 4 |
| Database | MySQL (via `mysql2`, connection-pooled, parameterized queries) |
| Auth | JWT (`jsonwebtoken`) + `bcryptjs` password hashing |
| Push | Firebase Cloud Messaging (`firebase-admin` server-side, `expo-notifications` client-side) |
| Validation / security | `express-validator`, `helmet`, `express-rate-limit`, CORS |

---

## Repo layout

```
techzu-social-media/
├── backend/                Express + MySQL REST API
│   ├── src/
│   │   ├── index.js         App entry (local dev: npm start)
│   │   ├── db/               Connection pool + schema.sql
│   │   ├── routes/            auth.js, posts.js, users.js
│   │   ├── middleware/         JWT auth, error handling
│   └── utils/firebase.js   Server-side FCM push sending
│
│
├── mobile/                 Expo React Native app
│   ├── screens/              Login, Signup, Feed, CreatePost, Profile,
│   │                         UserProfile, Notifications
│   ├── components/            PostCard, CommentsModal, Logo
│   ├── theme/colors.js         Design tokens
│   ├── navigation/AppNavigator.js
│   ├── context/AuthContext.js  Session state + persistence
│   ├── api/                   Axios clients (auth, posts)
│   └── utils/notifications.js  Push registration + local history
│
└── render.yaml              One-click Render.com backend deploy blueprint
```

---

## Screens

| Screen | What it does |
|---|---|
| Login / Signup | Auth with inline validation, password show/hide |
| Feed | Infinite-scroll list of posts, username search, bell icon → Notifications, floating "Create New Post" button |
| Create Post | Composer with 500-char limit |
| Comments | Post preview (with like/comment counts) on top, comments below, add-comment box |
| Profile | Your info; change name; change password; log out |
| User Profile | Read-only view of another user's name + email |
| Notifications | History of received pushes; tap → jumps to the post |

---

## API reference

Base URL: your backend's host (local: `http://localhost:4000`).

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | – | Create account, returns JWT |
| POST | `/auth/login` | – | Log in with username/email, returns JWT |
| GET  | `/auth/me` | ✅ | Current user info |
| PATCH | `/auth/username` | ✅ | Change display name (reissues JWT) |
| PATCH | `/auth/password` | ✅ | Change password (requires current password) |
| POST | `/auth/fcm-token` | ✅ | Register device push token |
| GET  | `/users/:username` | ✅ | Public profile lookup (name + email) |
| GET  | `/posts` | ✅ | Paginated feed; `?page`, `?limit`, `?username=` |
| POST | `/posts` | ✅ | Create a post |
| POST | `/posts/:id/like` | ✅ | Toggle like/unlike |
| POST | `/posts/:id/comment` | ✅ | Add a comment (triggers push to post owner) |
| GET  | `/posts/:id/comments` | ✅ | Paginated comments for a post |

---

## Getting started (Initially started from local to create the architecture -- **Ignore this section for production**)

```bash
# 1) Backend — Used a MySQL instance 
cd backend
npm install
cp .env.example .env        # set JWT_SECRET and DATABASE_URL
npm run dev                 # http://localhost:4000

# 2) Mobile — in a second terminal
cd mobile
npm install
# edit app.json -> expo.extra.apiUrl to your backend URL
#   (LAN IP:4000 for local testing or your deployed HTTPS URL)
npx expo start
```

> **Push notifications don't work in Expo Go** (Expo removed that support > in SDK 53+).

## Deploying in Cloud (Render + Aiven) **Start from here**

**Database** :
[Aiven](https://aiven.io)
- Create account and Start a mysql service and an url will be given after service registration. 
- Just copy and paste that in Env DB_Url.

**Backend** — [Render](https://render.com):
1. Push this repo to GitHub.
2. Render → New → Blueprint → select the repo (uses `render.yaml`).
3. Set `JWT_SECRET` and `DATABASE_URL` (from your DB provider) in the
   dashboard, plus `DB_SSL=true`.
4. Deploy → you get a permanent `https://….onrender.com` - URL.
5. Set that URL as `expo.extra.apiUrl` in `mobile/app.json`.

Full step-by-step is in `backend/README.md`.

---

## Push notifications setup

1. Create a Firebase project. Add an Android app with package name
   `com.techzo.socialmedia` (matches `mobile/app.json`); download
   `google-services.json` into `mobile/`.
2. Firebase Console → Project Settings → Service Accounts → generate a
   private key; save it as `backend/firebase-service-account.json`.
3. Build a dev client (Expo Go can't run push Notification):
   ```bash
   cd mobile
   npx eas login
   npm run build:dev      # builds an installable APK via EAS, free tier
                      # Also to reduce hassle - JAVA sdk on Android Studio + Gradle Build just run:
                          # cd android
                          # >> .\gradlew assembleRelease

   ```
4. Install that APK on your device, then `npm run start:dev-client`.
5. Log in — the device registers its push token automatically. Like or
   comment on that user's post from another account to trigger a push;
   tapping it opens the app straight to that post's comments.

---

## Design system

All colors, spacing, corner radii and shadows live in
`mobile/theme/colors.js` — a single source of truth so every screen stays
visually consistent. The brand mark (used for the app icon, splash screen,
and in-app logo) is an indigo → violet gradient speech-bubble, generated
to match across all required Android/iOS icon sizes.

---

## Security

- Passwords hashed with `bcryptjs`; JWTs signed with a server-side secret
- All SQL is parameterized (`mysql2` placeholders) — no string-built queries
- Every input validated with `express-validator`
- `helmet` security headers, `express-rate-limit` on auth routes
- Password changes require the current password; 
- username changes reissue the JWT so the new identity is reflected immediately;


---

## User Manual
- Install the apk
- Create a Profile from sign up
- The sign In with credentials user name/email and password
Done.