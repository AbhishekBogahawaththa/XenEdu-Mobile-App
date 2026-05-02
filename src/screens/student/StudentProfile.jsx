import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

// ── Change Password Modal ─────────────────────────────────────────
const ChangePasswordModal = ({ onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields'); return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters'); return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match'); return;
    }
    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success!', 'Password changed successfully!', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={cpStyles.container}>
        <View style={cpStyles.header}>
          <Text style={cpStyles.title}>Change Password</Text>
          <TouchableOpacity onPress={onClose} style={cpStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={cpStyles.scroll} contentContainerStyle={{ padding: 20 }}>
          <View style={cpStyles.infoBanner}>
            <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.primary} />
            <Text style={cpStyles.infoText}>Choose a strong password with at least 6 characters.</Text>
          </View>

          <Text style={cpStyles.fieldLabel}>Current Password</Text>
          <View style={cpStyles.inputRow}>
            <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} />
            <TextInput value={currentPassword} onChangeText={setCurrentPassword}
              placeholder="Enter current password" placeholderTextColor={COLORS.gray}
              style={cpStyles.input} secureTextEntry={!showCurrent} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
              <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <Text style={cpStyles.fieldLabel}>New Password</Text>
          <View style={cpStyles.inputRow}>
            <Ionicons name="lock-open-outline" size={18} color={COLORS.gray} />
            <TextInput value={newPassword} onChangeText={setNewPassword}
              placeholder="Enter new password" placeholderTextColor={COLORS.gray}
              style={cpStyles.input} secureTextEntry={!showNew} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          <Text style={cpStyles.fieldLabel}>Confirm New Password</Text>
          <View style={cpStyles.inputRow}>
            <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.gray} />
            <TextInput value={confirmPassword} onChangeText={setConfirmPassword}
              placeholder="Confirm new password" placeholderTextColor={COLORS.gray}
              style={cpStyles.input} secureTextEntry={!showConfirm} autoCapitalize="none" />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray} />
            </TouchableOpacity>
          </View>

          {newPassword.length > 0 && (
            <View style={cpStyles.strengthRow}>
              {[1,2,3,4].map(i => (
                <View key={i} style={[cpStyles.strengthBar, {
                  backgroundColor: newPassword.length >= i * 3 ?
                    (newPassword.length >= 10 ? '#10B981' : newPassword.length >= 6 ? '#F59E0B' : '#EF4444') : '#E0E0E0'
                }]} />
              ))}
              <Text style={cpStyles.strengthText}>
                {newPassword.length >= 10 ? 'Strong' : newPassword.length >= 6 ? 'Medium' : 'Weak'}
              </Text>
            </View>
          )}

          <TouchableOpacity style={[cpStyles.submitBtn, loading && cpStyles.submitBtnDisabled]}
            onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={cpStyles.submitBtnText}>Change Password</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const cpStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#F0FBF7', borderRadius: 12, padding: 14, marginBottom: 24, borderWidth: 1, borderColor: '#C8EDE2' },
  infoText: { fontSize: 13, color: COLORS.primary, flex: 1, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 12, padding: 14, borderWidth: 1.5, borderColor: '#E0E0E0' },
  input: { flex: 1, fontSize: 15, color: COLORS.dark },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginLeft: 4 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 28 },
  submitBtnDisabled: { backgroundColor: COLORS.gray },
  submitBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 16 },
});

