import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const StudentDashboard = () => {
  const { user, logout } = useAuthStore();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard/student');
      setDashboard(res.data);
    } catch (err) {
      console.log('Dashboard error:', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerGreeting}>Welcome back! 👋</Text>
          <Text style={styles.headerName}>{user?.name}</Text>
          <Text style={styles.headerRole}>Student</Text>
        </View>
        <View style={styles.headerRight}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
      >
        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Classes', value: dashboard?.enrolledClasses?.length ?? 0, icon: 'book', color: '#3B82F6' },
            { label: 'Attendance', value: `${dashboard?.overallAttendance ?? 0}%`, icon: 'checkmark-circle', color: '#10B981' },
            { label: 'Unpaid', value: `Rs.${dashboard?.totalUnpaid ?? 0}`, icon: 'card', color: '#EF4444' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={22} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* My Classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          {dashboard?.enrolledClasses?.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No classes enrolled yet</Text>
            </View>
          )}
          {dashboard?.enrolledClasses?.map((cls, i) => (
            <View key={i} style={styles.classCard}>
              <View style={styles.classIcon}>
                <Text style={styles.classIconText}>📚</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classDetail}>{cls.subject} • {cls.schedule?.dayOfWeek}</Text>
                <Text style={styles.classDetail}>{cls.schedule?.startTime} • {cls.hall}</Text>
              </View>
              <View style={styles.classRight}>
                <Text style={styles.classFee}>Rs. {cls.monthlyFee?.toLocaleString()}</Text>
                <Text style={styles.classFeeSub}>/month</Text>
                <View style={[styles.attBadge, { backgroundColor: cls.atRisk ? '#FEF2F2' : '#F0FBF7' }]}>
                  <Text style={[styles.attText, { color: cls.atRisk ? '#DC2626' : '#1B6B5A' }]}>
                    {cls.percentage}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Fee Alert */}
        {dashboard?.totalUnpaid > 0 && (
          <View style={styles.feeAlert}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <View style={styles.feeAlertText}>
              <Text style={styles.feeAlertTitle}>Outstanding Fees</Text>
              <Text style={styles.feeAlertSub}>Rs. {dashboard?.totalUnpaid?.toLocaleString()} unpaid</Text>
            </View>
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 56,
    paddingBottom: 20,
  },
  headerGreeting: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  headerName: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '800',
  },
  headerRole: {
    color: COLORS.gold,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  scroll: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.gray,
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.dark,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 14,
  },
  classCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FBF7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classIconText: {
    fontSize: 22,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.dark,
    marginBottom: 2,
  },
  classDetail: {
    fontSize: 12,
    color: COLORS.gray,
  },
  classRight: {
    alignItems: 'flex-end',
  },
  classFee: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  classFeeSub: {
    fontSize: 10,
    color: COLORS.gray,
  },
  attBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 4,
  },
  attText: {
    fontSize: 11,
    fontWeight: '700',
  },
  feeAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF9E6',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  feeAlertText: {
    flex: 1,
  },
  feeAlertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  feeAlertSub: {
    fontSize: 12,
    color: '#92400E',
    opacity: 0.8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    marginBottom: 12,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default StudentDashboard;