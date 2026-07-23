const fs = require('fs');
const path = require('path');

let admin = null;
let initialized = false;

/**
 * Lazily initializes firebase-admin using a service account file.
 * If no service account is present, notifications are silently skipped
 * (logged to console) so the rest of the API still works in dev/test.
 */
function getFirebaseAdmin() {
  if (initialized) return admin;
  initialized = true;

  const saPath = path.resolve(
    process.cwd(),
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json'
  );

  if (!fs.existsSync(saPath)) {
    console.warn(
      `[FCM] Service account not found at ${saPath}. Push notifications are disabled. ` +
        'Add a Firebase service account JSON to enable them (see .env.example).'
    );
    admin = null;
    return null;
  }

  try {
    const firebaseAdmin = require('firebase-admin');
    const serviceAccount = require(saPath);
    if (!firebaseAdmin.apps.length) {
      firebaseAdmin.initializeApp({
        credential: firebaseAdmin.credential.cert(serviceAccount),
      });
    }
    admin = firebaseAdmin;
    return admin;
  } catch (err) {
    console.error('[FCM] Failed to initialize firebase-admin:', err.message);
    admin = null;
    return null;
  }
}

/**
 * Sends a push notification to a single device token.
 * Fails silently (with a console warning) so a missing/invalid token
 * never breaks the like/comment API response.
 */
async function sendPushNotification(token, { title, body, data = {} }) {
  if (!token) return { sent: false, reason: 'no_token' };

  const fcm = getFirebaseAdmin();
  if (!fcm) return { sent: false, reason: 'fcm_not_configured' };

  try {
    await fcm.messaging().send({
      token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(data).map(([k, v]) => [k, String(v)])
      ),
    });
    return { sent: true };
  } catch (err) {
    console.error('[FCM] Failed to send notification:', err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendPushNotification };
