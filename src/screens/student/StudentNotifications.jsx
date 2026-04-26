import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Switch, Alert,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import { notify } from '../../utils/notifications';
import { COLORS } from '../../utils/constants';

const StudentNotifications = () => {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [settings, setSettings] = useState({
    feeReminders: true,
    attendanceAlerts: true,
    paymentUpdates: true,
    courseWork: true,
  });

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionGranted(status === 'granted');
    } catch (err) {
      console.log('Permission check error:', err.message);
    }
  };

  const requestPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionGranted(status === 'granted');
      if (status === 'granted') {
        Alert.alert('✅ Enabled!', 'You will now receive XenEdu notifications!');
      } else {
        Alert.alert('❌ Denied', 'Please enable notifications in your phone settings.');
      }
    } catch (err) {
      console.log('Permission request error:', err.message);
    }
  };

  const testNotification = async (type) => {
    try {
      switch (type) {
        case 'fee': await notify.feeReminder('Biology Theory 2026', 3000, '2026-04'); break;
        case 'attendance': await notify.attendanceAlert('Physics Grade 13', 72); break;
        case 'payment': await notify.paymentApproved('Chemistry', 2500, 'XE-001234'); break;
        case 'coursework': await notify.newCourseWork('Combined Maths', 'Chapter 5 Notes'); break;
      }
      Alert.alert('Sent! 🔔', 'Check your notification bar!');
    } catch (err) {
      Alert.alert('Error', 'Could not send notification: ' + err.message);
    }
  };

  const notificationTypes = [
    { key: 'feeReminders', icon: 'card-outline', color: '#EF4444', label: 'Fee Reminders', desc: 'Get notified about unpaid fees' },
    { key: 'attendanceAlerts', icon: 'warning-outline', color: '#F59E0B', label: 'Attendance Alerts', desc: 'Alert when attendance drops below 80%' },
    { key: 'paymentUpdates', icon: 'checkmark-circle-outline', color: '#10B981', label: 'Payment Updates', desc: 'Notifications when payment is approved/rejected' },
    { key: 'courseWork', icon: 'book-outline', color: '#8B5CF6', label: 'Course Materials', desc: 'When teacher uploads new materials' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notifications</Text>
        <Text style={styles.headerSub}>Manage your notification preferences</Text>
      </View>

      <ScrollView style={styles.scroll}>

        {/* Permission status */}
        <View style={[styles.card, { backgroundColor: permissionGranted ? '#F0FBF7' : '#FEF2F2' }]}>
          <View style={styles.permRow}>
            <Ionicons
              name={permissionGranted ? 'notifications' : 'notifications-off'}
              size={28}
              color={permissionGranted ? '#10B981' : '#EF4444'}
            />
            <View style={styles.permInfo}>
              <Text style={styles.permTitle}>
                {permissionGranted ? '✅ Notifications Enabled' : '❌ Notifications Disabled'}
              </Text>
              <Text style={styles.permDesc}>
                {permissionGranted
                  ? 'You will receive XenEdu notifications'
                  : 'Enable notifications to stay updated'}
              </Text>
            </View>
          </View>
          {!permissionGranted && (
            <TouchableOpacity style={styles.enableBtn} onPress={requestPermissions}>
              <Text style={styles.enableBtnText}>Enable Notifications</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notification types */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Notification Types</Text>
          {notificationTypes.map((type, i) => (
            <View key={i} style={styles.typeRow}>
              <View style={[styles.typeIcon, { backgroundColor: type.color + '20' }]}>
                <Ionicons name={type.icon} size={20} color={type.color} />
              </View>
              <View style={styles.typeInfo}>
                <Text style={styles.typeLabel}>{type.label}</Text>
                <Text style={styles.typeDesc}>{type.desc}</Text>
              </View>
              <Switch
                value={settings[type.key]}
                onValueChange={val => setSettings(prev => ({ ...prev, [type.key]: val }))}
                trackColor={{ false: '#E0E0E0', true: COLORS.primary + '80' }}
                thumbColor={settings[type.key] ? COLORS.primary : '#F4F3F4'}
              />
            </View>
          ))}
        </View>

        {/* Test notifications */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Test Notifications</Text>
          <Text style={styles.testDesc}>Tap to send a test notification to your phone</Text>
          <View style={styles.testGrid}>
            {[
              { type: 'fee', label: 'Fee Reminder', color: '#EF4444', icon: 'card' },
              { type: 'attendance', label: 'Attendance Alert', color: '#F59E0B', icon: 'warning' },
              { type: 'payment', label: 'Payment Update', color: '#10B981', icon: 'checkmark-circle' },
              { type: 'coursework', label: 'New Material', color: '#8B5CF6', icon: 'book' },
            ].map((test, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.testBtn, { borderColor: test.color }]}
                onPress={() => testNotification(test.type)}
              >
                <Ionicons name={test.icon} size={20} color={test.color} />
                <Text style={[styles.testBtnText, { color: test.color }]}>{test.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            Notifications help you stay on top of fees, attendance and course updates. You can change these settings anytime.
          </Text>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { padding: 24, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  permInfo: { flex: 1 },
  permTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  permDesc: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  enableBtn: { backgroundColor: COLORS.primary, borderRadius: 10, padding: 12, alignItems: 'center' },
  enableBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  typeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  typeDesc: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  testDesc: { fontSize: 12, color: COLORS.gray, marginBottom: 12 },
  testGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  testBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, backgroundColor: COLORS.white, width: '47%',
  },
  testBtnText: { fontSize: 12, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: '#F0FBF7', borderRadius: 14, padding: 14,
    marginHorizontal: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#C8EDE2',
  },
  infoText: { flex: 1, fontSize: 13, color: COLORS.primary, lineHeight: 18 },
});

export default StudentNotifications;