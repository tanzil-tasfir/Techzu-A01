import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppNavigator from './navigation/AppNavigator';
import { registerForPushNotificationsAsync, addNotificationListeners } from './utils/notifications';

function PushNotificationBootstrap() {
  const { user } = useAuth();
  const cleanupRef = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    registerForPushNotificationsAsync().catch(() => {});

    cleanupRef.current = addNotificationListeners({
      onReceive: (notification) => {
        // A like/comment notification arrived while the app is in the foreground.
        // FeedScreen re-fetches on focus so no extra wiring is needed here beyond
        // this hook point if you want to show an in app toast/badge later.
        console.log('Notification received:', notification.request.content);
      },
      onTap: (response) => {
        console.log('Notification tapped:', response.notification.request.content);
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