// ── Main Profile Screen ───────────────────────────────────────────
const StudentProfile = () => {
  const { user, logout } = useAuthStore();
  const [showChangePassword, setShowChangePassword] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

  const { data: alertsData } = useQuery({
    queryKey: ['student-attendance-alerts'],
    queryFn: () => api.get('/attendance/alerts').then(r => r.data),
  });

  const alerts = alertsData?.alerts || [];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const InfoRow = ({ icon, label, value }) => (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color={COLORS.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || 'N/A'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {showChangePassword && (
        <ChangePasswordModal onClose={() => setShowChangePassword(false)} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>STUDENT</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Student info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Student Information</Text>
          <InfoRow icon="card-outline" label="Admission Number" value={dashboard?.student?.admissionNumber} />
          <InfoRow icon="school-outline" label="School" value={dashboard?.student?.school} />
          <InfoRow icon="book-outline" label="Grade" value={dashboard?.student?.grade} />
          <InfoRow icon="layers-outline" label="Stream" value={dashboard?.student?.stream} />
          <InfoRow icon="language-outline" label="Medium" value={dashboard?.student?.medium} />
        </View>

        {/* Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>My Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { label: 'Classes', value: dashboard?.enrolledClasses?.length ?? 0, color: '#3B82F6' },
              { label: 'Attendance', value: `${dashboard?.overallAttendance ?? 0}%`, color: '#10B981' },
              { label: 'Unpaid Fees', value: `Rs.${dashboard?.totalUnpaid ?? 0}`, color: '#EF4444' },
            ].map((stat, i) => (
              <View key={i} style={[styles.statBox, { borderColor: stat.color + '30' }]}>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowChangePassword(true)}>
            <View style={styles.actionIconBox}>
              <Ionicons name="lock-closed-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionBtnText}>Change Password</Text>
              <Text style={styles.actionBtnSub}>Update your account password</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        {/* ── Attendance Alerts ─────────────────────────────────── */}
        {alerts.length > 0 && (
          <View style={styles.alertsCard}>
            <View style={styles.alertsHeader}>
              <Ionicons name="warning-outline" size={16} color="#F59E0B" />
              <Text style={styles.alertsTitle}>Attendance Alerts</Text>
              <View style={styles.alertsBadge}>
                <Text style={styles.alertsBadgeText}>{alerts.length}</Text>
              </View>
            </View>
            {alerts.map((alert, i) => (
              <View key={i} style={[styles.alertRow, {
                borderLeftColor: alert.risk === 'critical' ? '#EF4444' : '#F59E0B'
              }]}>
                <View style={styles.alertLeft}>
                  <Text style={styles.alertClass} numberOfLines={1}>{alert.class}</Text>
                  <Text style={styles.alertSessions}>{alert.presentCount}/{alert.totalSessions} sessions attended</Text>
                </View>
                <Text style={[styles.alertPct, {
                  color: alert.risk === 'critical' ? '#EF4444' : '#F59E0B'
                }]}>{alert.attendancePercentage}%</Text>
              </View>
            ))}
            <Text style={styles.alertsFooter}>Minimum attendance required: 80%</Text>
          </View>
        )}

        {/* App info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>XenEdu Mobile</Text>
          <Text style={styles.appVersion}>Version 1.0.0 • Mirigama</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 32 },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.gold, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  badge: { backgroundColor: COLORS.gold, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600', marginTop: 1 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: { flex: 1, alignItems: 'center', padding: 12, backgroundColor: '#FAFAFA', borderRadius: 12, borderWidth: 1 },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  actionIconBox: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  actionContent: { flex: 1 },
  actionBtnText: { fontSize: 15, color: COLORS.dark, fontWeight: '600' },
  actionBtnSub: { fontSize: 12, color: COLORS.gray, marginTop: 1 },

  // Alerts section
  alertsCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 14, elevation: 2,
    borderWidth: 1, borderColor: '#FFF3CD',
  },
  alertsHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  alertsTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, flex: 1 },
  alertsBadge: { backgroundColor: '#F59E0B', borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  alertsBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8,
    backgroundColor: '#FFFBEB', marginBottom: 6, borderLeftWidth: 3,
  },
  alertLeft: { flex: 1, marginRight: 8 },
  alertClass: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  alertSessions: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  alertPct: { fontSize: 18, fontWeight: '800' },
  alertsFooter: { fontSize: 11, color: COLORS.gray, textAlign: 'center', marginTop: 6 },

  appInfo: { alignItems: 'center', marginBottom: 12 },
  appName: { fontSize: 14, fontWeight: '700', color: COLORS.gray },
  appVersion: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default StudentProfile;