import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, Alert, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const DetailModal = ({ request, onClose }) => {
  const queryClient = useQueryClient();
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);

  const approveMutation = useMutation({
    mutationFn: () => api.patch(`/register/${request._id}/approve`),
    onSuccess: (res) => {
      Alert.alert('Approved!',
        `Admission: ${res.data.student?.admissionNumber}\nCredentials sent to ${request.studentEmail}`,
        [{ text: 'OK', onPress: onClose }]
      );
      queryClient.invalidateQueries(['admin-registrations-mobile']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: () => api.patch(`/register/${request._id}/reject`, { reason: rejectReason }),
    onSuccess: () => {
      Alert.alert('Rejected', 'Registration rejected.', [{ text: 'OK', onPress: onClose }]);
      queryClient.invalidateQueries(['admin-registrations-mobile']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={mStyles.header}>
          <Text style={mStyles.title}>Registration Details</Text>
          <TouchableOpacity onPress={onClose} style={mStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <View style={mStyles.statusRow}>
            <View style={[mStyles.statusBadge, {
              backgroundColor: request.status === 'pending' ? '#FFF9E6' :
                request.status === 'approved' ? '#F0FBF7' : '#FEF2F2'
            }]}>
              <Text style={[mStyles.statusText, {
                color: request.status === 'pending' ? '#92400E' :
                  request.status === 'approved' ? '#10B981' : '#EF4444'
              }]}>{request.status?.toUpperCase()}</Text>
            </View>
            <Text style={mStyles.dateText}>Applied: {new Date(request.createdAt).toLocaleDateString()}</Text>
          </View>

          <View style={mStyles.section}>
            <Text style={mStyles.sectionTitle}>Student Details</Text>
            {[
              { label: 'Name', value: request.studentName },
              { label: 'Email', value: request.studentEmail },
              { label: 'School', value: request.school },
              { label: 'Grade', value: request.grade },
              { label: 'Stream', value: request.stream },
              { label: 'Medium', value: request.medium },
            ].map((row, i) => (
              <View key={i} style={mStyles.row}>
                <Text style={mStyles.rowLabel}>{row.label}</Text>
                <Text style={mStyles.rowValue}>{row.value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          <View style={mStyles.section}>
            <Text style={mStyles.sectionTitle}>Parent Details</Text>
            {[
              { label: 'Name', value: request.parentName },
              { label: 'Email', value: request.parentEmail },
              { label: 'Contact', value: request.parentContact },
              { label: 'Address', value: request.parentAddress },
            ].map((row, i) => (
              <View key={i} style={mStyles.row}>
                <Text style={mStyles.rowLabel}>{row.label}</Text>
                <Text style={mStyles.rowValue}>{row.value || 'N/A'}</Text>
              </View>
            ))}
          </View>

          {request.status === 'pending' && (
            <View style={mStyles.actionsSection}>
              {!showRejectInput ? (
                <>
                  <TouchableOpacity
                    style={[mStyles.approveBtn, approveMutation.isPending && { opacity: 0.6 }]}
                    onPress={() => Alert.alert('Approve Registration',
                      `Approve ${request.studentName}?\n\nCredentials will be sent to:\n• ${request.studentEmail}\n• ${request.parentEmail}`,
                      [{ text: 'Cancel' }, { text: 'Approve', onPress: () => approveMutation.mutate() }]
                    )}
                    disabled={approveMutation.isPending}
                  >
                    {approveMutation.isPending ? <ActivityIndicator color={COLORS.white} /> : (
                      <>
                        <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
                        <Text style={mStyles.approveBtnText}>Approve Registration</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={mStyles.rejectBtn} onPress={() => setShowRejectInput(true)}>
                    <Ionicons name="close-circle" size={18} color="#EF4444" />
                    <Text style={mStyles.rejectBtnText}>Reject</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View>
                  <Text style={mStyles.rejectLabel}>Reason for Rejection</Text>
                  <TextInput style={mStyles.rejectInput} value={rejectReason} onChangeText={setRejectReason}
                    placeholder="Enter reason (optional)..." placeholderTextColor={COLORS.gray}
                    multiline numberOfLines={3} />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={[mStyles.confirmRejectBtn, rejectMutation.isPending && { opacity: 0.6 }]}
                      onPress={() => rejectMutation.mutate()} disabled={rejectMutation.isPending}>
                      {rejectMutation.isPending ? <ActivityIndicator color={COLORS.white} /> :
                        <Text style={mStyles.confirmRejectText}>Confirm Reject</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity style={mStyles.cancelBtn} onPress={() => setShowRejectInput(false)}>
                      <Text style={mStyles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const mStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6 },
  statusText: { fontSize: 12, fontWeight: '800' },
  dateText: { fontSize: 12, color: COLORS.gray },
  section: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 10, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rowLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  rowValue: { fontSize: 13, color: COLORS.dark, fontWeight: '600', flex: 1, textAlign: 'right' },
  actionsSection: { margin: 16 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginBottom: 10 },
  approveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FEF2F2', borderRadius: 14, padding: 14 },
  rejectBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
  rejectLabel: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 8 },
  rejectInput: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#E0E0E0', textAlignVertical: 'top', marginBottom: 12, minHeight: 80 },
  confirmRejectBtn: { flex: 1, backgroundColor: '#EF4444', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmRejectText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  cancelBtn: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnText: { color: COLORS.gray, fontWeight: '700', fontSize: 14 },
});

const AdminRegistrations = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-registrations-mobile', statusFilter],
    queryFn: () => api.get(`/register/pending?status=${statusFilter}`).then(r => r.data),
  });

  const requests = data?.requests || [];
  const filtered = requests.filter(r =>
    r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
    r.studentEmail?.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors = {
    pending: { bg: '#FFF9E6', text: '#92400E' },
    approved: { bg: '#F0FBF7', text: '#10B981' },
    rejected: { bg: '#FEF2F2', text: '#EF4444' },
  };

  return (
    <View style={styles.container}>
      {selected && <DetailModal request={selected} onClose={() => setSelected(null)} />}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registrations</Text>
        <Text style={styles.headerSub}>Review student applications</Text>
      </View>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View style={styles.filterRow}>
          {['pending', 'approved', 'rejected'].map(s => (
            <TouchableOpacity key={s}
              style={[styles.filterBtn, statusFilter === s && styles.filterBtnActive]}
              onPress={() => setStatusFilter(s)}>
              <Text style={[styles.filterText, statusFilter === s && styles.filterTextActive]}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.gray} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search by name or email..." placeholderTextColor={COLORS.gray} autoCapitalize="none" />
        </View>
        <Text style={styles.resultText}>{filtered.length} {statusFilter} registration{filtered.length !== 1 ? 's' : ''}</Text>
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> :
          filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="document-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No {statusFilter} registrations</Text>
            </View>
          ) : filtered.map((req, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => setSelected(req)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{req.studentName?.charAt(0)}</Text></View>
              <View style={styles.cardInfo}>
                <Text style={styles.studentName}>{req.studentName}</Text>
                <Text style={styles.studentEmail}>{req.studentEmail}</Text>
                <Text style={styles.studentDetail}>{req.grade} • {req.stream} • {req.medium}</Text>
                <Text style={styles.studentSchool}>{req.school}</Text>
              </View>
              <View style={styles.cardRight}>
                <View style={[styles.statusBadge, { backgroundColor: statusColors[req.status]?.bg }]}>
                  <Text style={[styles.statusText, { color: statusColors[req.status]?.text }]}>{req.status}</Text>
                </View>
                <Text style={styles.cardDate}>{new Date(req.createdAt).toLocaleDateString()}</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))
        }
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
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12 },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.white, alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 13, fontWeight: '600', color: COLORS.gray, textTransform: 'capitalize' },
  filterTextActive: { color: COLORS.white },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 8, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  resultText: { fontSize: 13, color: COLORS.gray, fontWeight: '600', paddingHorizontal: 20, marginBottom: 8 },
  emptyCard: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, padding: 14, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  cardInfo: { flex: 1 },
  studentName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  studentEmail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  studentDetail: { fontSize: 11, color: COLORS.primary, marginTop: 2, fontWeight: '600' },
  studentSchool: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '800', textTransform: 'capitalize' },
  cardDate: { fontSize: 10, color: COLORS.gray },
});

export default AdminRegistrations;