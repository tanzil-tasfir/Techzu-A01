import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerFcmToken } from '../api/auth';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// build is required for real push notifications.
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Requests notification permission, grabs the device's push token,
 * and registers it with the backend so likes/comments can trigger FCM pushes.
 * Safe to call multiple times (e.g. on every login). Never throws — logs and
 * returns null on any failure so it can't break app startup.
 */
export async function registerForPushNotificationsAsync() {
  try {
    if (isExpoGo) {
      console.log(
        'Skipping push notification registration: not supported in Expo Go. ' +
          'Use a development build to test push notifications.'
      );
      return null;
    }

    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device (not a simulator/emulator).');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permission was not granted.');
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }

    // Uses the FCM device token on Android (via google-services.json) and
    // APNs on iOS, both surfaced through Expo's unified token API.
    const pushToken = (await Notifications.getDevicePushTokenAsync()).data;

    try {
      await registerFcmToken(pushToken);
    } catch (err) {
      console.warn('Failed to register push token with backend:', err.message);
    }

    return pushToken;
  } catch (err) {
    console.warn('Push notification registration skipped:', err.message);
    return null;
  }
}

export function addNotificationListeners({ onReceive, onTap }) {
  const receivedSub = Notifications.addNotificationReceivedListener((notification) => {
    onReceive?.(notification);
  });
  const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap?.(response);
  });
  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}

// Local notification history (for the in app Notifications screen)
const HISTORY_KEY = 'notificationHistory';
const HISTORY_MAX = 50;

export async function addNotificationToHistory({ title, body, data }) {
  try {
    const list = await getNotificationHistory();
    const next = [
      { id: String(Date.now()), title, body, data, receivedAt: new Date().toISOString() },
      ...list,
    ].slice(0, HISTORY_MAX);
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    return [];
  }
}

export async function getNotificationHistory() {
  const raw = await AsyncStorage.getItem(HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}
