
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { pushNotificationService } from '@/app/services/pushNotificationService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications(userId: string | null) {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    if (!userId) return;

    // Register for push notifications
    registerForPushNotifications(userId);

    // Listen for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('📲 Notification received:', notification);
    });

    // Listen for user interactions with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('📲 Notification response:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle deep linking based on notification payload
      if (data.route) {
        handleDeepLink(data);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, [userId]);

  const registerForPushNotifications = async (userId: string) => {
    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Push notification permission not granted');
        return;
      }

      // Get push token
      // Note: For production, set your Expo project ID here
      // You can find it at https://expo.dev/
      let token: string;
      
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || undefined,
        });
        token = tokenData.data;
      } catch (error) {
        console.error('Error getting Expo push token:', error);
        // Fallback to device push token if Expo token fails
        const deviceToken = await Notifications.getDevicePushTokenAsync();
        token = deviceToken.data;
      }

      // Determine platform
      const platform = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

      // Register token with backend
      const result = await pushNotificationService.registerDeviceToken(
        userId,
        token,
        platform
      );

      if (result.success) {
        console.log('✅ Push notification token registered successfully');
      } else {
        console.error('❌ Failed to register push notification token:', result.error);
      }
    } catch (error) {
      console.error('Error registering for push notifications:', error);
    }
  };

  const handleDeepLink = (data: any) => {
    // Handle deep linking based on route
    console.log('Handling deep link:', data);
    
    // This would typically use navigation to navigate to the appropriate screen
    // Example: navigation.navigate(data.route, { appealId: data.appealId });
  };
}
