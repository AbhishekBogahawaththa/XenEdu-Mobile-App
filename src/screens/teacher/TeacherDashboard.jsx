import { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const getDateLabel = (dateStr) => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const isSameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
  if (isSameDay(date, today)) return 'TODAY';
  if (isSameDay(date, tomorrow)) return 'TOMORROW';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
};

const getStatusColor = (status) => {
  if (status === 'completed') return '#10B981';
  if (status === 'cancelled') return '#EF4444';
  if (status === 'rescheduled') return '#F59E0B';
  return COLORS.primary;
};

const getStatusIcon = (status) => {
  if (status === 'completed') return 'checkmark-circle';
  if (status === 'cancelled') return 'close-circle';
  if (status === 'rescheduled') return 'time';
  return 'radio-button-on';
};

const StudentsModal = ({ cls, onClose }) => {
  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['teacher-class-detail', cls._id],
    queryFn: () => api.get(`/classes/${cls._id}`).then(r => r.data),
  });

  const { data: attendanceSummary } = useQuery({
    queryKey: ['teacher-attendance-summary', cls._id],
    queryFn: async () => {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      try {
        const sessions = await api.get(`/sessions/class/${cls._id}?month=${month}`).then(r => r.data);
        const completedSessions = sessions?.sessions?.filter(s => s.status === 'completed') || [];
        const studentMap = {};
        for (const session of completedSessions.slice(-10)) {
          try {
            const att = await api.get(`/attendance/session/${session._id}`).then(r => r.data);
            att.attendance?.forEach(a => {
              const id = String(a.studentId?._id || a.studentId);
              if (!studentMap[id]) studentMap[id] = { present: 0, absent: 0, late: 0, total: 0 };
              studentMap[id][a.status] = (studentMap[id][a.status] || 0) + 1;
              studentMap[id].total++;
            });
          } catch {}
        }
        return { studentMap, totalSessions: completedSessions.length };
      } catch {
        return { studentMap: {}, totalSessions: 0 };
      }
    },
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={sStyles.container}>
        <View style={sStyles.header}>
          <View>
            <Text style={sStyles.title}>Students</Text>
            <Text style={sStyles.subtitle}>{cls.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={sStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        {attendanceSummary?.totalSessions > 0 && (
          <View style={sStyles.summaryBanner}>
            <Ionicons name="stats-chart" size={16} color={COLORS.primary} />
            <Text style={sStyles.summaryText}>
              Based on {attendanceSummary.totalSessions} sessions this month
            </Text>
          </View>
        )}

        <ScrollView style={sStyles.scroll}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : classDetail?.class?.enrolledStudents?.length === 0 ? (
            <View style={sStyles.empty}>
              <Ionicons name="people-outline" size={48} color={COLORS.gray} />
              <Text style={sStyles.emptyText}>No students enrolled yet</Text>
            </View>
          ) : (
            <View style={sStyles.list}>
              {classDetail?.class?.enrolledStudents?.map((student, i) => {
                const attData = attendanceSummary?.studentMap?.[String(student._id)];
                const total = attData?.total || 0;
                const present = attData?.present || 0;
                const absent = attData?.absent || 0;
                const late = attData?.late || 0;
                const pct = total > 0 ? Math.round(((present + late) / total) * 100) : null;
                return (
                  <View key={i} style={sStyles.studentCard}>
                    <View style={sStyles.studentHeader}>
                      <View style={sStyles.avatar}>
                        <Text style={sStyles.avatarText}>{student.userId?.name?.charAt(0)}</Text>
                      </View>
                      <View style={sStyles.studentInfo}>
                        <Text style={sStyles.studentName}>{student.userId?.name}</Text>
                        <Text style={sStyles.studentDetail}>{student.admissionNumber} • {student.grade}</Text>
                        {student.parentId && (
                          <View style={sStyles.parentRow}>
                            <Ionicons name="call-outline" size={12} color={COLORS.primary} />
                            <Text style={sStyles.parentPhone}>{student.parentId?.contactNumber || 'No contact'}</Text>
                          </View>
                        )}
                      </View>
                      {pct !== null && (
                        <Text style={[sStyles.attPct, { color: pct >= 80 ? '#10B981' : '#EF4444' }]}>{pct}%</Text>
                      )}
                    </View>
                    {pct !== null && (
                      <View style={sStyles.attSection}>
                        <View style={sStyles.attBar}>
                          <View style={[sStyles.attFill, { width: `${pct}%`, backgroundColor: pct >= 80 ? '#10B981' : '#EF4444' }]} />
                        </View>
                        <View style={sStyles.attStats}>
                          <Text style={sStyles.attPresent}>Present: {present}</Text>
                          <Text style={sStyles.attAbsent}>Absent: {absent}</Text>
                          <Text style={sStyles.attLate}>Late: {late}</Text>
                        </View>
                        {pct < 80 && <Text style={sStyles.attWarning}>Below 80% minimum</Text>}
                        {student.paymentBlocked && (
                          <Text style={[sStyles.attWarning, { color: '#F59E0B' }]}>Payment overdue</Text>
                        )}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const sStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  summaryBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FBF7', padding: 12, paddingHorizontal: 20,
    borderBottomWidth: 1, borderBottomColor: '#C8EDE2',
  },
  summaryText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: COLORS.gray },
  list: { padding: 16, gap: 12 },
  studentCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  studentHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  studentDetail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  parentRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  parentPhone: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  attPct: { fontSize: 18, fontWeight: '800' },
  attSection: { marginTop: 4 },
  attBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 6 },
  attFill: { height: 6, borderRadius: 3 },
  attStats: { flexDirection: 'row', gap: 12 },
  attPresent: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  attAbsent: { fontSize: 11, color: '#EF4444', fontWeight: '600' },
  attLate: { fontSize: 11, color: '#F59E0B', fontWeight: '600' },
  attWarning: { fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' },
});

const UpcomingSessions = ({ classes }) => {
  const classIds = classes?.map(c => c._id) || [];
  const [showNextMonth, setShowNextMonth] = useState(false);

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const nextDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthLabel = nextDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['teacher-upcoming-sessions', classIds.join(','), showNextMonth],
    queryFn: async () => {
      const allSessions = [];
      for (const cls of classes) {
        try {
          const r1 = await api.get(`/sessions/class/${cls._id}?month=${currentMonth}`).then(r => r.data);
          let combined = [...(r1?.sessions || [])];
          if (showNextMonth) {
            const r2 = await api.get(`/sessions/class/${cls._id}?month=${nextMonth}`).then(r => r.data);
            combined = [...combined, ...(r2?.sessions || [])];
          }
          combined.forEach(s => {
            allSessions.push({ ...s, className: cls.name, subject: cls.subject, hall: cls.hall, enrolledCount: cls.enrolledCount || 0 });
          });
        } catch {}
      }
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return allSessions
        .filter(s => new Date(s.date || s.sessionDate) >= todayStart && s.status !== 'cancelled')
        .sort((a, b) => new Date(a.date || a.sessionDate) - new Date(b.date || b.sessionDate));
    },
    enabled: classIds.length > 0,
  });

  const grouped = useMemo(() => {
    if (!sessionsData) return [];
    const groups = {};
    sessionsData.forEach(s => {
      const label = getDateLabel(s.date || s.sessionDate);
      if (!groups[label]) groups[label] = [];
      groups[label].push(s);
    });
    return Object.entries(groups);
  }, [sessionsData]);

  if (isLoading) return (
    <View style={upStyles.loadingBox}>
      <ActivityIndicator color={COLORS.primary} size="small" />
      <Text style={upStyles.loadingText}>Loading sessions...</Text>
    </View>
  );

  return (
    <View>
      {!sessionsData || sessionsData.length === 0 ? (
        <View style={upStyles.emptyBox}>
          <Ionicons name="calendar-outline" size={32} color={COLORS.gray} />
          <Text style={upStyles.emptyText}>No upcoming sessions this month</Text>
        </View>
      ) : grouped.map(([label, sessions]) => (
        <View key={label}>
          <View style={upStyles.dateRow}>
            <View style={upStyles.dateLine} />
            <Text style={upStyles.dateLabel}>{label}</Text>
            <View style={upStyles.dateLine} />
          </View>
          {sessions.map((s, i) => {
            const statusColor = getStatusColor(s.status);
            const timeStr = new Date(s.date || s.sessionDate).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            return (
              <View key={i} style={[upStyles.sessionCard, { borderLeftColor: statusColor }]}>
                <Ionicons name={getStatusIcon(s.status)} size={16} color={statusColor} />
                <View style={upStyles.sessionInfo}>
                  <Text style={upStyles.sessionClass}>{s.className}</Text>
                  <Text style={upStyles.sessionSubject}>{s.subject}</Text>
                  <View style={upStyles.sessionMeta}>
                    <View style={upStyles.metaItem}><Ionicons name="time-outline" size={11} color={COLORS.gray} /><Text style={upStyles.metaText}>{timeStr}</Text></View>
                    <View style={upStyles.metaItem}><Ionicons name="location-outline" size={11} color={COLORS.gray} /><Text style={upStyles.metaText}>{s.hall}</Text></View>
                    <View style={upStyles.metaItem}><Ionicons name="people-outline" size={11} color={COLORS.gray} /><Text style={upStyles.metaText}>{s.enrolledCount} students</Text></View>
                  </View>
                </View>
                {s.status === 'rescheduled' && (
                  <View style={upStyles.rescheduledBadge}><Text style={upStyles.rescheduledText}>Rescheduled</Text></View>
                )}
              </View>
            );
          })}
        </View>
      ))}
      <TouchableOpacity style={upStyles.toggleBtn} onPress={() => setShowNextMonth(!showNextMonth)}>
        <Ionicons name={showNextMonth ? 'chevron-up' : 'chevron-down'} size={16} color={COLORS.primary} />
        <Text style={upStyles.toggleText}>{showNextMonth ? 'Hide Next Month' : `Show ${nextMonthLabel}`}</Text>
      </TouchableOpacity>
    </View>
  );
};

const upStyles = StyleSheet.create({
  loadingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 20, justifyContent: 'center' },
  loadingText: { fontSize: 13, color: COLORS.gray },
  emptyBox: { alignItems: 'center', padding: 24, gap: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8, marginTop: 4 },
  dateLine: { flex: 1, height: 1, backgroundColor: '#E0E0E0' },
  dateLabel: { fontSize: 11, fontWeight: '800', color: COLORS.gray, letterSpacing: 1 },
  sessionCard: { backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 4, elevation: 1 },
  sessionInfo: { flex: 1 },
  sessionClass: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  sessionSubject: { fontSize: 11, color: COLORS.gray, marginBottom: 4 },
  sessionMeta: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: 11, color: COLORS.gray },
  rescheduledBadge: { backgroundColor: '#FFF9E6', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#F59E0B' },
  rescheduledText: { fontSize: 10, color: '#92400E', fontWeight: '700' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8, padding: 10, backgroundColor: '#F0FBF7', borderRadius: 10, borderWidth: 1, borderColor: COLORS.primary },
  toggleText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
});

const TeacherDashboard = () => {
  const { user, logout } = useAuthStore();
  const [selectedClass, setSelectedClass] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: myClasses, isLoading, refetch } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const onRefresh = async () => { setRefreshing(true); await refetch(); setRefreshing(false); };
  const classes = myClasses?.classes || [];
  const totalStudents = classes.reduce((s, c) => s + (c.enrolledCount || 0), 0);

  return (
    <View style={styles.container}>
      {selectedClass && (
        <StudentsModal cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back!</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Teacher</Text>
        </View>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.white} />}
      >
        <View style={styles.statsRow}>
          {[
            { label: 'My Classes', value: myClasses?.count ?? 0, icon: 'book', color: '#3B82F6' },
            { label: 'Total Students', value: totalStudents, icon: 'people', color: '#10B981' },
          ].map((stat, i) => (
            <View key={i} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <Text style={styles.sectionSub}>This month</Text>
          </View>
          <View style={styles.sectionCard}>
            {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} /> : <UpcomingSessions classes={classes} />}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Classes</Text>
          {isLoading ? <ActivityIndicator color={COLORS.primary} /> : classes.map((cls, i) => (
            <View key={i} style={styles.classCard}>
              <View style={styles.classHeader}>
                <View style={styles.classIconBox}>
                  <Ionicons name="book-outline" size={22} color={COLORS.primary} />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classDetail}>{cls.subject} • {cls.grade}</Text>
                  <Text style={styles.classDetail}>{cls.schedule?.dayOfWeek} at {cls.schedule?.startTime} • {cls.hall}</Text>
                </View>
                <View style={styles.studentCount}>
                  <Ionicons name="people" size={16} color={COLORS.primary} />
                  <Text style={styles.studentCountText}>{cls.enrolledCount}</Text>
                </View>
              </View>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.studentsBtn} onPress={() => setSelectedClass(cls)}>
                  <Ionicons name="people-outline" size={14} color={COLORS.primary} />
                  <Text style={styles.studentsBtnText}>View Students</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

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
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 20 },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  role: { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24 },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 16, alignItems: 'center', elevation: 2 },
  statIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  statValue: { fontSize: 28, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  statLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  sectionSub: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  sectionCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 14, elevation: 2 },
  classCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  classHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  classIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  classDetail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  studentCount: { alignItems: 'center', gap: 2 },
  studentCountText: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  actionRow: { flexDirection: 'row', gap: 8 },
  studentsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FBF7', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.primary },
  studentsBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginHorizontal: 20, padding: 16, backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12 },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default TeacherDashboard;
