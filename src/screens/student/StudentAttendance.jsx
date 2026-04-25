import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const StudentAttendance = () => {
  const [selectedClassId, setSelectedClassId] = useState('all');

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

  const enrolledClasses = dashboard?.enrolledClasses || [];

  // Build class stats from dashboard data
  const classStats = enrolledClasses.map(cls => {
    const present = cls.presentCount || 0;
    const total = cls.totalSessions || 0;
    const absent = total - present;
    const pct = total > 0 ? Math.round((present / total) * 100) : null;
    return {
      classId: String(cls.classId),
      name: cls.className,
      subject: cls.subject,
      hall: cls.hall,
      schedule: cls.schedule,
      present,
      absent,
      late: 0,
      total,
      pct,
      atRisk: cls.atRisk,
      percentage: cls.percentage,
    };
  });

  // Overall stats
  const totalPresent = classStats.reduce((s, c) => s + c.present, 0);
  const totalSessions = classStats.reduce((s, c) => s + c.total, 0);
  const totalAbsent = totalSessions - totalPresent;
  const overallPct = totalSessions > 0
    ? Math.round((totalPresent / totalSessions) * 100)
    : 0;

  // Filter by selected class
  const filteredStats = selectedClassId === 'all'
    ? classStats
    : classStats.filter(c => c.classId === selectedClassId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSub}>Your attendance history</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Overall stats card */}
            <View style={styles.overallCard}>
              <View style={styles.overallLeft}>
                <Text style={[styles.overallPct, {
                  color: overallPct >= 80 ? '#10B981' :
                    overallPct >= 60 ? '#F59E0B' : '#EF4444'
                }]}>
                  {totalSessions > 0 ? `${overallPct}%` : 'N/A'}
                </Text>
                <Text style={styles.overallLabel}>Overall Attendance</Text>
                {totalSessions > 0 && (
                  <>
                    <View style={styles.overallBar}>
                      <View style={[styles.overallFill, {
                        width: `${overallPct}%`,
                        backgroundColor: overallPct >= 80 ? '#10B981' : '#EF4444',
                      }]} />
                    </View>
                    {overallPct < 80 && (
                      <Text style={styles.overallWarning}>⚠️ Below 80% minimum!</Text>
                    )}
                    {overallPct >= 80 && (
                      <Text style={styles.overallGood}>✅ Good standing!</Text>
                    )}
                  </>
                )}
              </View>
              <View style={styles.overallStats}>
                {[
                  { label: 'Present', value: totalPresent, color: '#10B981' },
                  { label: 'Absent', value: totalAbsent, color: '#EF4444' },
                  { label: 'Sessions', value: totalSessions, color: COLORS.primary },
                  { label: 'Classes', value: classStats.length, color: '#8B5CF6' },
                ].map((s, i) => (
                  <View key={i} style={styles.overallStat}>
                    <Text style={[styles.overallStatValue, { color: s.color }]}>{s.value}</Text>
                    <Text style={styles.overallStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Class filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Class</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                <TouchableOpacity
                  onPress={() => setSelectedClassId('all')}
                  style={[styles.filterChip, selectedClassId === 'all' && styles.filterChipActive]}
                >
                  <Text style={[styles.filterChipText, selectedClassId === 'all' && styles.filterChipTextActive]}>
                    All Classes
                  </Text>
                </TouchableOpacity>
                {classStats.map((cls, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => setSelectedClassId(cls.classId)}
                    style={[styles.filterChip, selectedClassId === cls.classId && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, selectedClassId === cls.classId && styles.filterChipTextActive]}>
                      {cls.name}
                    </Text>
                    {cls.pct !== null && (
                      <Text style={[styles.filterChipPct, {
                        color: selectedClassId === cls.classId
                          ? 'rgba(255,255,255,0.8)'
                          : cls.pct >= 80 ? '#10B981' : '#EF4444'
                      }]}>
                        {cls.pct}%
                      </Text>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Class cards */}
              {enrolledClasses.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📋</Text>
                  <Text style={styles.emptyText}>No classes enrolled yet</Text>
                </View>
              ) : (
                <View style={styles.classCards}>
                  {filteredStats.map((cls, i) => (
                    <View key={i} style={[styles.classCard, cls.atRisk && styles.classCardAtRisk]}>
                      {/* Class header */}
                      <View style={styles.classCardHeader}>
                        <View style={styles.classCardIcon}>
                          <Text>📚</Text>
                        </View>
                        <View style={styles.classCardInfo}>
                          <Text style={styles.classCardName}>{cls.name}</Text>
                          <Text style={styles.classCardSubject}>{cls.subject}</Text>
                        </View>
                        <Text style={[styles.classCardPct, {
                          color: cls.pct === null ? COLORS.gray :
                            cls.pct >= 80 ? '#10B981' : '#EF4444'
                        }]}>
                          {cls.pct !== null ? `${cls.pct}%` : 'N/A'}
                        </Text>
                      </View>

                      {cls.total > 0 ? (
                        <>
                          {/* Progress bar */}
                          <View style={styles.classBar}>
                            <View style={[styles.classBarFill, {
                              width: `${cls.pct}%`,
                              backgroundColor: cls.pct >= 80 ? '#10B981' : '#EF4444',
                            }]} />
                          </View>

                          {/* Stats badges */}
                          <View style={styles.statBadges}>
                            <View style={[styles.statBadge, { backgroundColor: '#F0FBF7' }]}>
                              <Text style={[styles.statBadgeText, { color: '#10B981' }]}>
                                ✓ {cls.present} Present
                              </Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#FEF2F2' }]}>
                              <Text style={[styles.statBadgeText, { color: '#EF4444' }]}>
                                ✗ {cls.absent} Absent
                              </Text>
                            </View>
                            <View style={[styles.statBadge, { backgroundColor: '#F5F5F5' }]}>
                              <Text style={[styles.statBadgeText, { color: COLORS.gray }]}>
                                {cls.total} Total
                              </Text>
                            </View>
                          </View>

                          {/* At risk warning */}
                          {cls.atRisk && (
                            <View style={styles.atRiskBanner}>
                              <Ionicons name="warning" size={12} color="#F59E0B" />
                              <Text style={styles.atRiskText}>
                                Need {Math.max(0, Math.ceil(0.8 * cls.total - cls.present))} more sessions to reach 80%
                              </Text>
                            </View>
                          )}

                          {/* Good standing */}
                          {cls.pct >= 80 && (
                            <View style={styles.goodBanner}>
                              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                              <Text style={styles.goodText}>Good standing ✅</Text>
                            </View>
                          )}
                        </>
                      ) : (
                        <Text style={styles.noSessionText}>No sessions held yet</Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Tips */}
            <View style={styles.tipsCard}>
              <Text style={styles.tipsTitle}>📌 Attendance Rules</Text>
              {[
                'Minimum 80% attendance required per class',
                'Being late counts as a late mark — not absent',
                'Contact your teacher for any attendance disputes',
                'Low attendance may affect exam eligibility',
              ].map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <View style={styles.tipDot} />
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>
          </>
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
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16,
  },
  overallCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 16, padding: 16, flexDirection: 'row', gap: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  overallLeft: { flex: 1 },
  overallPct: { fontSize: 44, fontWeight: '900' },
  overallLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 8 },
  overallBar: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginBottom: 6 },
  overallFill: { height: 8, borderRadius: 4 },
  overallWarning: { fontSize: 11, color: '#EF4444', fontWeight: '700' },
  overallGood: { fontSize: 11, color: '#10B981', fontWeight: '700' },
  overallStats: { justifyContent: 'space-around', gap: 8 },
  overallStat: { alignItems: 'center' },
  overallStatValue: { fontSize: 20, fontWeight: '800' },
  overallStatLabel: { fontSize: 10, color: COLORS.gray, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  filterScroll: { marginBottom: 12 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.white, marginRight: 8,
    borderWidth: 1.5, borderColor: '#E0E0E0', alignItems: 'center',
  },
  filterChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: COLORS.dark },
  filterChipTextActive: { color: COLORS.white },
  filterChipPct: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  emptyCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 32, alignItems: 'center',
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  classCards: { gap: 10 },
  classCard: {
    backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  classCardAtRisk: { borderWidth: 1.5, borderColor: '#FEE2E2' },
  classCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  classCardIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center',
  },
  classCardInfo: { flex: 1 },
  classCardName: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  classCardSubject: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  classCardPct: { fontSize: 22, fontWeight: '900' },
  classBar: { height: 8, backgroundColor: '#F0F0F0', borderRadius: 4, marginBottom: 10 },
  classBarFill: { height: 8, borderRadius: 4 },
  statBadges: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 8 },
  statBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statBadgeText: { fontSize: 12, fontWeight: '700' },
  atRiskBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  atRiskText: { fontSize: 11, color: '#92400E', fontWeight: '600', flex: 1 },
  goodBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F0FBF7', borderRadius: 8, padding: 8,
    borderWidth: 1, borderColor: '#C8EDE2',
  },
  goodText: { fontSize: 11, color: '#065F46', fontWeight: '600' },
  noSessionText: { fontSize: 13, color: COLORS.gray, textAlign: 'center', padding: 8 },
  tipsCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginBottom: 16, elevation: 2,
  },
  tipsTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.primary, marginTop: 5 },
  tipText: { fontSize: 13, color: COLORS.gray, flex: 1 },
});

export default StudentAttendance;