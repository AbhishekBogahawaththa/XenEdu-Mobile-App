import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import ZenyaChat from '../../components/ZenyaChat';
import { notify } from '../../utils/notifications';

const StudentDashboard = () => {
  const { user, logout } = useAuthStore();
  const navigation = useNavigation();
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [notified, setNotified] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

  const dashData = data || dashboard;

  useEffect(() => {
    if (data && !notified) {
      setDashboard(data);
      setNotified(true);

      if (data?.fees?.totalOutstanding > 0) {
        const unpaid = data?.fees?.unpaidFees;
        if (unpaid && unpaid.length > 0) {
          notify.feeReminder(unpaid[0].class, unpaid[0].amount, unpaid[0].month);
        }
      }

      data?.enrolledClasses?.forEach(cls => {
        if (cls.atRisk) {
          notify.attendanceAlert(cls.className, parseInt(cls.percentage));
        }
      });
    }
  }, [data]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerGreeting}>Welcome back!</Text>
            <Text style={styles.headerName}>{user?.name}</Text>
            <Text style={styles.headerRole}>Student</Text>
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
          <View style={styles.statsRow}>
            {[
              { label: 'Classes', value: dashData?.enrolledClasses?.length ?? 0, icon: 'book', color: '#3B82F6', screen: 'Classes' },
              { label: 'Attendance', value: `${dashData?.overallAttendance ?? 0}%`, icon: 'checkmark-circle', color: '#10B981', screen: 'Attendance' },
              { label: 'Unpaid', value: `Rs.${dashData?.fees?.totalOutstanding ?? 0}`, icon: 'card', color: '#EF4444', screen: 'Classes' },
            ].map((stat, i) => (
              <TouchableOpacity key={i} style={styles.statCard} onPress={() => navigation.navigate(stat.screen)} activeOpacity={0.7}>
                <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                  <Ionicons name={stat.icon} size={22} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* My Classes */}
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>My Classes</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Classes')}>
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>

            {dashData?.enrolledClasses?.length === 0 && (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyText}>No classes enrolled yet</Text>
              </View>
            )}

            {dashData?.enrolledClasses?.map((cls, i) => (
              <TouchableOpacity
                key={i}
                style={styles.classCard}
                onPress={() => navigation.navigate('Classes')}
                activeOpacity={0.7}
              >
                <View style={styles.classIcon}>
                  <Ionicons name="book-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.className}</Text>
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
              </TouchableOpacity>
            ))}
          </View>

          {/* Fee Alert */}
          {dashData?.fees?.totalOutstanding > 0 && (
            <View style={styles.feeAlert}>
              <Ionicons name="warning" size={20} color="#F59E0B" />
              <View style={styles.feeAlertText}>
                <Text style={styles.feeAlertTitle}>Outstanding Fees</Text>
                <Text style={styles.feeAlertSub}>
                  Rs. {dashData?.fees?.totalOutstanding?.toLocaleString()} unpaid
                </Text>
              </View>
            </View>
          )}

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() =>
              Alert.alert('Logout', 'Are you sure you want to logout?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', style: 'destructive', onPress: logout },
              ])
            }
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>

      {/* Zenya Chat FAB */}
      <ZenyaChat />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 56, paddingBottom: 20,
  },
  headerGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  headerName: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  headerRole: { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24,
  },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  emptyCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.gray, fontSize: 14 },
  classCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  classIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center',
  },
  classInfo: { flex: 1 },
  className: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 2 },
  classDetail: { fontSize: 12, color: COLORS.gray },
  classRight: { alignItems: 'flex-end' },
  classFee: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  classFeeSub: { fontSize: 10, color: COLORS.gray },
  attBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  attText: { fontSize: 11, fontWeight: '700' },
  feeAlert: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF9E6', borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginBottom: 20,
    borderWidth: 1, borderColor: '#F5C518',
  },
  feeAlertText: { flex: 1 },
  feeAlertTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  feeAlertSub: { fontSize: 12, color: '#92400E', opacity: 0.8 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default StudentDashboard;
