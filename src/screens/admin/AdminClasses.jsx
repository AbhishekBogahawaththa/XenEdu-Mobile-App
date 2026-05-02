import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, RefreshControl,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS, SUBJECTS, HALLS, DAYS } from '../../utils/constants';

const GRADES = ['Grade 12', 'Grade 13'];
const MEDIUMS = ['Sinhala', 'Tamil', 'English'];

const getMonthLabel = (m) => {
  const [y, mo] = m.split('-').map(Number);
  return new Date(y, mo - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
};

const changeMonth = (cur, dir) => {
  const [y, m] = cur.split('-').map(Number);
  const d = new Date(y, m - 1 + dir, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const statusConfig = {
  scheduled: { color: '#3B82F6', label: 'Scheduled' },
  completed: { color: '#10B981', label: 'Completed' },
  cancelled: { color: '#EF4444', label: 'Cancelled' },
  rescheduled: { color: '#F59E0B', label: 'Rescheduled' },
};

// ── Add Session Modal ──────────────────────────────────────────────
const AddSessionModal = ({ cls, onClose }) => {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [startTime, setStartTime] = useState(cls.schedule?.startTime || '09:00');
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');

  const createMutation = useMutation({
    mutationFn: () => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      const durationMins = (eh * 60 + em) - (sh * 60 + sm);
      return api.post('/sessions', {
        classId: cls._id,
        date,
        startTime,
        durationMins: durationMins > 0 ? durationMins : 90,
        notes: notes || `Manual session — ${new Date(date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}`,
      });
    },
    onSuccess: () => {
      Alert.alert('Success', 'Session created!');
      queryClient.invalidateQueries(['admin-sessions', cls._id]);
      onClose();
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={asStyles.header}>
          <Text style={asStyles.title}>Add Session</Text>
          <TouchableOpacity onPress={onClose} style={asStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={asStyles.className}>{cls.name}</Text>

          <View style={asStyles.inputGroup}>
            <Text style={asStyles.label}>Date *</Text>
            <TextInput style={asStyles.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.gray} />
          </View>
          <View style={asStyles.inputGroup}>
            <Text style={asStyles.label}>Start Time *</Text>
            <TextInput style={asStyles.input} value={startTime} onChangeText={setStartTime}
              placeholder="HH:MM (e.g. 09:00)" placeholderTextColor={COLORS.gray} />
          </View>
          <View style={asStyles.inputGroup}>
            <Text style={asStyles.label}>End Time *</Text>
            <TextInput style={asStyles.input} value={endTime} onChangeText={setEndTime}
              placeholder="HH:MM (e.g. 11:00)" placeholderTextColor={COLORS.gray} />
          </View>
          <View style={asStyles.inputGroup}>
            <Text style={asStyles.label}>Notes (Optional)</Text>
            <TextInput style={[asStyles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              value={notes} onChangeText={setNotes}
              placeholder="e.g. Extra class, Revision session..."
              placeholderTextColor={COLORS.gray} multiline />
          </View>

          <TouchableOpacity
            style={[asStyles.createBtn, createMutation.isPending && { opacity: 0.6 }]}
            onPress={() => {
              if (!date || !startTime || !endTime) return Alert.alert('Error', 'Date, start time and end time required');
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? <ActivityIndicator color={COLORS.white} /> :
              <Text style={asStyles.createBtnText}>Create Session</Text>}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const asStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  className: { fontSize: 14, color: COLORS.primary, fontWeight: '700', marginBottom: 16 },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#E0E0E0' },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

// ── Session Panel ──────────────────────────────────────────────────
const SessionPanel = ({ cls }) => {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [showAddSession, setShowAddSession] = useState(false);

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['admin-sessions', cls._id, month],
    queryFn: () => api.get(`/sessions/class/${cls._id}?month=${month}`).then(r => r.data),
  });

  const generateMutation = useMutation({
    mutationFn: () => api.post('/sessions/generate', { classId: cls._id, month }),
    onSuccess: (res) => {
      Alert.alert('Done', `Generated ${res.data.created || 0} sessions, skipped ${res.data.skipped || 0} existing`);
      queryClient.invalidateQueries(['admin-sessions', cls._id]);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const completeMutation = useMutation({
    mutationFn: (id) => api.patch(`/sessions/${id}/complete`),
    onSuccess: () => { queryClient.invalidateQueries(['admin-sessions', cls._id]); },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/sessions/${id}/cancel`, { reason }),
    onSuccess: () => { queryClient.invalidateQueries(['admin-sessions', cls._id]); },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const sessions = sessionsData?.sessions || [];

  const handleCancel = (session) => {
    Alert.alert('Cancel Session', 'Reason for cancellation?', [
      { text: 'No Class Today', onPress: () => cancelMutation.mutate({ id: session._id, reason: 'No class today' }) },
      { text: 'Teacher Absent', onPress: () => cancelMutation.mutate({ id: session._id, reason: 'Teacher absent' }) },
      { text: 'Other', onPress: () => cancelMutation.mutate({ id: session._id, reason: 'Cancelled by admin' }) },
      { text: 'Back', style: 'cancel' },
    ]);
  };

  return (
    <View style={spStyles.container}>
      {showAddSession && <AddSessionModal cls={cls} onClose={() => setShowAddSession(false)} />}

      {/* Month navigator */}
      <View style={spStyles.monthNav}>
        <TouchableOpacity onPress={() => setMonth(m => changeMonth(m, -1))} style={spStyles.monthBtn}>
          <Ionicons name="chevron-back" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={spStyles.monthLabel}>{getMonthLabel(month)}</Text>
        <TouchableOpacity onPress={() => setMonth(m => changeMonth(m, 1))} style={spStyles.monthBtn}>
          <Ionicons name="chevron-forward" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View style={spStyles.actionRow}>
        <TouchableOpacity
          style={spStyles.generateBtn}
          onPress={() => Alert.alert(
            'Auto-Generate',
            `Generate sessions for ${getMonthLabel(month)} based on weekly schedule (${cls.schedule?.dayOfWeek})?`,
            [{ text: 'Cancel' }, { text: 'Generate', onPress: () => generateMutation.mutate() }]
          )}
          disabled={generateMutation.isPending}
        >
          {generateMutation.isPending ? <ActivityIndicator color={COLORS.primary} size="small" /> : (
            <>
              <Ionicons name="refresh-outline" size={14} color={COLORS.primary} />
              <Text style={spStyles.generateBtnText}>Auto-Generate</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={spStyles.addBtn} onPress={() => setShowAddSession(true)}>
          <Ionicons name="add" size={14} color={COLORS.white} />
          <Text style={spStyles.addBtnText}>Add Session</Text>
        </TouchableOpacity>
      </View>

      {/* Session stats */}
      {sessions.length > 0 && (
        <View style={spStyles.statsRow}>
          {[
            { label: 'Total', value: sessions.length, color: COLORS.dark },
            { label: 'Scheduled', value: sessions.filter(s => s.status === 'scheduled').length, color: '#3B82F6' },
            { label: 'Completed', value: sessions.filter(s => s.status === 'completed').length, color: '#10B981' },
            { label: 'Cancelled', value: sessions.filter(s => s.status === 'cancelled').length, color: '#EF4444' },
          ].map((s, i) => (
            <View key={i} style={spStyles.statItem}>
              <Text style={[spStyles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={spStyles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Sessions list */}
      {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ padding: 20 }} /> :
        sessions.length === 0 ? (
          <View style={spStyles.empty}>
            <Ionicons name="calendar-outline" size={32} color={COLORS.gray} />
            <Text style={spStyles.emptyText}>No sessions for {getMonthLabel(month)}</Text>
            <Text style={spStyles.emptySubText}>Tap "Auto-Generate" or "Add Session"</Text>
          </View>
        ) : sessions.map((session, i) => {
          const cfg = statusConfig[session.status];
          const date = new Date(session.date || session.sessionDate);
          return (
            <View key={i} style={[spStyles.sessionCard, { borderLeftColor: cfg?.color }]}>
              <View style={spStyles.sessionLeft}>
                <View style={[spStyles.dateBadge, { backgroundColor: cfg?.color + '20' }]}>
                  <Text style={[spStyles.dateDay, { color: cfg?.color }]}>
                    {date.toLocaleDateString('en-GB', { day: 'numeric' })}
                  </Text>
                  <Text style={[spStyles.dateMonth, { color: cfg?.color }]}>
                    {date.toLocaleDateString('en-GB', { month: 'short' })}
                  </Text>
                </View>
                <View style={spStyles.sessionInfo}>
                  <Text style={spStyles.sessionTime}>
                    {session.startTime} • {session.durationMins}min
                  </Text>
                  {session.notes && <Text style={spStyles.sessionNotes} numberOfLines={1}>{session.notes}</Text>}
                  <View style={[spStyles.statusBadge, { backgroundColor: cfg?.color + '20' }]}>
                    <Text style={[spStyles.statusText, { color: cfg?.color }]}>{cfg?.label}</Text>
                  </View>
                </View>
              </View>

              {session.status === 'scheduled' && (
                <View style={spStyles.sessionActions}>
                  <TouchableOpacity
                    style={spStyles.doneBtn}
                    onPress={() => Alert.alert('Complete Session', 'Mark as completed?', [
                      { text: 'Cancel' },
                      { text: 'Complete', onPress: () => completeMutation.mutate(session._id) },
                    ])}
                  >
                    <Ionicons name="checkmark" size={14} color="#10B981" />
                  </TouchableOpacity>
                  <TouchableOpacity style={spStyles.cancelBtn} onPress={() => handleCancel(session)}>
                    <Ionicons name="close" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
    </View>
  );
};

const spStyles = StyleSheet.create({
  container: { padding: 14, backgroundColor: '#F9F9F9' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  monthBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  monthLabel: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  generateBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: '#F0FBF7', borderWidth: 1, borderColor: COLORS.primary },
  generateBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  addBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.primary },
  addBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  statItem: { flex: 1, backgroundColor: COLORS.white, borderRadius: 10, padding: 8, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 16, fontWeight: '800' },
  statLabel: { fontSize: 9, color: COLORS.gray, fontWeight: '600' },
  empty: { alignItems: 'center', padding: 24, gap: 6 },
  emptyText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  emptySubText: { fontSize: 11, color: COLORS.gray },
  sessionCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white, borderRadius: 10, padding: 10, marginBottom: 6, borderLeftWidth: 4, elevation: 1 },
  sessionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  dateBadge: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 16, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '600' },
  sessionInfo: { flex: 1 },
  sessionTime: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  sessionNotes: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginTop: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  sessionActions: { flexDirection: 'row', gap: 6 },
  doneBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#10B981' },
  cancelBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#EF4444' },
});

// ── Class Detail Modal ────────────────────────────────────────────
const ClassDetailModal = ({ cls, onClose }) => {
  const [activeTab, setActiveTab] = useState('info');
  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['admin-class-detail', cls._id],
    queryFn: () => api.get(`/classes/${cls._id}`).then(r => r.data),
  });
  const detail = classDetail?.class;

  const tabs = [
    { key: 'info', label: 'Info', icon: 'information-circle-outline' },
    { key: 'students', label: 'Students', icon: 'people-outline' },
    { key: 'sessions', label: 'Sessions', icon: 'calendar-outline' },
  ];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={dStyles.container}>
        <View style={dStyles.header}>
          <View style={dStyles.headerIcon}>
            <Ionicons name="book-outline" size={24} color={COLORS.primary} />
          </View>
          <View style={dStyles.headerInfo}>
            <Text style={dStyles.title}>{cls.name}</Text>
            <Text style={dStyles.subtitle}>{cls.subject} • {cls.grade}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={dStyles.tabRow}>
          {tabs.map(t => (
            <TouchableOpacity key={t.key}
              style={[dStyles.tab, activeTab === t.key && dStyles.tabActive]}
              onPress={() => setActiveTab(t.key)}>
              <Ionicons name={t.icon} size={14} color={activeTab === t.key ? COLORS.primary : COLORS.gray} />
              <Text style={[dStyles.tabText, activeTab === t.key && dStyles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> : (
          <ScrollView style={dStyles.scroll}>

            {/* INFO TAB */}
            {activeTab === 'info' && (
              <View style={dStyles.section}>
                <Text style={dStyles.sectionTitle}>Class Information</Text>
                {[
                  { label: 'Subject', value: detail?.subject },
                  { label: 'Grade', value: detail?.grade },
                  { label: 'Medium', value: detail?.medium },
                  { label: 'Hall', value: detail?.hall },
                  { label: 'Day', value: detail?.schedule?.dayOfWeek },
                  { label: 'Time', value: `${detail?.schedule?.startTime} - ${detail?.schedule?.endTime}` },
                  { label: 'Monthly Fee', value: `Rs. ${detail?.monthlyFee?.toLocaleString()}` },
                  { label: 'Max Students', value: detail?.maxStudents?.toString() },
                  { label: 'Available Slots', value: detail?.availableSlots?.toString() },
                  { label: 'Teacher', value: detail?.teacherId?.userId?.name || 'Not assigned' },
                ].map((row, i) => (
                  <View key={i} style={dStyles.infoRow}>
                    <Text style={dStyles.infoLabel}>{row.label}</Text>
                    <Text style={dStyles.infoValue}>{row.value || 'N/A'}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* STUDENTS TAB */}
            {activeTab === 'students' && (
              <View style={dStyles.section}>
                <Text style={dStyles.sectionTitle}>
                  Enrolled Students ({detail?.enrolledStudents?.length || 0})
                </Text>
                {detail?.enrolledStudents?.length === 0 ? (
                  <View style={dStyles.emptyBox}>
                    <Ionicons name="people-outline" size={32} color={COLORS.gray} />
                    <Text style={dStyles.noData}>No students enrolled</Text>
                  </View>
                ) : (
                  detail?.enrolledStudents?.map((student, i) => (
                    <View key={i} style={dStyles.studentRow}>
                      <View style={[dStyles.studentAvatar, { backgroundColor: student.status === 'suspended' ? '#EF4444' : COLORS.primary }]}>
                        <Text style={dStyles.studentAvatarText}>{student.userId?.name?.charAt(0)}</Text>
                      </View>
                      <View style={dStyles.studentInfo}>
                        <Text style={dStyles.studentName}>{student.userId?.name}</Text>
                        <Text style={dStyles.studentDetail}>{student.admissionNumber} • {student.grade}</Text>
                        {student.status === 'suspended' && (
                          <Text style={dStyles.suspendedText}>Suspended: {student.suspendReason || 'No reason'}</Text>
                        )}
                      </View>
                      <View style={[dStyles.statusBadge, { backgroundColor: student.status === 'active' ? '#F0FBF7' : '#FEF2F2' }]}>
                        <Text style={[dStyles.statusText, { color: student.status === 'active' ? '#10B981' : '#EF4444' }]}>
                          {student.status}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* SESSIONS TAB */}
            {activeTab === 'sessions' && <SessionPanel cls={cls} />}

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  headerIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  tabTextActive: { color: COLORS.primary },
  scroll: { flex: 1 },
  section: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  infoValue: { fontSize: 13, color: COLORS.dark, fontWeight: '700', flex: 1, textAlign: 'right' },
  emptyBox: { alignItems: 'center', padding: 20, gap: 8 },
  noData: { fontSize: 13, color: COLORS.gray },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  studentDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  suspendedText: { fontSize: 10, color: '#EF4444', marginTop: 2, fontWeight: '600' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
});

// ── Create Class Modal ─────────────────────────────────────────────
const CreateClassModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '', subject: '', grade: '', medium: '',
    hall: '', teacherId: '',
    dayOfWeek: '', startTime: '', endTime: '',
    maxCapacity: '40', monthlyFee: '2500',
    startDate: new Date().toISOString().split('T')[0],
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers-for-class'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: () => api.post('/classes', {
      name: form.name, subject: form.subject, grade: form.grade,
      medium: form.medium, hall: form.hall, teacherId: form.teacherId,
      monthlyFee: parseInt(form.monthlyFee),
      maxCapacity: parseInt(form.maxCapacity),
      startDate: form.startDate,
      schedule: { dayOfWeek: form.dayOfWeek, startTime: form.startTime, endTime: form.endTime },
    }),
    onSuccess: (res) => {
      Alert.alert('Created!', `Class created! ${res.data.sessionsGenerated || 0} sessions auto-generated.`);
      queryClient.invalidateQueries(['admin-classes']);
      onClose();
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const SelectField = ({ label, options, value, field }) => (
    <View style={ccStyles.inputGroup}>
      <Text style={ccStyles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {options.map(opt => (
            <TouchableOpacity key={opt}
              style={[ccStyles.optBtn, form[field] === opt && ccStyles.optBtnActive]}
              onPress={() => setForm(f => ({ ...f, [field]: opt }))}>
              <Text style={[ccStyles.optText, form[field] === opt && ccStyles.optTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={ccStyles.header}>
          <Text style={ccStyles.title}>Create Class</Text>
          <TouchableOpacity onPress={onClose} style={ccStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={ccStyles.infoBanner}>
            <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
            <Text style={ccStyles.infoText}>Sessions will be auto-generated for current and next month.</Text>
          </View>

          <View style={ccStyles.inputGroup}>
            <Text style={ccStyles.label}>Class Name *</Text>
            <TextInput style={ccStyles.input} value={form.name} onChangeText={v => setForm(f => ({ ...f, name: v }))}
              placeholder="e.g. Physics Grade 13 - Sinhala 2026" placeholderTextColor={COLORS.gray} />
          </View>

          <SelectField label="Subject *" options={SUBJECTS} value={form.subject} field="subject" />
          <SelectField label="Grade *" options={GRADES} value={form.grade} field="grade" />
          <SelectField label="Medium" options={MEDIUMS} value={form.medium} field="medium" />
          <SelectField label="Hall" options={HALLS} value={form.hall} field="hall" />
          <SelectField label="Day *" options={DAYS} value={form.dayOfWeek} field="dayOfWeek" />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[ccStyles.inputGroup, { flex: 1 }]}>
              <Text style={ccStyles.label}>Start Time *</Text>
              <TextInput style={ccStyles.input} value={form.startTime} onChangeText={v => setForm(f => ({ ...f, startTime: v }))}
                placeholder="09:00" placeholderTextColor={COLORS.gray} />
            </View>
            <View style={[ccStyles.inputGroup, { flex: 1 }]}>
              <Text style={ccStyles.label}>End Time *</Text>
              <TextInput style={ccStyles.input} value={form.endTime} onChangeText={v => setForm(f => ({ ...f, endTime: v }))}
                placeholder="11:00" placeholderTextColor={COLORS.gray} />
            </View>
          </View>

          <View style={ccStyles.inputGroup}>
            <Text style={ccStyles.label}>Teacher *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {teachers?.teachers?.map(t => (
                  <TouchableOpacity key={t._id}
                    style={[ccStyles.optBtn, form.teacherId === t._id && ccStyles.optBtnActive]}
                    onPress={() => setForm(f => ({ ...f, teacherId: t._id }))}>
                    <Text style={[ccStyles.optText, form.teacherId === t._id && ccStyles.optTextActive]}>
                      {t.userId?.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={[ccStyles.inputGroup, { flex: 1 }]}>
              <Text style={ccStyles.label}>Max Students</Text>
              <TextInput style={ccStyles.input} value={form.maxCapacity} onChangeText={v => setForm(f => ({ ...f, maxCapacity: v }))}
                keyboardType="numeric" placeholder="40" placeholderTextColor={COLORS.gray} />
            </View>
            <View style={[ccStyles.inputGroup, { flex: 1 }]}>
              <Text style={ccStyles.label}>Monthly Fee (Rs.)</Text>
              <TextInput style={ccStyles.input} value={form.monthlyFee} onChangeText={v => setForm(f => ({ ...f, monthlyFee: v }))}
                keyboardType="numeric" placeholder="2500" placeholderTextColor={COLORS.gray} />
            </View>
          </View>

          <View style={ccStyles.inputGroup}>
            <Text style={ccStyles.label}>Start Date</Text>
            <TextInput style={ccStyles.input} value={form.startDate} onChangeText={v => setForm(f => ({ ...f, startDate: v }))}
              placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.gray} />
          </View>

          <TouchableOpacity
            style={[ccStyles.createBtn, createMutation.isPending && { opacity: 0.6 }]}
            onPress={() => {
              if (!form.name || !form.subject || !form.grade || !form.teacherId || !form.dayOfWeek || !form.startTime || !form.endTime)
                return Alert.alert('Error', 'Please fill all required fields');
              createMutation.mutate();
            }}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? <ActivityIndicator color={COLORS.white} /> :
              <Text style={ccStyles.createBtnText}>Create Class</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const ccStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FBF7', borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#C8EDE2' },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#E0E0E0' },
  optBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0' },
  optBtnActive: { backgroundColor: '#F0FBF7', borderColor: COLORS.primary },
  optText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  optTextActive: { color: COLORS.primary },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

// ── Main Component ────────────────────────────────────────────────
const AdminClasses = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [filterGrade, setFilterGrade] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const classes = data?.classes || [];
  const grades = ['all', ...new Set(classes.map(c => c.grade).filter(Boolean))];
  const filtered = classes.filter(cls => {
    const matchSearch = cls.name?.toLowerCase().includes(search.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'all' || cls.grade === filterGrade;
    return matchSearch && matchGrade;
  });

  return (
    <View style={styles.container}>
      {selectedClass && <ClassDetailModal cls={selectedClass} onClose={() => setSelectedClass(null)} />}
      {showCreate && <CreateClassModal onClose={() => setShowCreate(false)} />}

      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Classes</Text>
          <Text style={styles.headerSub}>{classes.length} total classes</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={COLORS.gray} />
            <TextInput value={search} onChangeText={setSearch}
              placeholder="Search by class name or subject..."
              placeholderTextColor={COLORS.gray} style={styles.searchInput}
              autoCapitalize="none" autoCorrect={false} />
            {search ? <TouchableOpacity onPress={() => setSearch('')}><Ionicons name="close-circle" size={16} color={COLORS.gray} /></TouchableOpacity> : null}
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {grades.map(grade => (
              <TouchableOpacity key={grade} onPress={() => setFilterGrade(grade)}
                style={[styles.filterChip, filterGrade === grade && styles.filterChipActive]}>
                <Text style={[styles.filterChipText, filterGrade === grade && styles.filterChipTextActive]}>
                  {grade === 'all' ? 'All Grades' : grade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: 'Total', value: classes.length, color: COLORS.primary },
            { label: 'Students', value: classes.reduce((s, c) => s + (c.enrolledCount || 0), 0), color: '#10B981' },
            { label: 'Showing', value: filtered.length, color: '#F59E0B' },
          ].map((stat, i) => (
            <View key={i} style={styles.statChip}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> :
          filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="book-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No classes found</Text>
            </View>
          ) : filtered.map((cls, i) => (
            <TouchableOpacity key={i} style={styles.classCard} onPress={() => setSelectedClass(cls)}>
              <View style={styles.classHeader}>
                <View style={styles.classIconBox}>
                  <Ionicons name="book-outline" size={20} color={COLORS.primary} />
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classDetail}>{cls.subject} • {cls.grade} • {cls.medium}</Text>
                  <Text style={styles.classDetail}>{cls.schedule?.dayOfWeek} {cls.schedule?.startTime} • {cls.hall}</Text>
                </View>
                <View style={styles.classRight}>
                  <Text style={styles.classCount}>{cls.enrolledCount}</Text>
                  <Text style={styles.classCountSub}>/{cls.maxStudents}</Text>
                  <Text style={styles.classCountLabel}>students</Text>
                </View>
              </View>
              <View style={styles.teacherRow}>
                <Ionicons name="person-outline" size={13} color={COLORS.gray} />
                <Text style={styles.teacherName}>{cls.teacherId?.userId?.name || 'No teacher assigned'}</Text>
                <View style={styles.feeBadge}>
                  <Text style={styles.feeBadgeText}>Rs. {cls.monthlyFee?.toLocaleString()}/mo</Text>
                </View>
              </View>
              {cls.maxStudents > 0 && (
                <View style={styles.capacityBar}>
                  <View style={[styles.capacityFill, {
                    width: `${Math.min((cls.enrolledCount / cls.maxStudents) * 100, 100)}%`,
                    backgroundColor: (cls.enrolledCount / cls.maxStudents) >= 0.9 ? '#EF4444' :
                      (cls.enrolledCount / cls.maxStudents) >= 0.7 ? '#F59E0B' : '#10B981',
                  }]} />
                </View>
              )}
              <Text style={styles.viewMore}>Tap to view details & sessions →</Text>
            </TouchableOpacity>
          ))}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16 },
  searchCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 8, padding: 14, elevation: 2 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', marginRight: 8 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  filterChipTextActive: { color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  statChip: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  classCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 10, padding: 14, elevation: 2 },
  classHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  classIconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  classDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  classRight: { alignItems: 'center' },
  classCount: { fontSize: 20, fontWeight: '800', color: COLORS.primary },
  classCountSub: { fontSize: 11, color: COLORS.gray },
  classCountLabel: { fontSize: 10, color: COLORS.gray },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  teacherName: { flex: 1, fontSize: 12, color: COLORS.gray },
  feeBadge: { backgroundColor: '#F0FBF7', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  feeBadgeText: { fontSize: 11, color: COLORS.primary, fontWeight: '700' },
  capacityBar: { height: 5, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 8 },
  capacityFill: { height: 5, borderRadius: 3 },
  viewMore: { fontSize: 11, color: COLORS.primary, fontWeight: '600', textAlign: 'right' },
});

export default AdminClasses;