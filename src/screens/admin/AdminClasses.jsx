import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, RefreshControl,
  ActivityIndicator, Modal,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

// ── Class Detail Modal ────────────────────────────────────────────
const ClassDetailModal = ({ cls, onClose }) => {
  const { data: classDetail, isLoading } = useQuery({
    queryKey: ['admin-class-detail', cls._id],
    queryFn: () => api.get(`/classes/${cls._id}`).then(r => r.data),
  });

  const detail = classDetail?.class;

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={dStyles.container}>
        <View style={dStyles.header}>
          <View style={dStyles.headerIcon}>
            <Text style={{ fontSize: 24 }}>📚</Text>
          </View>
          <View style={dStyles.headerInfo}>
            <Text style={dStyles.title}>{cls.name}</Text>
            <Text style={dStyles.subtitle}>{cls.subject} • {cls.grade}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView style={dStyles.scroll}>

            {/* Class info */}
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>📋 Class Information</Text>
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
              ].map((row, i) => (
                <View key={i} style={dStyles.infoRow}>
                  <Text style={dStyles.infoLabel}>{row.label}</Text>
                  <Text style={dStyles.infoValue}>{row.value || 'N/A'}</Text>
                </View>
              ))}
            </View>

            {/* Teacher info */}
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>👨‍🏫 Teacher</Text>
              {detail?.teacherId ? (
                <View style={dStyles.teacherRow}>
                  <View style={dStyles.teacherAvatar}>
                    <Text style={dStyles.teacherAvatarText}>
                      {detail.teacherId?.userId?.name?.charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text style={dStyles.teacherName}>{detail.teacherId?.userId?.name}</Text>
                    <Text style={dStyles.teacherEmail}>{detail.teacherId?.userId?.email}</Text>
                    <Text style={dStyles.teacherSubjects}>
                      {detail.teacherId?.subjectExpertise?.join(' • ')}
                    </Text>
                  </View>
                </View>
              ) : (
                <Text style={dStyles.noData}>No teacher assigned</Text>
              )}
            </View>

            {/* Students */}
            <View style={dStyles.section}>
              <Text style={dStyles.sectionTitle}>
                👥 Enrolled Students ({detail?.enrolledStudents?.length || 0})
              </Text>
              {detail?.enrolledStudents?.length === 0 ? (
                <Text style={dStyles.noData}>No students enrolled</Text>
              ) : (
                detail?.enrolledStudents?.map((student, i) => (
                  <View key={i} style={dStyles.studentRow}>
                    <View style={dStyles.studentAvatar}>
                      <Text style={dStyles.studentAvatarText}>
                        {student.userId?.name?.charAt(0)}
                      </Text>
                    </View>
                    <View style={dStyles.studentInfo}>
                      <Text style={dStyles.studentName}>{student.userId?.name}</Text>
                      <Text style={dStyles.studentDetail}>
                        {student.admissionNumber} • {student.grade}
                      </Text>
                    </View>
                    <View style={[dStyles.statusBadge, {
                      backgroundColor: student.status === 'active' ? '#F0FBF7' : '#FEF2F2'
                    }]}>
                      <Text style={[dStyles.statusText, {
                        color: student.status === 'active' ? '#10B981' : '#EF4444'
                      }]}>
                        {student.status}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        )}
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
  headerIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center',
  },
  headerInfo: { flex: 1 },
  title: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  section: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 16, elevation: 2 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.dark, marginBottom: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  infoLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  infoValue: { fontSize: 13, color: COLORS.dark, fontWeight: '700' },
  teacherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  teacherAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  teacherAvatarText: { fontSize: 20, fontWeight: '800', color: COLORS.gold },
  teacherName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  teacherEmail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  teacherSubjects: { fontSize: 12, color: COLORS.primary, marginTop: 1, fontWeight: '600' },
  studentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  studentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  studentDetail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  noData: { fontSize: 13, color: COLORS.gray, textAlign: 'center', padding: 12 },
});

