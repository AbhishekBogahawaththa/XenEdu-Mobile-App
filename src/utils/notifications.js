import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../api/axios';

// Configure how notifications appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register for push notifications
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return null;
  }

  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission denied!');
    return null;
  }

  // Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'XenEdu Notifications',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d6b7a',
      sound: true,
    });

    await Notifications.setNotificationChannelAsync('fees', {
      name: 'Fee Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: true,
    });

    await Notifications.setNotificationChannelAsync('attendance', {
      name: 'Attendance Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#F59E0B',
      sound: true,
    });
  }

  // Get push token
  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Will update this
    });
    console.log('Push token:', token.data);
    return token.data;
  } catch (err) {
    console.log('Push token error:', err.message);
    return null;
  }
};

// Send local notification
export const sendLocalNotification = async (title, body, data = {}, channelId = 'default') => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: null, // immediately
  });
};

// Notification types for XenEdu
export const notify = {
  // Fee reminder
  feeReminder: (className, amount, month) => sendLocalNotification(
    '💰 Fee Reminder',
    `Rs. ${amount?.toLocaleString()} due for ${className} — ${month}`,
    { type: 'fee' },
    'fees'
  ),

  // Attendance alert
  attendanceAlert: (className, percentage) => sendLocalNotification(
    '⚠️ Attendance Warning',
    `Your attendance in ${className} is ${percentage}% — below 80% minimum!`,
    { type: 'attendance' },
    'attendance'
  ),

  // Payment approved
  paymentApproved: (className, amount, receiptNumber) => sendLocalNotification(
    '✅ Payment Approved!',
    `Rs. ${amount?.toLocaleString()} for ${className} approved. Receipt: ${receiptNumber}`,
    { type: 'payment' }
  ),

  // Payment rejected
  paymentRejected: (className, reason) => sendLocalNotification(
    '❌ Payment Rejected',
    `Payment for ${className} was rejected. ${reason ? `Reason: ${reason}` : ''}`,
    { type: 'payment' }
  ),

  // New course work
  newCourseWork: (className, title) => sendLocalNotification(
    '📚 New Course Material',
    `${title} added for ${className}`,
    { type: 'coursework' }
  ),

  // Attendance marked
  attendanceMarked: (className, status) => sendLocalNotification(
    '📋 Attendance Marked',
    `You were marked ${status} for ${className} today`,
    { type: 'attendance' }
  ),

  // Welcome
  welcome: (name) => sendLocalNotification(
    '👋 Welcome to XenEdu!',
    `Hi ${name}! Your account is ready. Start exploring your classes!`,
    { type: 'welcome' }
  ),
};