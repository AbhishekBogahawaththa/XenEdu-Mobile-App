import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configure how notifications appear
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
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

  // Android — single channel, always XenEdu logo
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('xenedu', {
      name: 'XenEdu',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d6b7a',
      sound: true,
      // Uses the app icon automatically on Android
    });
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: '41a37990-023b-471b-b6ae-614e3f07e635',
    });
    console.log('Push token:', token.data);
    return token.data;
  } catch (err) {
    console.log('Push token error:', err.message);
    return null;
  }
};

// Send local notification — always uses app icon like Facebook
export const sendLocalNotification = async (title, body, data = {}) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      // Android: uses app icon (set in app.json via notification.icon)
      // iOS: always uses app icon automatically
      ...(Platform.OS === 'android' && {
        icon: './assets/icon.png',
        color: '#0d6b7a',
      }),
    },
    trigger: null, // send immediately
  });
};

// All notification types — no emojis in title, clean like Facebook
export const notify = {

  feeReminder: (className, amount, month) => sendLocalNotification(
    'Fee Reminder',
    `Rs. ${amount?.toLocaleString()} due for ${className} — ${month}`,
    { type: 'fee' }
  ),

  attendanceAlert: (className, percentage) => sendLocalNotification(
    'Attendance Warning',
    `Your attendance in ${className} is ${percentage}% — below the 80% minimum`,
    { type: 'attendance' }
  ),

  paymentApproved: (className, amount, receiptNumber) => sendLocalNotification(
    'Payment Approved',
    `Rs. ${amount?.toLocaleString()} for ${className} has been approved. Receipt: ${receiptNumber}`,
    { type: 'payment' }
  ),

  paymentRejected: (className, reason) => sendLocalNotification(
    'Payment Rejected',
    `Your payment for ${className} was rejected.${reason ? ` Reason: ${reason}` : ''}`,
    { type: 'payment' }
  ),

  newCourseWork: (className, title) => sendLocalNotification(
    'New Course Material',
    `${title} has been added for ${className}`,
    { type: 'coursework' }
  ),

  attendanceMarked: (className, status) => sendLocalNotification(
    'Attendance Marked',
    `You were marked ${status} for ${className} today`,
    { type: 'attendance' }
  ),

  welcome: (name) => sendLocalNotification(
    'Welcome to XenEdu!',
    `Hi ${name}! Your account is ready. Start exploring your classes.`,
    { type: 'welcome' }
  ),

  registrationApproved: (admissionNumber) => sendLocalNotification(
    'Registration Approved',
    `Your registration has been approved. Admission number: ${admissionNumber}`,
    { type: 'registration' }
  ),

  sessionCancelled: (className, date) => sendLocalNotification(
    'Class Cancelled',
    `${className} session on ${date} has been cancelled`,
    { type: 'session' }
  ),

  newSession: (className, date, time) => sendLocalNotification(
    'New Class Scheduled',
    `${className} has a new session on ${date} at ${time}`,
    { type: 'session' }
  ),
};
