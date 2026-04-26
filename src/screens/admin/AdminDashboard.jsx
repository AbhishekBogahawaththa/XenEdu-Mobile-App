import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const AdminDashboard = ({ navigation }) => {
  const { user, logout } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => api.get('/students').then(r => r.data),
  });

  const { data: classes, isLoading: loadingClasses } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const { data: teachers } = useQuery({
    queryKey: ['admin-teachers'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  });

  const { data: outstanding } = useQuery({
    queryKey: ['admin-outstanding'],
    queryFn: () => api.get('/fees/outstanding').then(r => r.data),
  });

  const { data: paymentRequests } = useQuery({
    queryKey: ['admin-payment-requests'],
    queryFn: () => api.get('/payment-requests?status=pending').then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const totalStudents = students?.total || students?.students?.length || 0;
  const activeStudents = students?.students?.filter(s => s.status === 'active').length || 0;
  const totalClasses = classes?.count || classes?.classes?.length || 0;
  const totalTeachers = teachers?.total || teachers?.teachers?.length || 0;
  const totalOutstanding = outstanding?.totalOutstanding || 0;
  const pendingRequests = paymentRequests?.requests?.length || 0;

  const stats = [
    { label: 'Students', value: totalStudents, icon: 'people', color: '#3B82F6', sub: `${activeStudents} active` },
    { label: 'Classes', value: totalClasses, icon: 'book', color: '#10B981', sub: 'total classes' },
    { label: 'Teachers', value: totalTeachers, icon: 'person', color: '#8B5CF6', sub: 'on staff' },
    { label: 'Outstanding', value: `Rs.${totalOutstanding.toLocaleString()}`, icon: 'card', color: '#EF4444', sub: 'unpaid fees' },
    { label: 'Pending', value: pendingRequests, icon: 'time', color: '#F59E0B', sub: 'payment requests' },
  ];

  const quickActions = [
    { label: 'View Students', icon: 'people-outline', color: '#3B82F6', screen: 'Students' },
    { label: 'View Classes', icon: 'book-outline', color: '#10B981', screen: 'Classes' },
    { label: 'Reports', icon: 'bar-chart-outline', color: '#8B5CF6', screen: 'Reports' },
    { label: 'Payment Requests', icon: 'card-outline', color: '#F59E0B', screen: 'Fees', badge: pendingRequests },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Administrator</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
      >
        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            {stats.map((stat, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statSub}>{stat.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + '20' }]}>
                  <Ionicons name={action.icon} size={24} color={action.color} />
                  {action.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.actionLabel}>{action.label}</Text>
                <Text style={[styles.actionArrow, { color: action.color }]}>→</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent classes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Classes</Text>
          {loadingClasses ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : classes?.classes?.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No classes found</Text>
            </View>
          ) : (
            classes?.classes?.slice(0, 5).map((cls, i) => (
              <View key={i} style={styles.classRow}>
                <View style={styles.classIcon}>
                  <Text>📚</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classDetail}>{cls.subject} • {cls.grade}</Text>
                  <Text style={styles.classDetail}>{cls.schedule?.dayOfWeek} • {cls.hall}</Text>
                </View>
                <View style={styles.classRight}>
                  <Text style={styles.classStudents}>{cls.enrolledCount}</Text>
                  <Text style={styles.classStudentsSub}>students</Text>
                </View>
              </View>
            ))
          )}
        </View>

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
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 56, paddingBottom: 20,
  },
  greeting: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  role: { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#1a1a2e' },
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24,
  },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  statSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  actionIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative',
  },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: '#EF4444', borderRadius: 10,
    minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  actionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.dark, textAlign: 'center', marginBottom: 4 },
  actionArrow: { fontSize: 16, fontWeight: '800' },
  classRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, elevation: 1,
  },
  classIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center',
  },
  classInfo: { flex: 1 },
  className: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  classDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  classRight: { alignItems: 'center' },
  classStudents: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  classStudentsSub: { fontSize: 10, color: COLORS.gray },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 20, alignItems: 'center' },
  emptyText: { color: COLORS.gray, fontSize: 14 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default AdminDashboard;