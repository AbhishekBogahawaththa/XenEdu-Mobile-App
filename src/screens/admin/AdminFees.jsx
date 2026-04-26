import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const AdminFees = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('outstanding');
  const [filter, setFilter] = useState('pending');

  const { data: outstanding, isLoading: loadingOutstanding, refetch: refetchOutstanding } = useQuery({
    queryKey: ['admin-outstanding'],
    queryFn: () => api.get('/fees/outstanding').then(r => r.data),
    enabled: activeTab === 'outstanding',
  });

  const { data: requests, isLoading: loadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['admin-payment-requests', filter],
    queryFn: () => api.get(`/payment-requests?status=${filter}`).then(r => r.data),
    enabled: activeTab === 'requests',
  });

  const approveMutation = useMutation({
    mutationFn: (id) => api.patch(`/payment-requests/${id}/approve`),
    onSuccess: (res) => {
      Alert.alert('Approved! ✅', `Receipt: ${res.data.receiptNumber}`);
      queryClient.invalidateQueries(['admin-payment-requests']);
      queryClient.invalidateQueries(['admin-outstanding']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/payment-requests/${id}/reject`, { reason }),
    onSuccess: () => {
      Alert.alert('Rejected', 'Payment request rejected');
      queryClient.invalidateQueries(['admin-payment-requests']);
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const statusColors = {
    pending: 'bg-yellow-100',
    approved: '#F0FBF7',
    rejected: '#FEF2F2',
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fees & Payments</Text>
        <Text style={styles.headerSub}>Manage student fee collection</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'outstanding', label: '⚠️ Outstanding' },
          { key: 'requests', label: '💳 Requests' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => setActiveTab(tab.key)}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={activeTab === 'outstanding' ? refetchOutstanding : refetchRequests} />}
      >

        {/* Outstanding tab */}
        {activeTab === 'outstanding' && (
          <>
            {/* Summary cards */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Outstanding</Text>
                <Text style={[styles.summaryValue, { color: '#EF4444' }]}>
                  Rs. {outstanding?.totalOutstanding?.toLocaleString() || '0'}
                </Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Unpaid Records</Text>
                <Text style={[styles.summaryValue, { color: COLORS.dark }]}>
                  {outstanding?.count || 0}
                </Text>
              </View>
            </View>

            {loadingOutstanding ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : outstanding?.fees?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyText}>No outstanding fees!</Text>
              </View>
            ) : (
              outstanding?.fees?.map((fee, i) => (
                <View key={i} style={styles.feeCard}>
                  <View style={styles.feeHeader}>
                    <View style={styles.feeAvatar}>
                      <Text style={styles.feeAvatarText}>{fee.studentId?.userId?.name?.charAt(0)}</Text>
                    </View>
                    <View style={styles.feeInfo}>
                      <Text style={styles.feeName}>{fee.studentId?.userId?.name}</Text>
                      <Text style={styles.feeDetail}>{fee.studentId?.admissionNumber} • {fee.classId?.name}</Text>
                      <Text style={styles.feeDetail}>Month: {fee.month}</Text>
                    </View>
                    <View style={styles.feeRight}>
                      <Text style={styles.feeAmount}>Rs. {fee.amount?.toLocaleString()}</Text>
                      <View style={[styles.feeBadge, { backgroundColor: fee.status === 'overdue' ? '#FEF2F2' : '#FFFBEB' }]}>
                        <Text style={[styles.feeBadgeText, { color: fee.status === 'overdue' ? '#EF4444' : '#F59E0B' }]}>
                          {fee.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* Payment requests tab */}
        {activeTab === 'requests' && (
          <>
            {/* Filter */}
            <View style={styles.filterRow}>
              {['pending', 'approved', 'rejected'].map(f => (
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

            {loadingRequests ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
            ) : requests?.requests?.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyIcon}>📭</Text>
                <Text style={styles.emptyText}>No {filter} requests</Text>
              </View>
            ) : (
              requests?.requests?.map((req, i) => (
                <View key={i} style={styles.reqCard}>
                  <View style={styles.reqHeader}>
                    <View style={styles.reqAvatar}>
                      <Text style={styles.reqAvatarText}>{req.studentId?.userId?.name?.charAt(0)}</Text>
                    </View>
                    <View style={styles.reqInfo}>
                      <Text style={styles.reqName}>{req.studentId?.userId?.name}</Text>
                      <Text style={styles.reqDetail}>{req.studentId?.admissionNumber} • {req.classId?.name}</Text>
                      <Text style={styles.reqDetail}>Method: {req.method?.replace('_', ' ')}</Text>
                      {req.month && <Text style={styles.reqDetail}>Month: {req.month}</Text>}
                      {req.bankName && <Text style={styles.reqDetail}>Bank: {req.bankName} | Ref: {req.transactionRef}</Text>}
                      <Text style={styles.reqDate}>Submitted: {new Date(req.createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={styles.reqRight}>
                      <Text style={styles.reqAmount}>Rs. {req.amount?.toLocaleString()}</Text>
                      <View style={[styles.reqBadge, {
                        backgroundColor: req.status === 'pending' ? '#FFFBEB' :
                          req.status === 'approved' ? '#F0FBF7' : '#FEF2F2'
                      }]}>
                        <Text style={[styles.reqBadgeText, {
                          color: req.status === 'pending' ? '#F59E0B' :
                            req.status === 'approved' ? '#10B981' : '#EF4444'
                        }]}>
                          {req.status}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {req.status === 'pending' && (
                    <View style={styles.reqActions}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => Alert.alert('Approve', `Approve Rs. ${req.amount?.toLocaleString()} payment?`, [
                          { text: 'Cancel' },
                          { text: 'Approve', onPress: () => approveMutation.mutate(req._id) },
                        ])}
                        disabled={approveMutation.isPending}
                      >
                        <Ionicons name="checkmark" size={16} color={COLORS.white} />
                        <Text style={styles.approveBtnText}>Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => {
                          Alert.prompt(
                            'Reject Payment',
                            'Enter rejection reason:',
                            (reason) => { if (reason) rejectMutation.mutate({ id: req._id, reason }); }
                          );
                        }}
                        disabled={rejectMutation.isPending}
                      >
                        <Ionicons name="close" size={16} color="#EF4444" />
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {req.rejectReason && (
                    <Text style={styles.rejectReason}>Reason: {req.rejectReason}</Text>
                  )}
                </View>
              ))
            )}
          </>
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
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: '#1a1a2e', fontWeight: '800' },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 16, paddingTop: 16 },
  summaryRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  summaryCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  summaryLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },
  summaryValue: { fontSize: 20, fontWeight: '800' },
  filterRow: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginBottom: 12 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: COLORS.white },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.gray, textTransform: 'capitalize' },
  filterChipTextActive: { color: COLORS.white },
  emptyCard: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  feeCard: {
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16,
    marginBottom: 8, padding: 14, elevation: 1,
  },
  feeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  feeAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  feeAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.gold },
  feeInfo: { flex: 1 },
  feeName: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  feeDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  feeRight: { alignItems: 'flex-end' },
  feeAmount: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  feeBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  feeBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  reqCard: {
    backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16,
    marginBottom: 10, padding: 14, elevation: 1,
  },
  reqHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  reqAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  reqAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.gold },
  reqInfo: { flex: 1 },
  reqName: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  reqDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  reqDate: { fontSize: 11, color: COLORS.gray, marginTop: 3 },
  reqRight: { alignItems: 'flex-end' },
  reqAmount: { fontSize: 15, fontWeight: '800', color: COLORS.dark },
  reqBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 4 },
  reqBadgeText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  reqActions: { flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: 10, padding: 10 },
  approveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10 },
  rejectBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  rejectReason: { fontSize: 12, color: '#EF4444', marginTop: 6 },
});

export default AdminFees;