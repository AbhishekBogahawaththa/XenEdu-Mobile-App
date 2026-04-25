import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

// ── Child Detail Modal ────────────────────────────────────────────
const ChildDetailModal = ({ child, onClose }) => {
  // child.student, child.fees, child.attendance, child.recentPayments
  const student = child.student;
  const fees = child.fees;
  const attendance = child.attendance || [];
  const recentPayments = child.recentPayments || [];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={dStyles.container}>
        {/* Header */}
        <View style={dStyles.header}>
          <View style={dStyles.avatar}>
            <Text style={dStyles.avatarText}>{student?.name?.charAt(0)}</Text>
          </View>
          <View style={dStyles.headerInfo}>
            <Text style={dStyles.name}>{student?.name}</Text>
            <Text style={dStyles.detail}>{student?.admissionNumber} • {student?.grade}</Text>
            <Text style={dStyles.detail}>{student?.school}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={dStyles.scroll}>

          {/* Fee Summary */}
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>💰 Fee Status</Text>
            <View style={dStyles.feeCards}>
              <View style={[dStyles.feeCard, { borderColor: '#EF4444' }]}>
                <Text style={dStyles.feeCardLabel}>Outstanding</Text>
                <Text style={[dStyles.feeCardValue, { color: '#EF4444' }]}>
                  Rs. {fees?.totalOutstanding?.toLocaleString() || 0}
                </Text>
              </View>
              <View style={[dStyles.feeCard, { borderColor: '#F59E0B' }]}>
                <Text style={dStyles.feeCardLabel}>Unpaid Bills</Text>
                <Text style={[dStyles.feeCardValue, { color: '#F59E0B' }]}>
                  {fees?.unpaidCount || 0} months
                </Text>
              </View>
            </View>

            {/* Unpaid fees list */}
            {fees?.unpaidFees?.length > 0 && (
              <View style={dStyles.unpaidList}>
                <Text style={dStyles.unpaidTitle}>⚠️ Unpaid Fees:</Text>
                {fees.unpaidFees.map((fee, i) => (
                  <View key={i} style={dStyles.unpaidRow}>
                    <View>
                      <Text style={dStyles.unpaidClass}>{fee.class}</Text>
                      <Text style={dStyles.unpaidMonth}>{fee.month}</Text>
                    </View>
                    <Text style={dStyles.unpaidAmount}>Rs. {fee.amount?.toLocaleString()}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Attendance per class */}
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>📊 Attendance by Class</Text>
            {attendance.length === 0 ? (
              <Text style={dStyles.noData}>No attendance records yet</Text>
            ) : (
              attendance.map((cls, i) => {
                const pct = typeof cls.percentage === 'string'
                  ? parseInt(cls.percentage)
                  : cls.percentage || 0;
                return (
                  <View key={i} style={dStyles.attCard}>
                    <View style={dStyles.attHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={dStyles.attClassName}>{cls.className}</Text>
                        <Text style={dStyles.attSubject}>{cls.subject}</Text>
                      </View>
                      <Text style={[dStyles.attPct, { color: cls.atRisk ? '#EF4444' : '#10B981' }]}>
                        {cls.percentage}
                      </Text>
                    </View>
                    {cls.totalSessions > 0 && (
                      <>
                        <View style={dStyles.attBar}>
                          <View style={[dStyles.attFill, {
                            width: `${pct}%`,
                            backgroundColor: cls.atRisk ? '#EF4444' : '#10B981',
                          }]} />
                        </View>
                        <View style={dStyles.attStats}>
                          <Text style={dStyles.attPresent}>✓ {cls.presentCount} Present</Text>
                          <Text style={dStyles.attTotal}>/ {cls.totalSessions} Sessions</Text>
                        </View>
                      </>
                    )}
                    {cls.atRisk && (
                      <Text style={dStyles.attWarning}>⚠️ Below 80% minimum!</Text>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Recent payments */}
          {recentPayments.length > 0 && (
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>💳 Recent Payments</Text>
              {recentPayments.map((payment, i) => (
                <View key={i} style={dStyles.paymentRow}>
                  <View style={dStyles.paymentIcon}>
                    <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                  </View>
                  <View style={dStyles.paymentInfo}>
                    <Text style={dStyles.paymentClass}>{payment.class}</Text>
                    <Text style={dStyles.paymentDate}>
                      {new Date(payment.paidAt).toLocaleDateString('en-GB')} • {payment.method}
                    </Text>
                    <Text style={dStyles.paymentReceipt}>#{payment.receiptNumber}</Text>
                  </View>
                  <Text style={dStyles.paymentAmount}>Rs. {payment.amount?.toLocaleString()}</Text>
                </View>
              ))}
            </View>
          )}

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
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  headerInfo: { flex: 1 },
  name: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  detail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  section: {
    backgroundColor: COLORS.white, borderRadius: 16,
    margin: 16, marginBottom: 0, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  feeCards: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  feeCard: {
    flex: 1, padding: 12, borderRadius: 12,
    borderWidth: 1.5, backgroundColor: '#FAFAFA',
  },
  feeCardLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600', marginBottom: 4 },
  feeCardValue: { fontSize: 18, fontWeight: '800' },
  unpaidList: {
    backgroundColor: '#FFF9F9', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  unpaidTitle: { fontSize: 13, fontWeight: '700', color: '#EF4444', marginBottom: 8 },
  unpaidRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#FEE2E2',
  },
  unpaidClass: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  unpaidMonth: { fontSize: 11, color: COLORS.gray },
  unpaidAmount: { fontSize: 14, fontWeight: '700', color: '#EF4444' },
  noData: { color: COLORS.gray, fontSize: 14, textAlign: 'center', padding: 12 },
  attCard: {
    backgroundColor: '#FAFAFA', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#F0F0F0',
  },
  attHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  attClassName: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  attSubject: { fontSize: 11, color: COLORS.gray },
  attPct: { fontSize: 18, fontWeight: '800' },
  attBar: { height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, marginBottom: 6 },
  attFill: { height: 6, borderRadius: 3 },
  attStats: { flexDirection: 'row', gap: 8 },
  attPresent: { fontSize: 11, color: '#10B981', fontWeight: '600' },
  attTotal: { fontSize: 11, color: COLORS.gray },
  attWarning: { fontSize: 11, color: '#EF4444', fontWeight: '700', marginTop: 6 },
  paymentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  paymentIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center',
  },
  paymentInfo: { flex: 1 },
  paymentClass: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  paymentDate: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  paymentReceipt: { fontSize: 10, color: COLORS.primary, marginTop: 1 },
  paymentAmount: { fontSize: 14, fontWeight: '700', color: '#10B981' },
});

// ── Parent Dashboard ──────────────────────────────────────────────
const ParentDashboard = () => {
  const { user, logout } = useAuthStore();
  const [selectedChild, setSelectedChild] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['parent-dashboard'],
    queryFn: () => api.get('/dashboard/parent').then(r => r.data),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const children = dashboard?.children || [];

  // Total outstanding across all children
  const totalUnpaid = children.reduce((s, c) => s + (c.fees?.totalOutstanding || 0), 0);
  const totalClasses = children.reduce((s, c) => s + (c.attendance?.length || 0), 0);

  // Check if any child is at risk
  const atRiskChildren = children.filter(c =>
    c.attendance?.some(a => a.atRisk)
  );

  return (
    <View style={styles.container}>
      {selectedChild && (
        <ChildDetailModal
          child={selectedChild}
          onClose={() => setSelectedChild(null)}
        />
      )}

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back! 👋</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.role}>Parent</Text>
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
            { label: 'Children', value: children.length, icon: 'people', color: '#3B82F6' },
            { label: 'At Risk', value: atRiskChildren.length, icon: 'warning', color: '#F59E0B' },
            { label: 'Outstanding', value: `Rs.${totalUnpaid.toLocaleString()}`, icon: 'card', color: '#EF4444' },
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

        {/* Children list */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>My Children</Text>

          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
          ) : children.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>👨‍👩‍👧‍👦</Text>
              <Text style={styles.emptyText}>No children linked yet</Text>
              <Text style={styles.emptySubText}>Contact admin to link your children</Text>
            </View>
          ) : (
            children.map((child, i) => {
              const student = child.student;
              const fees = child.fees;
              const attendance = child.attendance || [];

              // Overall attendance
              const attWithSessions = attendance.filter(a => a.totalSessions > 0);
              const avgAtt = attWithSessions.length > 0
                ? Math.round(attWithSessions.reduce((s, a) => s + parseInt(a.percentage), 0) / attWithSessions.length)
                : null;
              const atRisk = attendance.some(a => a.atRisk);

              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.childCard, atRisk && styles.childCardAtRisk]}
                  onPress={() => setSelectedChild(child)}
                >
                  {/* Child header */}
                  <View style={styles.childHeader}>
                    <View style={[styles.childAvatar, { backgroundColor: atRisk ? '#EF4444' : COLORS.primary }]}>
                      <Text style={styles.childAvatarText}>{student?.name?.charAt(0)}</Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={styles.childName}>{student?.name}</Text>
                      <Text style={styles.childDetail}>
                        {student?.admissionNumber} • {student?.grade}
                      </Text>
                      <Text style={styles.childDetail}>{student?.school}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={COLORS.gray} />
                  </View>

                  {/* Stats */}
                  <View style={styles.childStats}>
                    <View style={styles.childStat}>
                      <Ionicons name="book-outline" size={13} color={COLORS.primary} />
                      <Text style={styles.childStatText}>{attendance.length} Classes</Text>
                    </View>
                    {avgAtt !== null && (
                      <View style={styles.childStat}>
                        <Ionicons name="checkmark-circle-outline" size={13} color={avgAtt >= 80 ? '#10B981' : '#EF4444'} />
                        <Text style={[styles.childStatText, { color: avgAtt >= 80 ? '#10B981' : '#EF4444' }]}>
                          {avgAtt}% Attendance
                        </Text>
                      </View>
                    )}
                    <View style={styles.childStat}>
                      <Ionicons name="card-outline" size={13} color={fees?.totalOutstanding > 0 ? '#EF4444' : '#10B981'} />
                      <Text style={[styles.childStatText, { color: fees?.totalOutstanding > 0 ? '#EF4444' : '#10B981' }]}>
                        Rs. {(fees?.totalOutstanding || 0).toLocaleString()} Due
                      </Text>
                    </View>
                  </View>

                  {/* Alerts */}
                  {atRisk && (
                    <View style={styles.alertBanner}>
                      <Ionicons name="warning" size={13} color="#F59E0B" />
                      <Text style={styles.alertText}>Attendance below 80%!</Text>
                    </View>
                  )}
                  {fees?.totalOutstanding > 0 && (
                    <View style={styles.feeBanner}>
                      <Ionicons name="card" size={13} color="#EF4444" />
                      <Text style={styles.feeText}>
                        Rs. {fees.totalOutstanding.toLocaleString()} outstanding
                      </Text>
                    </View>
                  )}

                  <Text style={styles.viewDetail}>Tap to view details →</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>📌 Important Reminders</Text>
          {[
            'Minimum 80% attendance required per class',
            'Fees are due by end of each month',
            'Contact admin for any queries',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
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
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 24, paddingTop: 56, paddingBottom: 20,
  },
  greeting: { color: 'rgba(255,255,255,0.7)', fontSize: 14 },
  name: { color: COLORS.white, fontSize: 22, fontWeight: '800' },
  role: { color: COLORS.gold, fontSize: 12, fontWeight: '600', marginTop: 2 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 24,
  },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.white, borderRadius: 16, padding: 14,
    alignItems: 'center', elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  statValue: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 2 },
  statLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600', textAlign: 'center' },
  section: { paddingHorizontal: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 32,
    alignItems: 'center', elevation: 2,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: COLORS.gray, textAlign: 'center' },
  childCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 12,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  childCardAtRisk: { borderWidth: 1.5, borderColor: '#FEE2E2' },
  childHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  childAvatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  childAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.gold },
  childInfo: { flex: 1 },
  childName: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  childDetail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  childStats: { flexDirection: 'row', gap: 10, marginBottom: 8, flexWrap: 'wrap' },
  childStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  childStatText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFF9E6', borderRadius: 8, padding: 8, marginBottom: 4,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  alertText: { fontSize: 12, color: '#92400E', fontWeight: '600' },
  feeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FEF2F2', borderRadius: 8, padding: 8, marginBottom: 4,
    borderWidth: 1, borderColor: '#FEE2E2',
  },
  feeText: { fontSize: 12, color: '#991B1B', fontWeight: '600' },
  viewDetail: { fontSize: 12, color: COLORS.primary, fontWeight: '600', textAlign: 'right', marginTop: 6 },
  tipsCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginHorizontal: 20, marginBottom: 16, elevation: 2,
  },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 5 },
  tipText: { fontSize: 13, color: COLORS.gray, flex: 1 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginHorizontal: 20, padding: 16,
    backgroundColor: '#FEF2F2', borderRadius: 16, marginBottom: 12,
  },
  logoutText: { color: '#EF4444', fontSize: 15, fontWeight: '700' },
});

export default ParentDashboard;