// ── Main Component ────────────────────────────────────────────────
const AdminClasses = () => {
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);
  const [filterGrade, setFilterGrade] = useState('all');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const classes = data?.classes || [];

  const grades = ['all', ...new Set(classes.map(c => c.grade).filter(Boolean))];

  const filtered = classes.filter(cls => {
    const matchSearch =
      cls.name?.toLowerCase().includes(search.toLowerCase()) ||
      cls.subject?.toLowerCase().includes(search.toLowerCase());
    const matchGrade = filterGrade === 'all' || cls.grade === filterGrade;
    return matchSearch && matchGrade;
  });

  return (
    <View style={styles.container}>
      {selectedClass && (
        <ClassDetailModal cls={selectedClass} onClose={() => setSelectedClass(null)} />
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Classes</Text>
        <Text style={styles.headerSub}>{classes.length} total classes</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
      >
        {/* Search */}
        <View style={styles.searchCard}>
          <View style={styles.searchRow}>
            <Ionicons name="search" size={16} color={COLORS.gray} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by class name or subject..."
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

          {/* Grade filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {grades.map(grade => (
              <TouchableOpacity
                key={grade}
                onPress={() => setFilterGrade(grade)}
                style={[styles.filterChip, filterGrade === grade && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, filterGrade === grade && styles.filterChipTextActive]}>
                  {grade === 'all' ? 'All Grades' : grade}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Stats */}
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

        {/* Classes list */}
        {isLoading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📚</Text>
            <Text style={styles.emptyText}>No classes found</Text>
          </View>
        ) : (
          filtered.map((cls, i) => (
            <TouchableOpacity
              key={i}
              style={styles.classCard}
              onPress={() => setSelectedClass(cls)}
            >
              <View style={styles.classHeader}>
                <View style={styles.classIconBox}>
                  <Text style={{ fontSize: 20 }}>📚</Text>
                </View>
                <View style={styles.classInfo}>
                  <Text style={styles.className}>{cls.name}</Text>
                  <Text style={styles.classDetail}>{cls.subject} • {cls.grade} • {cls.medium}</Text>
                  <Text style={styles.classDetail}>
                    {cls.schedule?.dayOfWeek} {cls.schedule?.startTime} • {cls.hall}
                  </Text>
                </View>
                <View style={styles.classRight}>
                  <Text style={styles.classCount}>{cls.enrolledCount}</Text>
                  <Text style={styles.classCountSub}>/{cls.maxStudents}</Text>
                  <Text style={styles.classCountLabel}>students</Text>
                </View>
              </View>

              {/* Teacher */}
              <View style={styles.teacherRow}>
                <Ionicons name="person-outline" size={13} color={COLORS.gray} />
                <Text style={styles.teacherName}>
                  {cls.teacherId?.userId?.name || 'No teacher assigned'}
                </Text>
                <View style={styles.feeBadge}>
                  <Text style={styles.feeBadgeText}>Rs. {cls.monthlyFee?.toLocaleString()}/mo</Text>
                </View>
              </View>

              {/* Capacity bar */}
              {cls.maxStudents > 0 && (
                <View style={styles.capacityBar}>
                  <View style={[styles.capacityFill, {
                    width: `${Math.min((cls.enrolledCount / cls.maxStudents) * 100, 100)}%`,
                    backgroundColor: (cls.enrolledCount / cls.maxStudents) >= 0.9 ? '#EF4444' :
                      (cls.enrolledCount / cls.maxStudents) >= 0.7 ? '#F59E0B' : '#10B981',
                  }]} />
                </View>
              )}

              <Text style={styles.viewMore}>Tap to view details →</Text>
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
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  filterScroll: { marginHorizontal: -4 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#F5F5F5', marginHorizontal: 4 },
  filterChipActive: { backgroundColor: COLORS.primary },
  filterChipText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  filterChipTextActive: { color: COLORS.white },
  statsRow: { flexDirection: 'row', gap: 10, marginHorizontal: 16, marginBottom: 12 },
  statChip: { flex: 1, backgroundColor: COLORS.white, borderRadius: 12, padding: 10, alignItems: 'center', elevation: 1 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  emptyCard: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  classCard: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 10, padding: 14, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
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