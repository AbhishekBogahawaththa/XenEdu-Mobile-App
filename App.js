import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { registerForPushNotifications } from './src/utils/notifications';
import useAuthStore from './src/store/authStore';
import api from './src/api/axios';

const queryClient = new QueryClient();

export default function App() {
  const notificationListener = useRef();
  const responseListener = useRef();
  const loadUser = useAuthStore(state => state.loadUser);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    loadUser();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification.request.content.title);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response.notification.request.content.data);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Save push token when user logs in — separate from login flow
  useEffect(() => {
    if (user) {
      setTimeout(async () => {
        try {
          const token = await registerForPushNotifications();
          if (token) {
            await api.post('/auth/push-token', { pushToken: token });
            console.log('Push token saved');
          }
        } catch (err) {
          console.log('Push token save failed:', err.message);
        }
      }, 3000); // 3 second delay after login
    }
  }, [user]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" />
      <AppNavigator />
    </QueryClientProvider>
  );
}