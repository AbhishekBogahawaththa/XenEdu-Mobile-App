import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, Modal, TextInput,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

// ── Add Course Work Modal ─────────────────────────────────────────
const AddCourseWorkModal = ({ cls, onClose, onSuccess }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('notes');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const typeConfig = [
    { key: 'notes', label: 'Notes', icon: '📄', color: '#8B5CF6' },
    { key: 'assignment', label: 'Assignment', icon: '📝', color: '#F59E0B' },
    { key: 'recording', label: 'Recording', icon: '🎥', color: '#3B82F6' },
    { key: 'instruction', label: 'Instruction', icon: '📋', color: '#10B981' },
  ];

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) setFile(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('classId', cls._id);
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);
      if (file) {
        formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      }
      await api.post(`/coursework/${cls._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Success! ✅', 'Uploaded successfully!', [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <View>
            <Text style={modalStyles.title}>Upload Course Work</Text>
            <Text style={modalStyles.subtitle}>{cls.name}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modalStyles.scroll} contentContainerStyle={modalStyles.scrollContent}>
          <Text style={modalStyles.label}>Type</Text>
          <View style={modalStyles.typeRow}>
            {typeConfig.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)}
                style={[modalStyles.typeBtn, type === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }]}>
                <Text style={modalStyles.typeIcon}>{t.icon}</Text>
                <Text style={[modalStyles.typeLabel, type === t.key && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={modalStyles.label}>Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Chapter 5 Notes..."
            placeholderTextColor={COLORS.gray} style={modalStyles.input} />
          <Text style={modalStyles.label}>Description (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Add instructions..."
            placeholderTextColor={COLORS.gray} style={[modalStyles.input, modalStyles.inputMulti]}
            multiline numberOfLines={3} />
          <Text style={modalStyles.label}>File (optional)</Text>
          <TouchableOpacity onPress={pickFile} style={modalStyles.filePicker}>
            {file ? (
              <View style={modalStyles.fileSelected}>
                <Ionicons name="document-attach" size={24} color={COLORS.primary} />
                <View style={modalStyles.fileInfo}>
                  <Text style={modalStyles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={modalStyles.fileSize}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={modalStyles.fileEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={COLORS.gray} />
                <Text style={modalStyles.fileEmptyText}>Tap to select file</Text>
                <Text style={modalStyles.fileEmptySubText}>PDF, Image, Video, Audio</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.actionBtn, (!title.trim() || uploading) && modalStyles.actionBtnDisabled]}
            onPress={handleUpload} disabled={!title.trim() || uploading}>
            {uploading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="cloud-upload" size={20} color={COLORS.white} />
                <Text style={modalStyles.actionBtnText}>Upload Course Work</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

// ── Edit Course Work Modal ────────────────────────────────────────
const EditCourseWorkModal = ({ item, onClose, onSuccess }) => {
  const [title, setTitle] = useState(item.title || '');
  const [description, setDescription] = useState(item.description || '');
  const [type, setType] = useState(item.type || 'notes');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const typeConfig = [
    { key: 'notes', label: 'Notes', icon: '📄', color: '#8B5CF6' },
    { key: 'assignment', label: 'Assignment', icon: '📝', color: '#F59E0B' },
    { key: 'recording', label: 'Recording', icon: '🎥', color: '#3B82F6' },
    { key: 'instruction', label: 'Instruction', icon: '📋', color: '#10B981' },
  ];

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'video/*', 'audio/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) setFile(result.assets[0]);
    } catch (err) {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleUpdate = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Please enter a title'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('type', type);
      if (file) {
        formData.append('file', { uri: file.uri, name: file.name, type: file.mimeType || 'application/octet-stream' });
      }
      await api.patch(`/coursework/${item._id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      Alert.alert('Updated! ✅', 'Course work updated!', [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Update failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={modalStyles.container}>
        <View style={modalStyles.header}>
          <View>
            <Text style={modalStyles.title}>Edit Course Work</Text>
            <Text style={modalStyles.subtitle}>Update material details</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>
        <ScrollView style={modalStyles.scroll} contentContainerStyle={modalStyles.scrollContent}>
          <Text style={modalStyles.label}>Type</Text>
          <View style={modalStyles.typeRow}>
            {typeConfig.map(t => (
              <TouchableOpacity key={t.key} onPress={() => setType(t.key)}
                style={[modalStyles.typeBtn, type === t.key && { borderColor: t.color, backgroundColor: t.color + '15' }]}>
                <Text style={modalStyles.typeIcon}>{t.icon}</Text>
                <Text style={[modalStyles.typeLabel, type === t.key && { color: t.color, fontWeight: '700' }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={modalStyles.label}>Title *</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Chapter 5 Notes..."
            placeholderTextColor={COLORS.gray} style={modalStyles.input} />
          <Text style={modalStyles.label}>Description (optional)</Text>
          <TextInput value={description} onChangeText={setDescription} placeholder="Add instructions..."
            placeholderTextColor={COLORS.gray} style={[modalStyles.input, modalStyles.inputMulti]}
            multiline numberOfLines={3} />
          {item.fileUrl && !file && (
            <View style={modalStyles.currentFile}>
              <Ionicons name="document-attach" size={18} color={COLORS.primary} />
              <Text style={modalStyles.currentFileText}>Current file attached</Text>
              <Text style={modalStyles.currentFileNote}>Pick new file to replace</Text>
            </View>
          )}
          <Text style={modalStyles.label}>{item.fileUrl ? 'Replace File (optional)' : 'File (optional)'}</Text>
          <TouchableOpacity onPress={pickFile} style={modalStyles.filePicker}>
            {file ? (
              <View style={modalStyles.fileSelected}>
                <Ionicons name="document-attach" size={24} color={COLORS.primary} />
                <View style={modalStyles.fileInfo}>
                  <Text style={modalStyles.fileName} numberOfLines={1}>{file.name}</Text>
                  <Text style={modalStyles.fileSize}>{file.size ? `${(file.size / 1024).toFixed(1)} KB` : ''}</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={modalStyles.fileEmpty}>
                <Ionicons name="cloud-upload-outline" size={32} color={COLORS.gray} />
                <Text style={modalStyles.fileEmptyText}>Tap to select new file</Text>
                <Text style={modalStyles.fileEmptySubText}>PDF, Image, Video, Audio</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.actionBtn, { backgroundColor: '#10B981' }, (!title.trim() || uploading) && modalStyles.actionBtnDisabled]}
            onPress={handleUpdate} disabled={!title.trim() || uploading}>
            {uploading ? <ActivityIndicator color={COLORS.white} /> : (
              <>
                <Ionicons name="save" size={20} color={COLORS.white} />
                <Text style={modalStyles.actionBtnText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
};

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  title: { fontSize: 22, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16 },
  label: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 8, marginTop: 16, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, alignItems: 'center', padding: 10, borderRadius: 12, backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: '#E0E0E0' },
  typeIcon: { fontSize: 20, marginBottom: 4 },
  typeLabel: { fontSize: 11, color: COLORS.gray, fontWeight: '600' },
  input: { backgroundColor: COLORS.white, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.dark, borderWidth: 1.5, borderColor: '#E0E0E0' },
  inputMulti: { height: 80, textAlignVertical: 'top' },
  filePicker: { backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 1.5, borderColor: '#E0E0E0', borderStyle: 'dashed', overflow: 'hidden' },
  fileEmpty: { padding: 24, alignItems: 'center' },
  fileEmptyText: { fontSize: 14, fontWeight: '600', color: COLORS.gray, marginTop: 8 },
  fileEmptySubText: { fontSize: 12, color: COLORS.gray, marginTop: 4 },
  fileSelected: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  fileSize: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  currentFile: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F0FBF7', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#C8EDE2' },
  currentFileText: { fontSize: 13, color: COLORS.primary, fontWeight: '600', flex: 1 },
  currentFileNote: { fontSize: 11, color: COLORS.gray },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 24 },
  actionBtnDisabled: { backgroundColor: COLORS.gray },
  actionBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

// ── Course Work Item ──────────────────────────────────────────────
const CourseWorkItem = ({ item, onDelete, onEdit }) => {
  const typeConfig = {
    recording: { icon: '🎥', color: '#3B82F6', bg: '#EFF6FF' },
    instruction: { icon: '📋', color: '#10B981', bg: '#F0FBF7' },
    assignment: { icon: '📝', color: '#F59E0B', bg: '#FFFBEB' },
    notes: { icon: '📄', color: '#8B5CF6', bg: '#F5F3FF' },
  };
  const config = typeConfig[item.type] || typeConfig.notes;

  return (
    <View style={itemStyles.container}>
      <View style={[itemStyles.icon, { backgroundColor: config.bg }]}>
        <Text style={itemStyles.iconText}>{config.icon}</Text>
      </View>
      <View style={itemStyles.info}>
        <Text style={itemStyles.title}>{item.title}</Text>
        {item.description && <Text style={itemStyles.desc} numberOfLines={2}>{item.description}</Text>}
        <View style={itemStyles.meta}>
          <Text style={[itemStyles.type, { color: config.color }]}>{item.type}</Text>
          <Text style={itemStyles.date}>{new Date(item.createdAt).toLocaleDateString('en-GB')}</Text>
          {item.fileUrl && (
            <View style={itemStyles.fileBadge}>
              <Ionicons name="attach" size={10} color={COLORS.primary} />
              <Text style={itemStyles.fileBadgeText}>File attached</Text>
            </View>
          )}
        </View>
      </View>
      <View style={itemStyles.actions}>
        <TouchableOpacity onPress={() => onEdit(item)} style={itemStyles.editBtn}>
          <Ionicons name="create-outline" size={16} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => Alert.alert('Delete', 'Delete this course work?', [
            { text: 'Cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => onDelete(item._id) },
          ])}
          style={itemStyles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const itemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  iconText: { fontSize: 22 },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 3 },
  desc: { fontSize: 12, color: COLORS.gray, marginBottom: 4 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  type: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  date: { fontSize: 11, color: COLORS.gray },
  fileBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#F0FBF7', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  fileBadgeText: { fontSize: 10, color: COLORS.primary, fontWeight: '600' },
  actions: { gap: 6 },
  editBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#FEF2F2', alignItems: 'center', justifyContent: 'center' },
});

// ── Main Component ────────────────────────────────────────────────
const TeacherCourseWork = () => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editItem, setEditItem] = useState(null);

  const { data: myClasses } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const selectedClass = myClasses?.classes?.find(c => c._id === selectedClassId);

  const { data: courseWork, isLoading } = useQuery({
    queryKey: ['teacher-coursework', selectedClassId],
    queryFn: () => api.get(`/coursework/${selectedClassId}`).then(r => r.data),
    enabled: !!selectedClassId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/coursework/${id}`),
    onSuccess: () => queryClient.invalidateQueries(['teacher-coursework', selectedClassId]),
    onError: err => Alert.alert('Error', err.response?.data?.message || 'Delete failed'),
  });

  const items = courseWork?.items || [];

  return (
    <View style={styles.container}>
      {showAddModal && selectedClass && (
        <AddCourseWorkModal
          cls={selectedClass}
          onClose={() => setShowAddModal(false)}
          onSuccess={() => queryClient.invalidateQueries(['teacher-coursework', selectedClassId])}
        />
      )}

      {editItem && (
        <EditCourseWorkModal
          item={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={() => queryClient.invalidateQueries(['teacher-coursework', selectedClassId])}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Work</Text>
        <Text style={styles.headerSub}>Upload materials for students</Text>
      </View>

      <ScrollView style={styles.scroll}>

        {/* Class selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Class</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {myClasses?.classes?.map((cls, i) => (
              <TouchableOpacity key={i} onPress={() => setSelectedClassId(cls._id)}
                style={[styles.classChip, selectedClassId === cls._id && styles.classChipActive]}>
                <Text style={[styles.classChipText, selectedClassId === cls._id && styles.classChipTextActive]}>{cls.name}</Text>
                <Text style={[styles.classChipSub, selectedClassId === cls._id && { color: 'rgba(255,255,255,0.7)' }]}>{cls.subject}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Course work list */}
        {selectedClassId && (
          <View style={styles.card}>
            <View style={styles.cwHeader}>
              <View>
                <Text style={styles.cardTitle}>Materials ({items.length})</Text>
                <Text style={styles.cwSubtitle}>{selectedClass?.name}</Text>
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddModal(true)}>
                <Ionicons name="add" size={20} color={COLORS.white} />
                <Text style={styles.addBtnText}>Upload</Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
            ) : items.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📚</Text>
                <Text style={styles.emptyText}>No materials uploaded yet</Text>
                <Text style={styles.emptySubText}>Tap Upload to add notes, assignments, or recordings</Text>
                <TouchableOpacity style={styles.emptyUploadBtn} onPress={() => setShowAddModal(true)}>
                  <Ionicons name="cloud-upload-outline" size={18} color={COLORS.white} />
                  <Text style={styles.emptyUploadBtnText}>Upload First Material</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View style={styles.statsRow}>
                  {[
                    { label: 'Notes', count: items.filter(i => i.type === 'notes').length, color: '#8B5CF6', icon: '📄' },
                    { label: 'Assignments', count: items.filter(i => i.type === 'assignment').length, color: '#F59E0B', icon: '📝' },
                    { label: 'Recordings', count: items.filter(i => i.type === 'recording').length, color: '#3B82F6', icon: '🎥' },
                    { label: 'Instructions', count: items.filter(i => i.type === 'instruction').length, color: '#10B981', icon: '📋' },
                  ].map((s, i) => (
                    <View key={i} style={styles.statChip}>
                      <Text style={styles.statChipIcon}>{s.icon}</Text>
                      <Text style={[styles.statChipCount, { color: s.color }]}>{s.count}</Text>
                      <Text style={styles.statChipLabel}>{s.label}</Text>
                    </View>
                  ))}
                </View>

                {items
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map((item, i) => (
                    <CourseWorkItem
                      key={i}
                      item={item}
                      onEdit={(item) => setEditItem(item)}
                      onDelete={(id) => deleteMutation.mutate(id)}
                    />
                  ))}
              </View>
            )}
          </View>
        )}

        {!selectedClassId && (
          <View style={styles.selectPrompt}>
            <Text style={styles.selectPromptIcon}>☝️</Text>
            <Text style={styles.selectPromptText}>Select a class to manage course work</Text>
          </View>
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
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  classChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: '#F5F5F5', marginRight: 8, minWidth: 120, borderWidth: 1.5, borderColor: '#E0E0E0' },
  classChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classChipText: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  classChipTextActive: { color: COLORS.white },
  classChipSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  cwHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cwSubtitle: { fontSize: 12, color: COLORS.gray, marginTop: -8 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '700', color: COLORS.dark, marginBottom: 4 },
  emptySubText: { fontSize: 13, color: COLORS.gray, textAlign: 'center', marginBottom: 20, paddingHorizontal: 16 },
  emptyUploadBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyUploadBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  statChip: { flex: 1, alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 10, padding: 8 },
  statChipIcon: { fontSize: 16, marginBottom: 2 },
  statChipCount: { fontSize: 16, fontWeight: '800' },
  statChipLabel: { fontSize: 9, color: COLORS.gray, fontWeight: '600', textAlign: 'center' },
  selectPrompt: { alignItems: 'center', paddingTop: 60 },
  selectPromptIcon: { fontSize: 40, marginBottom: 12 },
  selectPromptText: { fontSize: 15, color: COLORS.gray, fontWeight: '600' },
});

export default TeacherCourseWork;