# Techzu Social Media — Mobile (React Native + Expo)

## Stack

- Expo SDK 51 (managed workflow)
- React Navigation (native-stack)
- Axios for API calls, with JWT auto-attached via interceptor
- AsyncStorage for session persistence (auto login on relaunch)
- `expo-notifications` + `expo-device` for FCM push notifications

## Screens

| Screen | Purpose |
|---|---|
| `LoginScreen` | Username/email + password login |
| `SignupScreen` | Username, email, password sign up |
| `FeedScreen` | Scrollable, paginated feed with pull-to-refresh, infinite scroll, like/comment buttons, and a **filter-by-username** search box |
| `CreatePostScreen` | Text-only post composer (500 char limit) |
| `CommentsModal` | Slide-up modal to view/add comments on a post |

## Setup

```bash
cd mobile
npm install
```

### 1. Point the app at your backend

Edit `app.json` → `expo.extra.apiUrl`:

```json
"extra": { "apiUrl": "http://192.168.1.10:4000" }
```

Use your machine's LAN IP (not `localhost`) when testing on a physical
device with Expo Go, since the phone can't resolve your computer's
`localhost`.

### 2. Add Firebase config for push notifications

1. In Firebase Console, add an Android app with package name
   `com.techzu.socialmedia` (matches `app.json`).
2. Download `google-services.json` and place it at `mobile/google-services.json`
   (gitignored).
3. Run the backend with a matching `firebase-service-account.json` from the
   **same** Firebase project (see `backend/README.md`).

### 3. Run

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS), or press
`a` for an Android emulator. **Note:** `expo-notifications` device push
tokens only work on a physical device, not a simulator/emulator.

## Building the APK

This project uses [EAS Build](https://docs.expo.dev/build/introduction/)
(free tier available) to produce a real, installable `.apk` — Expo Go
itself can't produce a distributable binary.

```bash
npm install -g eas-cli
eas login
eas build:configure          # links this project to your Expo account
eas build -p android --profile preview   # profile defined in eas.json -> outputs an .apk
```

When the build finishes, EAS prints a download URL for the `.apk`. Download
it and upload it to Google Drive, then share that link per the assignment's
deliverables.

## How push notifications flow end-to-end

1. On login, `App.js` calls `registerForPushNotificationsAsync()`.
2. That requests notification permission, reads the device's FCM token via
   `Notifications.getDevicePushTokenAsync()`, and POSTs it to
   `/auth/fcm-token`.
3. When another user likes/comments on your post, the backend looks up your
   stored `fcm_token` and sends a push via `firebase-admin`.
4. The app shows it as a native notification (foreground or background),
   and `App.js`'s listeners log receipt/taps — extend `onTap` to deep-link
   into `CommentsModal` for that post if desired.

## Folder structure

```
mobile/
├── App.js                     # Root component: providers + push bootstrap
├── app.json                   # Expo config (icons, plugins, API URL)
├── eas.json                   # EAS build profiles (APK output)
├── api/
│   ├── client.js               # axios instance + JWT interceptor
│   ├── auth.js                 # signup/login/me/fcm-token calls
│   └── posts.js                # posts/likes/comments calls
├── context/
│   └── AuthContext.js          # session state + AsyncStorage persistence
├── navigation/
│   └── AppNavigator.js         # auth stack vs. app stack switch
├── screens/
│   ├── LoginScreen.js
│   ├── SignupScreen.js
│   ├── FeedScreen.js
│   └── CreatePostScreen.js
├── components/
│   ├── PostCard.js
│   └── CommentsModal.js
└── utils/
    └── notifications.js        # permission + token registration + listeners
```
