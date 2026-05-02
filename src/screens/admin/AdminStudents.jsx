import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, RefreshControl,
  ActivityIndicator, Modal, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const StudentDetailModal = ({ student, onClose }) => {
  const queryClient = useQueryClient();

  const { data: fees } = useQuery({
    queryKey: ['admin-student-fees', student._id],
    queryFn: () => api.get(`/fees/student/${student._id}`).then(r => r.data),
  });

  const suspendMutation = useMutation({
  mutationFn: () => api.patch(`/students/${student._id}/status`, {
    status: student.status === 'active' ? 'suspended' : 'active'
  }),
  onSuccess: () => {
    Alert.alert('Success', `Student ${student.status === 'active' ? 'suspended' : 'activated'}!`);
    queryClient.invalidateQueries(['admin-students']);
    onClose();
  },
  onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
});

  const totalUnpaid = fees?.fees?.filter(f => f.status !== 'paid').reduce((s, f) => s + f.amount, 0) || 0;
  const totalPaid = fees?.fees?.filter(f => f.status === 'paid').reduce((s, f) => s + f.amount, 0) || 0;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={dStyles.container}>
        <View style={dStyles.header}>
          <View style={[dStyles.avatar, { backgroundColor: student.status === 'active' ? COLORS.primary : '#EF4444' }]}>
            <Text style={dStyles.avatarText}>{student.userId?.name?.charAt(0)}</Text>
          </View>
          <View style={dStyles.headerInfo}>
            <Text style={dStyles.name}>{student.userId?.name}</Text>
            <Text style={dStyles.detail}>{student.admissionNumber} • {student.grade}</Text>
            <View style={[dStyles.statusBadge, { backgroundColor: student.status === 'active' ? '#F0FBF7' : '#FEF2F2' }]}>
              <Text style={[dStyles.statusText, { color: student.status === 'active' ? '#10B981' : '#EF4444' }]}>
                {student.status?.toUpperCase()}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={dStyles.scroll}>
          {/* Info */}
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>📋 Student Information</Text>
            {[
              { label: 'School', value: student.school },
              { label: 'Stream', value: student.stream },
              { label: 'Medium', value: student.medium },
              { label: 'Email', value: student.userId?.email },
            ].map((row, i) => (
              <View key={i} style={dStyles.infoRow}>
                <Text style={dStyles.infoLabel}>{row.label}</Text>
                <Text style={dStyles.infoValue}>{row.value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {/* Fee summary */}
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>💰 Fee Summary</Text>
            <View style={dStyles.feeCards}>
              <View style={[dStyles.feeCard, { borderColor: '#10B981' }]}>
                <Text style={dStyles.feeCardLabel}>Paid</Text>
                <Text style={[dStyles.feeCardValue, { color: '#10B981' }]}>Rs. {totalPaid.toLocaleString()}</Text>
              </View>
              <View style={[dStyles.feeCard, { borderColor: '#EF4444' }]}>
                <Text style={dStyles.feeCardLabel}>Outstanding</Text>
                <Text style={[dStyles.feeCardValue, { color: '#EF4444' }]}>Rs. {totalUnpaid.toLocaleString()}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>⚙️ Actions</Text>
            <TouchableOpacity
              style={[dStyles.actionBtn, { backgroundColor: student.status === 'active' ? '#FEF2F2' : '#F0FBF7' }]}
              onPress={() => Alert.alert(
                student.status === 'active' ? 'Suspend Student' : 'Activate Student',
                `Are you sure you want to ${student.status === 'active' ? 'suspend' : 'activate'} ${student.userId?.name}?`,
                [
                  { text: 'Cancel' },
                  { text: 'Confirm', style: student.status === 'active' ? 'destructive' : 'default', onPress: () => suspendMutation.mutate() },
                ]
              )}
            >
              <Ionicons
                name={student.status === 'active' ? 'ban-outline' : 'checkmark-circle-outline'}
                size={20}
                color={student.status === 'active' ? '#EF4444' : '#10B981'}
              />
              <Text style={[dStyles.actionBtnText, { color: student.status === 'active' ? '#EF4444' : '#10B981' }]}>
                {student.status === 'active' ? 'Suspend Student' : 'Activate Student'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  detail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: 10, fontWeight: '800' },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  section: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  infoValue: { fontSize: 13, color: COLORS.dark, fontWeight: '600' },
  feeCards: { flexDirection: 'row', gap: 10 },
  feeCard: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, backgroundColor: '#FAFAFA' },
  feeCardLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },
  feeCardValue: { fontSize: 16, fontWeight: '800' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  actionBtnText: { fontSize: 15, fontWeight: '700' },
});

const AdminStudents = () => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [filter, setFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('students');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-students'],
    queryFn: () => api.get('/students').then(r => r.data),
  });

  const { data: pendingData, refetch: refetchPending } = useQuery({
    queryKey: ['admin-pending-students'],
    queryFn: () => api.get('/students/pending').then(r => r.data),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(/students//approve),
    onSuccess: () => {
      Alert.alert('Approved!', 'Student has been approved and can now login.');
      queryClient.invalidateQueries(['admin-pending-students']);
      queryClient.invalidateQueries(['admin-students']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => api.delete(/students//reject),
    onSuccess: () => {
      Alert.alert('Rejected', 'Registration has been rejected and removed.');
      queryClient.invalidateQueries(['admin-pending-students']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const pendingStudents = pendingData?.students || [];

  const students = data?.students || [];
  const filtered = students.filter(s => {
    const matchSearch = s.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || s.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <View style={styles.container}>
      {selectedStudent && (
        <StudentDetailModal student={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}

      <View style={styles.header}>
          <Text style={styles.headerTitle}>Students</Text>
          <Text style={styles.headerSub}>{students.length} total students</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'students' && styles.tabActive]}
            onPress={() => setActiveTab('students')}
          >
            <Text style={[styles.tabText, activeTab === 'students' && styles.tabTextActive]}>All Students</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
            onPress={() => setActiveTab('pending')}
          >
            <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
              Pending {pendingStudents.length > 0 ? `(${pendingStudents.length})` : ''}
            </Text>
          </TouchableOpacity>
        </View>

      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>

        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={COLORS.gray} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by name or admission number..."
              placeholderTextColor={COLORS.gray}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={16} color={COLORS.gray} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter */}
          <View style={styles.filterRow}>
            {['all', 'pending', 'active', 'suspended', 'inactive'].map(f => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                style={[styles.filterChip, filter === f && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Results count */}
        <View style={styles.resultRow}>
          <Text style={styles.resultText}>Showing {filtered.length} students</Text>
        </View>

        {/* Pending students */}
        {activeTab === 'pending' && (
          pendingStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#10B981" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>No pending registrations</Text>
            </View>
          ) : pendingStudents.map((student, i) => (
            <View key={i} style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <View style={[styles.studentAvatar, { backgroundColor: COLORS.primary }]}>
                  <Text style={styles.studentAvatarText}>{student.userId?.name?.charAt(0)}</Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.userId?.name}</Text>
                  <Text style={styles.studentDetail}>{student.userId?.email}</Text>
                  <Text style={styles.studentDetail}>{student.grade} • {student.stream} • {student.medium}</Text>
                  <Text style={styles.studentDetail}>{student.school}</Text>
                </View>
              </View>
              <View style={styles.pendingActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => Alert.alert('Approve Student', `Approve ${student.userId?.name}?`, [
                    { text: 'Cancel' },
                    { text: 'Approve', onPress: () => approveMutation.mutate(student._id) },
                  ])}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => Alert.alert('Reject Registration', `Reject and delete ${student.userId?.name}'s registration?`, [
                    { text: 'Cancel' },
                    { text: 'Reject', style: 'destructive', onPress: () => rejectMutation.mutate(student._id) },
                  ])}
                >
                  <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
                  <Text style={styles.rejectBtnText}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Students list */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>👤</Text>
            <Text style={styles.emptyText}>No students found</Text>
          </View>
        ) : (
          filtered.map((student, i) => (
            <TouchableOpacity
              key={i}
              style={styles.studentCard}
              onPress={() => setSelectedStudent(student)}
            >
              <View style={[styles.studentAvatar, {
                backgroundColor: student.status === 'active' ? COLORS.primary :
                  student.status === 'suspended' ? '#EF4444' : COLORS.gray
              }]}>
                <Text style={styles.studentAvatarText}>{student.userId?.name?.charAt(0)}</Text>
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{student.userId?.name}</Text>
                <Text style={styles.studentDetail}>{student.admissionNumber} • {student.grade} • {student.school}</Text>
                <Text style={styles.studentDetail}>{student.stream} • {student.medium}</Text>
              </View>
              <View style={styles.studentRight}>
                <View style={[styles.statusBadge, {
                  backgroundColor: student.status === 'active' ? '#F0FBF7' :
                    student.status === 'suspended' ? '#FEF2F2' : '#F5F5F5'
                }]}>
                  <Text style={[styles.statusText, {
                    color: student.status === 'active' ? '#10B981' :
                      student.status === 'suspended' ? '#EF4444' : COLORS.gray
                  }]}>
                    {student.status}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))
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
  searchCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 8, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  filterRow: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5' },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray, textTransform: 'capitalize' },
  filterChipTextActive: { color: COLORS.white },
  resultRow: { paddingHorizontal: 20, marginBottom: 8 },
  resultText: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16,
    marginBottom: 8, padding: 14, elevation: 1,
  },
  studentAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  studentDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  studentRight: { alignItems: 'flex-end' },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 0, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.6)' },
  tabTextActive: { color: COLORS.primary },
  pendingCard: { backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, padding: 14, elevation: 2, borderWidth: 1.5, borderColor: '#FDE68A' },
  pendingHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  pendingActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#F0FBF7', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#10B981' },
  approveBtnText: { color: '#10B981', fontWeight: '700', fontSize: 13 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, paddingVertical: 10, borderWidth: 1, borderColor: '#EF4444' },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
});

export default AdminStudents;