import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator, { navigationRef } from './navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, addNotificationListeners, addNotificationToHistory } from './utils/notifications';

function goToPostFromNotification(data) {
  if (!data?.postId || !navigationRef.isReady()) return;
  navigationRef.navigate('Feed', { focusPostId: data.postId });
}

function PushNotificationBootstrap() {
  const { user } = useAuth();
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    registerForPushNotificationsAsync().catch(() => {});

    // App was cold-started or resumed by tapping a notification.
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) goToPostFromNotification(response.notification.request.content.data);
    });

    cleanupRef.current = addNotificationListeners({
      onReceive: (notification) => {
        const { title, body, data } = notification.request.content;
        addNotificationToHistory({ title, body, data }).catch(() => {});
      },
      onTap: (response) => {
        goToPostFromNotification(response.notification.request.content.data);
      },
    });

    return () => cleanupRef.current?.();
  }, [user]);

  return null;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PushNotificationBootstrap />
        <AppNavigator />
        <StatusBar style="dark" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
