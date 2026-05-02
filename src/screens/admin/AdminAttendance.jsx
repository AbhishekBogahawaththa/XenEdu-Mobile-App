import { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const getMonthLabel = (monthStr) => {
  const [year, month] = monthStr.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const changeMonth = (current, dir) => {
  const [year, month] = current.split('-').map(Number);
  const date = new Date(year, month - 1 + dir, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const statusConfig = {
  scheduled: { color: '#3B82F6', label: 'Scheduled' },
  completed: { color: '#10B981', label: 'Completed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
};

const AdminAttendance = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { data: classes } = useQuery({
    queryKey: ['admin-att-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['admin-att-sessions', selectedClassId, selectedMonth],
    queryFn: () => api.get(`/sessions/class/${selectedClassId}?month=${selectedMonth}`).then(r => r.data),
    enabled: !!selectedClassId,
  });

  const { data: sessionStudents, isLoading: loadingStudents } = useQuery({
    queryKey: ['admin-att-students', selectedSession?._id],
    queryFn: async () => {
      const classId = selectedSession.classId?._id || selectedSession.classId;
      const [clsRes, attRes] = await Promise.all([
        api.get(`/classes/${classId}`),
        api.get(`/attendance/session/${selectedSession._id}`),
      ]);
      const existingMap = {};
      attRes.data.attendance?.forEach(a => {
        const id = String(a.studentId?._id || a.studentId);
        existingMap[id] = a.status;
      });
      const students = clsRes.data.class?.enrolledStudents || [];
      const initialMap = {};
      students.forEach(s => { initialMap[String(s._id)] = existingMap[String(s._id)] || 'present'; });
      return { students, initialMap };
    },
    enabled: !!selectedSession,
  });

  useEffect(() => {
    if (sessionStudents?.initialMap) setAttendanceMap(sessionStudents.initialMap);
  }, [sessionStudents]);

  const { data: alerts } = useQuery({
    queryKey: ['admin-att-alerts'],
    queryFn: () => api.get('/attendance/alerts').then(r => r.data),
    enabled: activeTab === 'alerts',
  });

  const generateMutation = useMutation({
    mutationFn: ({ classId, month }) => api.post('/sessions/generate', { classId, month }),
    onSuccess: (res) => {
      Alert.alert('Done', res.data.message);
      queryClient.invalidateQueries(['admin-att-sessions']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async () => {
      const records = Object.entries(attendanceMap).map(([studentId, status]) => ({ studentId, status }));
      await api.post(`/attendance/session/${selectedSession._id}`, { records });
      await api.patch(`/sessions/${selectedSession._id}/complete`).catch(() => {});
    },
    onSuccess: () => {
      Alert.alert('Saved!', 'Attendance saved and session completed.');
      queryClient.invalidateQueries(['admin-att-sessions']);
      queryClient.invalidateQueries(['admin-att-students']);
      setSelectedSession(null);
      setAttendanceMap({});
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const markAll = (status) => {
    const map = {};
    sessionStudents?.students?.forEach(s => { map[String(s._id)] = status; });
    setAttendanceMap(map);
  };

  const presentCount = Object.values(attendanceMap).filter(s => s === 'present').length;
  const absentCount = Object.values(attendanceMap).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendanceMap).filter(s => s === 'late').length;
  const total = sessionStudents?.students?.length || 0;

  // If session selected, show attendance marking view
  if (selectedSession) {
    return (
      <View style={styles.container}>
        <View style={styles.sessionHeader}>
          <TouchableOpacity onPress={() => { setSelectedSession(null); setAttendanceMap({}); }} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={COLORS.white} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.sessionHeaderTitle}>Mark Attendance</Text>
            <Text style={styles.sessionHeaderSub}>
              {new Date(selectedSession.date || selectedSession.sessionDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              {' • '}{selectedSession.hall}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: total, color: COLORS.white },
            { label: 'Present', value: presentCount, color: '#4ADE80' },
            { label: 'Absent', value: absentCount, color: '#F87171' },
            { label: 'Late', value: lateCount, color: '#FBBF24' },
          ].map((s, i) => (
            <View key={i} style={styles.statItem}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Bulk buttons */}
        <View style={styles.bulkRow}>
          {[
            { label: 'All Present', status: 'present', color: '#10B981' },
            { label: 'All Absent', status: 'absent', color: '#EF4444' },
            { label: 'All Late', status: 'late', color: '#F59E0B' },
          ].map(b => (
            <TouchableOpacity key={b.status} style={[styles.bulkBtn, { borderColor: b.color }]} onPress={() => markAll(b.status)}>
              <Text style={[styles.bulkBtnText, { color: b.color }]}>{b.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Students */}
        <ScrollView style={styles.studentScroll}>
          {loadingStudents ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> :
            sessionStudents?.students?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>No students enrolled</Text>
              </View>
            ) : sessionStudents?.students?.map((student, i) => {
              const status = attendanceMap[String(student._id)] || 'present';
              return (
                <View key={i} style={styles.studentCard}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentAvatarText}>{student.userId?.name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.userId?.name}</Text>
                    <Text style={styles.studentAdm}>{student.admissionNumber}</Text>
                  </View>
                  <View style={styles.statusBtns}>
                    {[
                      { key: 'present', color: '#10B981', label: 'P' },
                      { key: 'absent', color: '#EF4444', label: 'A' },
                      { key: 'late', color: '#F59E0B', label: 'L' },
                    ].map(s => (
                      <TouchableOpacity
                        key={s.key}
                        style={[styles.statusBtn, { borderColor: s.color, backgroundColor: status === s.key ? s.color : 'transparent' }]}
                        onPress={() => setAttendanceMap(prev => ({ ...prev, [String(student._id)]: s.key }))}
                      >
                        <Text style={[styles.statusBtnText, { color: status === s.key ? COLORS.white : s.color }]}>{s.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}
          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Save button */}
        {total > 0 && (
          <View style={styles.saveBar}>
            <Text style={styles.saveBarText}>{presentCount}P • {absentCount}A • {lateCount}L</Text>
            <TouchableOpacity
              style={[styles.saveBtn, markAttendanceMutation.isPending && { opacity: 0.6 }]}
              onPress={() => markAttendanceMutation.mutate()}
              disabled={markAttendanceMutation.isPending}
            >
              {markAttendanceMutation.isPending ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                <Text style={styles.saveBtnText}>Save & Complete</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSub}>Manage sessions & mark attendance</Text>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Tabs */}
        <View style={styles.tabRow}>
          {[
            { key: 'sessions', label: 'Sessions', icon: 'calendar-outline' },
            { key: 'alerts', label: 'Alerts', icon: 'warning-outline' },
          ].map(t => (
            <TouchableOpacity key={t.key}
              style={[styles.tab, activeTab === t.key && styles.tabActive]}
              onPress={() => setActiveTab(t.key)}>
              <Ionicons name={t.icon} size={16} color={activeTab === t.key ? COLORS.primary : COLORS.gray} />
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === 'sessions' && (
          <>
            {/* Class selector */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionLabel}>Select Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.classChips}>
                  {classes?.classes?.map(cls => (
                    <TouchableOpacity key={cls._id}
                      style={[styles.classChip, selectedClassId === cls._id && styles.classChipActive]}
                      onPress={() => { setSelectedClassId(cls._id); setSelectedSession(null); }}>
                      <Text style={[styles.classChipText, selectedClassId === cls._id && styles.classChipTextActive]}>
                        {cls.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {selectedClassId && (
              <View style={styles.sectionCard}>
                {/* Month navigator */}
                <View style={styles.monthNav}>
                  <TouchableOpacity onPress={() => setSelectedMonth(m => changeMonth(m, -1))} style={styles.monthBtn}>
                    <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                  <Text style={styles.monthLabel}>{getMonthLabel(selectedMonth)}</Text>
                  <TouchableOpacity onPress={() => setSelectedMonth(m => changeMonth(m, 1))} style={styles.monthBtn}>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
                  </TouchableOpacity>
                </View>

                {loadingSessions ? <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} /> :
                  sessions?.sessions?.length === 0 ? (
                    <View style={styles.noSessions}>
                      <Ionicons name="calendar-outline" size={32} color={COLORS.gray} />
                      <Text style={styles.noSessionsText}>No sessions for {getMonthLabel(selectedMonth)}</Text>
                      <TouchableOpacity
                        style={styles.generateBtn}
                        onPress={() => generateMutation.mutate({ classId: selectedClassId, month: selectedMonth })}
                        disabled={generateMutation.isPending}
                      >
                        {generateMutation.isPending ? <ActivityIndicator color={COLORS.white} size="small" /> : (
                          <Text style={styles.generateBtnText}>Generate Sessions</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    sessions?.sessions?.map((session, i) => {
                      const cfg = statusConfig[session.status];
                      const date = new Date(session.date || session.sessionDate);
                      const isCancelled = session.status === 'cancelled';
                      return (
                        <TouchableOpacity
                          key={i}
                          style={[styles.sessionCard, { borderLeftColor: cfg?.color }, isCancelled && { opacity: 0.5 }]}
                          onPress={() => { if (!isCancelled) setSelectedSession(session); }}
                          disabled={isCancelled}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={styles.sessionDate}>
                              {date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </Text>
                            <Text style={styles.sessionTime}>{session.startTime} • {session.hall}</Text>
                          </View>
                          <View style={[styles.sessionStatusBadge, { backgroundColor: cfg?.color + '20' }]}>
                            <Text style={[styles.sessionStatusText, { color: cfg?.color }]}>{cfg?.label}</Text>
                          </View>
                          {!isCancelled && <Ionicons name="chevron-forward" size={16} color={COLORS.gray} />}
                        </TouchableOpacity>
                      );
                    })
                  )}
              </View>
            )}

            {!selectedClassId && (
              <View style={styles.emptyCard}>
                <Ionicons name="calendar-outline" size={48} color={COLORS.gray} />
                <Text style={styles.emptyText}>Select a class to view sessions</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'alerts' && (
          <View style={styles.sectionCard}>
            <View style={styles.alertBanner}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.alertBannerText}>Students below 80% attendance are flagged</Text>
            </View>
            {!alerts?.alerts?.length ? (
              <View style={styles.allClearBox}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                <Text style={styles.allClearText}>All students above 80%!</Text>
              </View>
            ) : alerts?.alerts?.map((alert, i) => (
              <View key={i} style={[styles.alertCard, { borderLeftColor: alert.risk === 'critical' ? '#EF4444' : '#F59E0B' }]}>
                <View style={styles.alertLeft}>
                  <Text style={styles.alertStudent}>{alert.student?.name}</Text>
                  <Text style={styles.alertClass}>{alert.class}</Text>
                  <Text style={styles.alertSessions}>{alert.presentCount}/{alert.totalSessions} sessions</Text>
                </View>
                <View style={styles.alertRight}>
                  <Text style={[styles.alertPct, { color: alert.risk === 'critical' ? '#EF4444' : '#F59E0B' }]}>
                    {alert.attendancePercentage}%
                  </Text>
                  <View style={[styles.riskBadge, { backgroundColor: alert.risk === 'critical' ? '#FEF2F2' : '#FFF9E6' }]}>
                    <Text style={[styles.riskText, { color: alert.risk === 'critical' ? '#EF4444' : '#F59E0B' }]}>
                      {alert.risk}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { padding: 24, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16 },

  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1, borderColor: '#E0E0E0' },
  tabActive: { backgroundColor: '#F0FBF7', borderColor: COLORS.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary },

  sectionCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 14, elevation: 2 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.gray, textTransform: 'uppercase', marginBottom: 10 },

  classChips: { flexDirection: 'row', gap: 8 },
  classChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0' },
  classChipActive: { backgroundColor: '#F0FBF7', borderColor: COLORS.primary },
  classChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  classChipTextActive: { color: COLORS.primary },

  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 15, fontWeight: '700', color: COLORS.dark },

  noSessions: { alignItems: 'center', padding: 24, gap: 8 },
  noSessionsText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  generateBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  generateBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },

  sessionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, backgroundColor: '#FAFAFA', marginBottom: 6, borderLeftWidth: 4, elevation: 1 },
  sessionDate: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  sessionTime: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  sessionStatusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 },
  sessionStatusText: { fontSize: 11, fontWeight: '700' },

  emptyCard: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },

  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10, marginBottom: 12 },
  alertBannerText: { fontSize: 13, color: '#92400E', fontWeight: '600' },
  allClearBox: { alignItems: 'center', padding: 24, gap: 8 },
  allClearText: { fontSize: 16, fontWeight: '700', color: '#10B981' },
  alertCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 10, backgroundColor: '#FAFAFA', marginBottom: 8, borderLeftWidth: 4, elevation: 1 },
  alertLeft: { flex: 1 },
  alertStudent: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  alertClass: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  alertSessions: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  alertRight: { alignItems: 'flex-end', gap: 4 },
  alertPct: { fontSize: 22, fontWeight: '800' },
  riskBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  riskText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },

  // Session marking view
  sessionHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  sessionHeaderTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  sessionHeaderSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 16, gap: 12 },
  statItem: { flex: 1, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 10 },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  bulkRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  bulkBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.1)' },
  bulkBtnText: { fontSize: 12, fontWeight: '700' },
  studentScroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12 },
  studentCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, padding: 12, elevation: 1 },
  studentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  studentAdm: { fontSize: 11, color: COLORS.gray },
  statusBtns: { flexDirection: 'row', gap: 6 },
  statusBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  statusBtnText: { fontSize: 12, fontWeight: '800' },
  saveBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  saveBarText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  saveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});

export default AdminAttendance;