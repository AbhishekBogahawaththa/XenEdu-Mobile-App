import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const StudentProfile = () => {
  const { user, logout } = useAuthStore();

  const { data: dashboard } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

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

        {/* Actions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account</Text>
          <TouchableOpacity style={styles.actionBtn}>
            <Ionicons name="lock-closed-outline" size={20} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.gray} />
          </TouchableOpacity>
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
  header: {
    alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 32,
  },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: COLORS.primary },
  name: { fontSize: 22, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 10 },
  badge: {
    backgroundColor: COLORS.gold, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 20,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 14, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  infoIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', textTransform: 'uppercase' },
  infoValue: { fontSize: 14, color: COLORS.dark, fontWeight: '600', marginTop: 1 },
  statsGrid: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, alignItems: 'center', padding: 12,
    backgroundColor: '#FAFAFA', borderRadius: 12,
    borderWidth: 1,
  },
  statValue: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 8,
  },
  actionBtnText: { flex: 1, fontSize: 15, color: COLORS.dark, fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 16, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default StudentProfile;