import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl, ActivityIndicator,
  Modal, Alert, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS, SUBJECTS } from '../../utils/constants';

const AddTeacherModal = ({ onClose }) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [qualifications, setQualifications] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState([]);

  const createMutation = useMutation({
    mutationFn: () => api.post('/teachers', {
      name, email, password: password || 'XenEdu@1234',
      contactNumber, qualifications, subjectExpertise: selectedSubjects,
    }),
    onSuccess: () => {
      Alert.alert('Success', 'Teacher created successfully!');
      queryClient.invalidateQueries(['admin-teachers-mobile']);
      onClose();
    },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  const toggleSubject = (subject) => setSelectedSubjects(prev =>
    prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
  );

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={aStyles.header}>
          <Text style={aStyles.title}>Add Teacher</Text>
          <TouchableOpacity onPress={onClose} style={aStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {[
            { label: 'Full Name *', value: name, onChange: setName, placeholder: 'Mr. John Silva', cap: 'words' },
            { label: 'Email *', value: email, onChange: setEmail, placeholder: 'john@xenedu.com', keyboard: 'email-address', cap: 'none' },
            { label: 'Password (optional)', value: password, onChange: setPassword, placeholder: 'Default: XenEdu@1234', cap: 'none' },
            { label: 'Contact Number', value: contactNumber, onChange: setContactNumber, placeholder: '07XXXXXXXX', keyboard: 'phone-pad' },
            { label: 'Qualifications', value: qualifications, onChange: setQualifications, placeholder: 'BSc Physics, University of Colombo' },
          ].map((f, i) => (
            <View key={i} style={aStyles.inputGroup}>
              <Text style={aStyles.label}>{f.label}</Text>
              <TextInput style={aStyles.input} value={f.value} onChangeText={f.onChange}
                placeholder={f.placeholder} placeholderTextColor={COLORS.gray}
                keyboardType={f.keyboard || 'default'} autoCapitalize={f.cap || 'sentences'} />
            </View>
          ))}
          <Text style={aStyles.label}>Subject Expertise</Text>
          <View style={aStyles.subjectGrid}>
            {SUBJECTS.map(s => (
              <TouchableOpacity key={s}
                style={[aStyles.subjectBtn, selectedSubjects.includes(s) && aStyles.subjectBtnActive]}
                onPress={() => toggleSubject(s)}>
                <Text style={[aStyles.subjectText, selectedSubjects.includes(s) && aStyles.subjectTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[aStyles.createBtn, createMutation.isPending && { opacity: 0.6 }]}
            onPress={() => {
              if (!name || !email) return Alert.alert('Error', 'Name and email required');
              createMutation.mutate();
            }} disabled={createMutation.isPending}>
            {createMutation.isPending ? <ActivityIndicator color={COLORS.white} /> :
              <Text style={aStyles.createBtnText}>Create Teacher</Text>}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const aStyles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.white, borderRadius: 10, padding: 12, fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#E0E0E0' },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  subjectBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0' },
  subjectBtnActive: { backgroundColor: '#F0FBF7', borderColor: COLORS.primary },
  subjectText: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  subjectTextActive: { color: COLORS.primary },
  createBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8 },
  createBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

const TeacherDetailModal = ({ teacher, onClose }) => {
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/teachers/${teacher._id}`),
    onSuccess: () => { Alert.alert('Deleted', 'Teacher removed'); queryClient.invalidateQueries(['admin-teachers-mobile']); onClose(); },
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Failed'),
  });

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
        <View style={dStyles.header}>
          <View style={dStyles.avatar}><Text style={dStyles.avatarText}>{teacher.userId?.name?.charAt(0)}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={dStyles.name}>{teacher.userId?.name}</Text>
            <Text style={dStyles.email}>{teacher.userId?.email}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={{ flex: 1 }}>
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>Details</Text>
            {[
              { label: 'Contact', value: teacher.contactNumber || 'N/A' },
              { label: 'Classes', value: `${teacher.assignedClasses?.length ?? 0} assigned` },
              { label: 'Qualifications', value: teacher.qualifications || 'N/A' },
              { label: 'Status', value: teacher.isAvailable ? 'Available' : 'Unavailable' },
            ].map((row, i) => (
              <View key={i} style={dStyles.row}>
                <Text style={dStyles.rowLabel}>{row.label}</Text>
                <Text style={dStyles.rowValue}>{row.value}</Text>
              </View>
            ))}
          </View>
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>Subject Expertise</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {teacher.subjectExpertise?.length === 0 && <Text style={{ color: COLORS.gray, fontSize: 13 }}>None assigned</Text>}
              {teacher.subjectExpertise?.map(s => (
                <View key={s} style={dStyles.subjectTag}><Text style={dStyles.subjectTagText}>{s}</Text></View>
              ))}
            </View>
          </View>
          <View style={dStyles.section}>
            <Text style={dStyles.sectionTitle}>Assigned Classes ({teacher.assignedClasses?.length ?? 0})</Text>
            {teacher.assignedClasses?.length === 0 && <Text style={{ color: COLORS.gray, fontSize: 13, marginTop: 8 }}>No classes assigned</Text>}
            {teacher.assignedClasses?.map((cls, i) => (
              <View key={i} style={dStyles.classRow}>
                <Ionicons name="book-outline" size={14} color={COLORS.primary} />
                <View><Text style={dStyles.className}>{cls.name}</Text><Text style={dStyles.classSubject}>{cls.subject}</Text></View>
              </View>
            ))}
          </View>
          <TouchableOpacity style={dStyles.deleteBtn} onPress={() =>
            Alert.alert('Delete Teacher', `Delete ${teacher.userId?.name}?`, [
              { text: 'Cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
            ])}>
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={dStyles.deleteBtnText}>Delete Teacher</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const dStyles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingTop: 56, backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  name: { fontSize: 17, fontWeight: '800', color: COLORS.dark },
  email: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  section: { backgroundColor: COLORS.white, borderRadius: 16, margin: 16, marginBottom: 0, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: COLORS.dark, marginBottom: 8, textTransform: 'uppercase' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  rowLabel: { fontSize: 13, color: COLORS.gray, fontWeight: '600' },
  rowValue: { fontSize: 13, color: COLORS.dark, fontWeight: '600' },
  subjectTag: { backgroundColor: '#EEF2FF', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  subjectTagText: { fontSize: 12, color: '#6366F1', fontWeight: '600' },
  classRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  className: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  classSubject: { fontSize: 11, color: COLORS.gray },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, padding: 14, backgroundColor: '#FEF2F2', borderRadius: 14 },
  deleteBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
});

const AdminTeachers = () => {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-teachers-mobile'],
    queryFn: () => api.get('/teachers').then(r => r.data),
  });

  const teachers = data?.teachers || [];
  const filtered = teachers.filter(t =>
    t.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.userId?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {selected && <TeacherDetailModal teacher={selected} onClose={() => setSelected(null)} />}
      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} />}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Teachers</Text>
          <Text style={styles.headerSub}>{teachers.length} total teachers</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(true)}>
          <Ionicons name="add" size={22} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scroll} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={COLORS.gray} />
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="Search teachers..." placeholderTextColor={COLORS.gray} autoCapitalize="none" />
        </View>
        {isLoading ? <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} /> :
          filtered.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="person-outline" size={48} color={COLORS.gray} />
              <Text style={styles.emptyText}>No teachers found</Text>
            </View>
          ) : filtered.map((t, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => setSelected(t)}>
              <View style={styles.avatar}><Text style={styles.avatarText}>{t.userId?.name?.charAt(0)}</Text></View>
              <View style={styles.cardInfo}>
                <Text style={styles.teacherName}>{t.userId?.name}</Text>
                <Text style={styles.teacherEmail}>{t.userId?.email}</Text>
                <View style={styles.subjectRow}>
                  {t.subjectExpertise?.slice(0, 2).map(s => (
                    <View key={s} style={styles.subjectTag}><Text style={styles.subjectTagText}>{s}</Text></View>
                  ))}
                  {t.subjectExpertise?.length > 2 && (
                    <View style={styles.subjectTag}><Text style={styles.subjectTagText}>+{t.subjectExpertise.length - 2}</Text></View>
                  )}
                </View>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.classCount}>{t.assignedClasses?.length ?? 0}</Text>
                <Text style={styles.classLabel}>classes</Text>
                <Ionicons name="chevron-forward" size={16} color={COLORS.gray} style={{ marginTop: 4 }} />
              </View>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12, elevation: 2 },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.dark },
  emptyCard: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 14, marginHorizontal: 16, marginBottom: 8, padding: 14, elevation: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  cardInfo: { flex: 1 },
  teacherName: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  teacherEmail: { fontSize: 11, color: COLORS.gray, marginTop: 1 },
  subjectRow: { flexDirection: 'row', gap: 4, marginTop: 4, flexWrap: 'wrap' },
  subjectTag: { backgroundColor: '#EEF2FF', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  subjectTagText: { fontSize: 10, color: '#6366F1', fontWeight: '600' },
  cardRight: { alignItems: 'center' },
  classCount: { fontSize: 18, fontWeight: '800', color: COLORS.primary },
  classLabel: { fontSize: 10, color: COLORS.gray },
});

export default AdminTeachers;