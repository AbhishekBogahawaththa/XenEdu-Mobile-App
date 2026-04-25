import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

// ── Course Work Modal ─────────────────────────────────────────────
const CourseWorkModal = ({ cls, onClose }) => {
  const { data: courseWork, isLoading } = useQuery({
    queryKey: ['mobile-coursework', cls._id],
    queryFn: () => api.get(`/coursework/${cls._id}`).then(r => r.data),
  });

  const typeConfig = {
    recording: { icon: '🎥', color: '#3B82F6' },
    instruction: { icon: '📋', color: '#10B981' },
    assignment: { icon: '📝', color: '#F59E0B' },
    notes: { icon: '📄', color: '#8B5CF6' },
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={cwStyles.container}>
        {/* Header */}
        <View style={cwStyles.header}>
          <View>
            <Text style={cwStyles.title}>Course Work</Text>
            <Text style={cwStyles.subtitle}>{cls.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={cwStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={cwStyles.scroll}>
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : courseWork?.items?.length === 0 ? (
            <View style={cwStyles.empty}>
              <Text style={cwStyles.emptyIcon}>📚</Text>
              <Text style={cwStyles.emptyText}>No course work uploaded yet</Text>
              <Text style={cwStyles.emptySubText}>Your teacher hasn't uploaded any materials yet</Text>
            </View>
          ) : (
            <View style={cwStyles.list}>
              {courseWork?.items?.map((item, i) => {
                const config = typeConfig[item.type] || typeConfig.instruction;
                return (
                  <View key={i} style={cwStyles.item}>
                    <View style={[cwStyles.itemIcon, { backgroundColor: config.color + '20' }]}>
                      <Text style={cwStyles.itemIconText}>{config.icon}</Text>
                    </View>
                    <View style={cwStyles.itemContent}>
                      <Text style={cwStyles.itemTitle}>{item.title}</Text>
                      {item.description && (
                        <Text style={cwStyles.itemDesc}>{item.description}</Text>
                      )}
                      <View style={cwStyles.itemMeta}>
                        <Text style={[cwStyles.itemType, { color: config.color }]}>
                          {item.type}
                        </Text>
                        <Text style={cwStyles.itemDate}>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
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

const cwStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: COLORS.gray, textAlign: 'center', paddingHorizontal: 32 },
  list: { padding: 16, gap: 12 },
  item: {
    flexDirection: 'row', gap: 12,
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  itemIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  itemIconText: { fontSize: 22 },
  itemContent: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  itemDesc: { fontSize: 13, color: COLORS.gray, marginBottom: 6 },
  itemMeta: { flexDirection: 'row', gap: 12 },
  itemType: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  itemDate: { fontSize: 11, color: COLORS.gray },
});

// ── Fee Payment Modal ─────────────────────────────────────────────
const FeePaymentModal = ({ cls, onClose }) => {
  const [method, setMethod] = useState('cash');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const { data: myFees } = useQuery({
    queryKey: ['mobile-fees'],
    queryFn: () => api.get('/fees/student').then(r => r.data),
  });

  const unpaidFees = myFees?.fees?.filter(f =>
    String(f.classId?._id || f.classId) === String(cls._id) &&
    (f.status === 'unpaid' || f.status === 'overdue')
  ) || [];

  const paidMonths = myFees?.fees?.filter(f =>
    String(f.classId?._id || f.classId) === String(cls._id) &&
    f.status === 'paid'
  ).map(f => f.month) || [];

  const generateMonths = () => {
    const options = [];
    const now = new Date();
    for (let i = -2; i <= 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const isPaid = paidMonths.includes(value);
      options.push({ value, label, isPaid });
    }
    return options;
  };

  const handleSubmit = async () => {
    if (!selectedMonth) {
      Alert.alert('Error', 'Please select a month to pay for');
      return;
    }
    setLoading(true);
    try {
      const selectedFee = unpaidFees.find(f => f.month === selectedMonth);
      const formData = new FormData();
      formData.append('classId', cls._id);
      formData.append('amount', cls.monthlyFee);
      formData.append('method', method);
      formData.append('month', selectedMonth);
      if (selectedFee) formData.append('feeRecordId', selectedFee._id);
      if (notes) formData.append('notes', notes);

      await api.post('/payment-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success! ✅', 'Payment request submitted! Admin will approve shortly.', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  };

  const months = generateMonths();

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={payStyles.container}>
        {/* Header */}
        <View style={payStyles.header}>
          <View>
            <Text style={payStyles.title}>Pay Fee</Text>
            <Text style={payStyles.subtitle}>{cls.name} — Rs. {cls.monthlyFee?.toLocaleString()}/month</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={payStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={payStyles.scroll} contentContainerStyle={payStyles.scrollContent}>

          {/* Month selector */}
          <Text style={payStyles.sectionTitle}>📅 Select Month</Text>
          {months.map(m => (
            <TouchableOpacity
              key={m.value}
              onPress={() => !m.isPaid && setSelectedMonth(m.value)}
              disabled={m.isPaid}
              style={[
                payStyles.monthBtn,
                selectedMonth === m.value && payStyles.monthBtnSelected,
                m.isPaid && payStyles.monthBtnPaid,
              ]}
            >
              <View>
                <Text style={[payStyles.monthLabel, selectedMonth === m.value && { color: COLORS.primary }]}>
                  {m.label}
                </Text>
                <Text style={payStyles.monthFee}>Rs. {cls.monthlyFee?.toLocaleString()}</Text>
              </View>
              <View style={[
                payStyles.monthStatus,
                m.isPaid ? payStyles.paidStatus : payStyles.unpaidStatus,
              ]}>
                <Text style={[payStyles.monthStatusText, { color: m.isPaid ? '#10B981' : '#EF4444' }]}>
                  {m.isPaid ? '✓ Paid' : 'Unpaid'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Payment method */}
          <Text style={payStyles.sectionTitle}>💳 Payment Method</Text>
          <View style={payStyles.methodRow}>
            {[
              { key: 'cash', label: 'Cash', icon: '💵' },
              { key: 'card', label: 'Card', icon: '💳' },
              { key: 'bank_transfer', label: 'Bank Transfer', icon: '🏦' },
            ].map(m => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={[payStyles.methodBtn, method === m.key && payStyles.methodBtnActive]}
              >
                <Text style={payStyles.methodIcon}>{m.icon}</Text>
                <Text style={[payStyles.methodLabel, method === m.key && { color: COLORS.primary }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cash info */}
          {method === 'cash' && (
            <View style={payStyles.infoBox}>
              <Text style={payStyles.infoTitle}>💵 Pay at institute counter</Text>
              <Text style={payStyles.infoText}>
                Visit the institute with Rs. {cls.monthlyFee?.toLocaleString()} cash.
                The cashier will scan your barcode and record the payment.
              </Text>
            </View>
          )}

          {/* Bank transfer info */}
          {method === 'bank_transfer' && (
            <View style={payStyles.infoBox}>
              <Text style={payStyles.infoTitle}>🏦 XenEdu Bank Details</Text>
              <Text style={payStyles.infoText}>Bank: Bank of Ceylon</Text>
              <Text style={payStyles.infoText}>Account: 1234-5678-9012</Text>
              <Text style={payStyles.infoText}>Branch: Mirigama</Text>
              <Text style={payStyles.infoText}>Name: XenEdu Institute</Text>
            </View>
          )}

          {/* Submit button */}
          <TouchableOpacity
            style={[payStyles.submitBtn, (!selectedMonth || loading) && payStyles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!selectedMonth || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={payStyles.submitBtnText}>
                {!selectedMonth
                  ? 'Select a month first'
                  : `Submit Payment — Rs. ${cls.monthlyFee?.toLocaleString()} (${selectedMonth})`
                }
              </Text>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const payStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 10, marginTop: 16, textTransform: 'uppercase' },
  monthBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 2, borderColor: '#F0F0F0',
  },
  monthBtnSelected: { borderColor: COLORS.primary, backgroundColor: '#F0FBF7' },
  monthBtnPaid: { opacity: 0.6 },
  monthLabel: { fontSize: 15, fontWeight: '600', color: COLORS.dark },
  monthFee: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  monthStatus: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  paidStatus: { backgroundColor: '#F0FBF7' },
  unpaidStatus: { backgroundColor: '#FEF2F2' },
  monthStatusText: { fontSize: 12, fontWeight: '700' },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: {
    flex: 1, alignItems: 'center', padding: 14,
    backgroundColor: COLORS.white, borderRadius: 12,
    borderWidth: 2, borderColor: '#F0F0F0',
  },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0FBF7' },
  methodIcon: { fontSize: 24, marginBottom: 4 },
  methodLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  infoBox: {
    backgroundColor: '#F0FBF7', borderRadius: 12, padding: 14, marginTop: 12,
    borderWidth: 1, borderColor: '#C8EDE2',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 6 },
  infoText: { fontSize: 13, color: '#444', marginBottom: 2 },
  submitBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 20,
  },
  submitBtnDisabled: { backgroundColor: COLORS.gray },
  submitBtnText: { color: COLORS.white, fontSize: 14, fontWeight: '700' },
});

// ── Main Component ────────────────────────────────────────────────
const StudentClasses = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('enrolled');
  const [selectedClass, setSelectedClass] = useState(null);
  const [payClass, setPayClass] = useState(null);

  const { data: classes, isLoading, refetch } = useQuery({
    queryKey: ['mobile-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const { data: dashboard } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

  const enrollMutation = useMutation({
    mutationFn: (classId) => api.post(`/classes/${classId}/enroll`),
    onSuccess: () => {
      queryClient.invalidateQueries(['mobile-classes']);
      queryClient.invalidateQueries(['mobile-dashboard']);
    },
  });

  const unenrollMutation = useMutation({
    mutationFn: (classId) => api.delete(`/classes/${classId}/unenroll`),
    onSuccess: () => {
      queryClient.invalidateQueries(['mobile-classes']);
      queryClient.invalidateQueries(['mobile-dashboard']);
    },
  });

  const enrolledIds = dashboard?.enrolledClasses?.map(c => String(c.classId)) ?? [];
  const allClasses = classes?.classes ?? [];
  const enrolledClasses = allClasses.filter(c => enrolledIds.includes(String(c._id)));
  const browseClasses = allClasses.filter(c => !enrolledIds.includes(String(c._id)));
  const displayClasses = activeTab === 'enrolled' ? enrolledClasses : browseClasses;

  return (
    <View style={styles.container}>
      {/* Course Work Modal */}
      {selectedClass && (
        <CourseWorkModal cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}

      {/* Fee Payment Modal */}
      {payClass && (
        <FeePaymentModal cls={payClass} onClose={() => setPayClass(null)} />
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Classes</Text>
        <Text style={styles.headerSub}>Manage your enrolled classes</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'enrolled', label: `Enrolled (${enrolledClasses.length})` },
          { key: 'browse', label: 'Browse All' },
        ].map(t => (
          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)}
            style={[styles.tab, activeTab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Classes list */}
      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : displayClasses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>
              {activeTab === 'enrolled' ? 'No classes enrolled yet' : 'No classes available'}
            </Text>
            {activeTab === 'enrolled' && (
              <TouchableOpacity onPress={() => setActiveTab('browse')} style={styles.browseBtn}>
                <Text style={styles.browseBtnText}>Browse Classes</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayClasses.map((cls, i) => {
            const isEnrolled = enrolledIds.includes(String(cls._id));
            const attData = dashboard?.enrolledClasses?.find(c => String(c.classId) === String(cls._id));
            return (
              <View key={i} style={[styles.classCard, isEnrolled && styles.classCardEnrolled]}>
                {/* Class header */}
                <View style={styles.classHeader}>
                  <View style={styles.classIconBox}>
                    <Text style={styles.classIconText}>📚</Text>
                  </View>
                  <View style={styles.classInfo}>
                    <Text style={styles.className}>{cls.name}</Text>
                    <Text style={styles.classSubject}>{cls.subject} • {cls.grade} • {cls.medium}</Text>
                  </View>
                  {isEnrolled && (
                    <View style={styles.enrolledBadge}>
                      <Text style={styles.enrolledBadgeText}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Class details */}
                <View style={styles.classDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.detailText}>{cls.teacherId?.userId?.name || 'Not assigned'}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.detailText}>{cls.schedule?.dayOfWeek} at {cls.schedule?.startTime}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="location-outline" size={14} color={COLORS.gray} />
                    <Text style={styles.detailText}>{cls.hall}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons name="card-outline" size={14} color={COLORS.gray} />
                    <Text style={[styles.detailText, { fontWeight: '700', color: COLORS.primary }]}>
                      Rs. {cls.monthlyFee?.toLocaleString()}/month
                    </Text>
                  </View>
                </View>

                {/* Attendance bar */}
                {isEnrolled && attData && (
                  <View style={styles.attContainer}>
                    <View style={styles.attRow}>
                      <Text style={styles.attLabel}>Attendance</Text>
                      <Text style={[styles.attPct, { color: attData.atRisk ? '#EF4444' : '#10B981' }]}>
                        {attData.percentage}
                      </Text>
                    </View>
                    <View style={styles.attBar}>
                      <View style={[styles.attFill, {
                        width: attData.percentage,
                        backgroundColor: attData.atRisk ? '#EF4444' : '#10B981',
                      }]} />
                    </View>
                    {attData.atRisk && (
                      <Text style={styles.attWarning}>⚠️ Below minimum attendance</Text>
                    )}
                  </View>
                )}

                {/* Action buttons */}
                <View style={styles.actionRow}>
                  {isEnrolled ? (
                    <>
                      <TouchableOpacity
                        style={styles.cwBtn}
                        onPress={() => setSelectedClass(cls)}
                      >
                        <Ionicons name="book-outline" size={14} color={COLORS.primary} />
                        <Text style={styles.cwBtnText}>Course Work</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.payBtn}
                        onPress={() => setPayClass(cls)}
                      >
                        <Ionicons name="card-outline" size={14} color="white" />
                        <Text style={styles.payBtnText}>Pay Fee</Text>
                      </TouchableOpacity>
                    </>
                  ) : (
                    <TouchableOpacity
                      style={[styles.enrollBtn, cls.availableSlots <= 0 && styles.enrollBtnDisabled]}
                      onPress={() => enrollMutation.mutate(cls._id)}
                      disabled={cls.availableSlots <= 0 || enrollMutation.isPending}
                    >
                      <Text style={styles.enrollBtnText}>
                        {cls.availableSlots <= 0 ? 'Class Full' : 'Enroll Now'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { padding: 24, paddingTop: 56, paddingBottom: 16 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 0,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 4,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  tabActive: { backgroundColor: COLORS.white },
  tabText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.7)' },
  tabTextActive: { color: COLORS.primary },
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: 16, paddingTop: 16 },
  emptyContainer: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: COLORS.gray, fontWeight: '600' },
  browseBtn: { marginTop: 16, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  browseBtnText: { color: COLORS.white, fontWeight: '700' },
  classCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  classCardEnrolled: { borderWidth: 2, borderColor: COLORS.primary },
  classHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  classIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  classIconText: { fontSize: 22 },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  classSubject: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  enrolledBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  enrolledBadgeText: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  classDetails: { gap: 6, marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.gray },
  attContainer: { marginBottom: 12 },
  attRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  attLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  attPct: { fontSize: 12, fontWeight: '700' },
  attBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3 },
  attFill: { height: 6, borderRadius: 3 },
  attWarning: { fontSize: 11, color: '#EF4444', marginTop: 4, fontWeight: '600' },
  actionRow: { flexDirection: 'row', gap: 8 },
  enrollBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  enrollBtnDisabled: { backgroundColor: COLORS.gray },
  enrollBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  cwBtn: {
    flex: 1, backgroundColor: '#F0FBF7', borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 4,
    borderWidth: 1, borderColor: COLORS.primary,
  },
  cwBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 13 },
  payBtn: {
    flex: 1, backgroundColor: COLORS.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center', flexDirection: 'row',
    justifyContent: 'center', gap: 4,
  },
  payBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});

export default StudentClasses;