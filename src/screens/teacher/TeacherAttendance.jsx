import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
  ActivityIndicator, Modal,
} from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

// ── QR Scanner Modal ──────────────────────────────────────────────
const QRScannerModal = ({ onScan, onClose }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide">
        <View style={qrStyles.container}>
          <Text style={qrStyles.permText}>Camera permission needed</Text>
          <TouchableOpacity style={qrStyles.permBtn} onPress={requestPermission}>
            <Text style={qrStyles.permBtnText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity style={qrStyles.closeBtn} onPress={onClose}>
            <Text style={qrStyles.closeBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide">
      <View style={qrStyles.container}>
        <View style={qrStyles.header}>
          <Text style={qrStyles.title}>Scan Student ID</Text>
          <TouchableOpacity onPress={onClose} style={qrStyles.headerClose}>
            <Ionicons name="close" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </View>

        <CameraView
          style={qrStyles.camera}
          facing="back"
          onBarcodeScanned={scanned ? undefined : ({ data }) => {
            setScanned(true);
            onScan(data);
          }}
          barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
        />

        <View style={qrStyles.overlay}>
          <View style={qrStyles.scanBox}>
            <View style={[qrStyles.corner, qrStyles.cornerTL]} />
            <View style={[qrStyles.corner, qrStyles.cornerTR]} />
            <View style={[qrStyles.corner, qrStyles.cornerBL]} />
            <View style={[qrStyles.corner, qrStyles.cornerBR]} />
          </View>
          <Text style={qrStyles.hint}>Point camera at student QR code or barcode</Text>
        </View>

        {scanned && (
          <TouchableOpacity style={qrStyles.rescanBtn} onPress={() => setScanned(false)}>
            <Text style={qrStyles.rescanBtnText}>Tap to scan again</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
};

const qrStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: 'rgba(0,0,0,0.8)',
  },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerClose: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  camera: { flex: 1 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanBox: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: COLORS.gold, borderWidth: 3 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  hint: { color: COLORS.white, fontSize: 14, marginTop: 24, textAlign: 'center', opacity: 0.8 },
  rescanBtn: {
    position: 'absolute', bottom: 40, left: 40, right: 40,
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: 'center',
  },
  rescanBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  permText: { color: COLORS.white, fontSize: 16, textAlign: 'center', margin: 40, marginTop: 120 },
  permBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12, padding: 14,
    alignItems: 'center', marginHorizontal: 40, marginBottom: 12,
  },
  permBtnText: { color: COLORS.white, fontWeight: '700' },
  closeBtn: {
    backgroundColor: '#333', borderRadius: 12, padding: 14,
    alignItems: 'center', marginHorizontal: 40,
  },
  closeBtnText: { color: COLORS.white, fontWeight: '700' },
});

// ── Format session date ───────────────────────────────────────────
const formatSessionDate = (session) => {
  // Field is sessionDate not date!
  const dateStr = session.sessionDate || session.date;
  if (!dateStr) return 'No date';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 'Invalid date';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

// ── Teacher Attendance ────────────────────────────────────────────
const TeacherAttendance = () => {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [scanInput, setScanInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [attendance, setAttendance] = useState({});
  const [saving, setSaving] = useState(false);

  const { data: myClasses } = useQuery({
    queryKey: ['teacher-classes'],
    queryFn: () => api.get('/classes').then(r => r.data),
  });

  const { data: sessions } = useQuery({
    queryKey: ['teacher-sessions', selectedClassId],
    queryFn: () => {
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      return api.get(`/sessions/class/${selectedClassId}?month=${month}`).then(r => r.data);
    },
    enabled: !!selectedClassId,
  });

  const { data: classDetail } = useQuery({
    queryKey: ['teacher-class-detail', selectedClassId],
    queryFn: () => api.get(`/classes/${selectedClassId}`).then(r => r.data),
    enabled: !!selectedClassId,
  });

  // Load existing attendance when session selected
  const { data: existingAttendance } = useQuery({
    queryKey: ['session-attendance', selectedSessionId],
    queryFn: () => api.get(`/attendance/session/${selectedSessionId}`).then(r => r.data),
    enabled: !!selectedSessionId,
    onSuccess: (data) => {
      const map = {};
      data.attendance?.forEach(a => {
        map[String(a.studentId?._id || a.studentId)] = a.status;
      });
      if (Object.keys(map).length > 0) {
        setAttendance(map);
      }
    },
  });

  const handleScan = async (admissionNumber) => {
    setShowScanner(false);
    setScanInput(admissionNumber);
    try {
      const res = await api.get(`/scan/${admissionNumber.trim()}`);
      const studentId = String(res.data.student?.id || res.data.student?._id);
      if (studentId) {
        setAttendance(prev => ({ ...prev, [studentId]: 'present' }));
        Alert.alert('✅ Marked Present', `${res.data.student.name} marked as present!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Student not found');
    }
    setScanInput('');
  };

  const handleManualScan = async () => {
    if (!scanInput.trim()) return;
    await handleScan(scanInput.trim());
  };

  const saveAttendance = async () => {
  if (!selectedSessionId) {
    Alert.alert('Error', 'Please select a session first');
    return;
  }

  const students = classDetail?.class?.enrolledStudents || [];
  if (students.length === 0) {
    Alert.alert('Error', 'No students found in this class');
    return;
  }

  // ← Changed: "attendance" → "records"
  const records = students.map(student => {
    const studentId = String(student._id);
    return {
      studentId,
      status: attendance[studentId] || 'absent',
    };
  });

  setSaving(true);
  try {
    await api.post(`/attendance/session/${selectedSessionId}`, {
      records, // ← "records" not "attendance"!
    });
    Alert.alert('Success! ✅', `Attendance saved for ${records.length} students!`);
    queryClient.invalidateQueries(['session-attendance', selectedSessionId]);
  } catch (err) {
    console.log('Save error:', JSON.stringify(err.response?.data));
    Alert.alert('Error', err.response?.data?.message || 'Failed to save attendance');
  } finally {
    setSaving(false);
  }
};

  const students = classDetail?.class?.enrolledStudents || [];
  const allSessions = sessions?.sessions?.slice(0, 15) || [];

  const presentCount = Object.values(attendance).filter(s => s === 'present').length;
  const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
  const lateCount = Object.values(attendance).filter(s => s === 'late').length;

  return (
    <View style={styles.container}>
      {showScanner && (
        <QRScannerModal
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mark Attendance</Text>
        <Text style={styles.headerSub}>Select class and session</Text>
      </View>

      <ScrollView style={styles.scroll}>

        {/* Class selector */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Select Class</Text>
          {myClasses?.classes?.length === 0 ? (
            <Text style={styles.noData}>No classes assigned</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.classScroll}>
              {myClasses?.classes?.map((cls, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSelectedClassId(cls._id);
                    setSelectedSessionId('');
                    setAttendance({});
                  }}
                  style={[styles.classChip, selectedClassId === cls._id && styles.classChipActive]}
                >
                  <Text style={[styles.classChipText, selectedClassId === cls._id && styles.classChipTextActive]}>
                    {cls.name}
                  </Text>
                  <Text style={[styles.classChipSub, selectedClassId === cls._id && { color: 'rgba(255,255,255,0.7)' }]}>
                    {cls.schedule?.dayOfWeek}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Session selector */}
        {selectedClassId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Select Session</Text>
            {allSessions.length === 0 ? (
              <Text style={styles.noData}>No sessions found this month</Text>
            ) : (
              allSessions.map((session, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setSelectedSessionId(session._id);
                    setAttendance({});
                  }}
                  style={[styles.sessionBtn, selectedSessionId === session._id && styles.sessionBtnActive]}
                >
                  <View style={{ flex: 1 }}>
                    {/* ← Fixed: use sessionDate field */}
                    <Text style={[styles.sessionDate, selectedSessionId === session._id && { color: COLORS.white }]}>
                      {formatSessionDate(session)}
                    </Text>
                    <Text style={[styles.sessionTime, selectedSessionId === session._id && { color: 'rgba(255,255,255,0.7)' }]}>
                      {session.startTime} • {session.durationMins} mins • {session.hall}
                    </Text>
                  </View>
                  <View style={[styles.sessionStatus, {
                    backgroundColor:
                      session.status === 'completed' ? '#10B981' :
                      session.status === 'cancelled' ? '#EF4444' : '#F59E0B'
                  }]}>
                    <Text style={styles.sessionStatusText}>{session.status}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* Scanner + Stats */}
        {selectedSessionId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mark Attendance</Text>

            {/* Stats */}
            <View style={styles.statsRow}>
              {[
                { label: 'Present', value: presentCount, color: '#10B981' },
                { label: 'Absent', value: absentCount, color: '#EF4444' },
                { label: 'Late', value: lateCount, color: '#F59E0B' },
                { label: 'Total', value: students.length, color: COLORS.primary },
              ].map((s, i) => (
                <View key={i} style={[styles.statChip, { backgroundColor: s.color + '15' }]}>
                  <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                  <Text style={[styles.statLabel, { color: s.color }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Input + Camera */}
            <View style={styles.scanRow}>
              <TextInput
                value={scanInput}
                onChangeText={setScanInput}
                onSubmitEditing={handleManualScan}
                placeholder="Type admission number (e.g. XE0001)..."
                placeholderTextColor={COLORS.gray}
                style={styles.scanInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={handleManualScan} style={styles.searchBtn}>
                <Ionicons name="search" size={20} color={COLORS.white} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowScanner(true)} style={styles.cameraBtn}>
                <Ionicons name="camera" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Student list */}
        {selectedSessionId && students.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Students ({students.length})</Text>
            {students.map((student, i) => {
              const studentId = String(student._id);
              const status = attendance[studentId] || 'unmarked';
              return (
                <View key={i} style={[styles.studentRow, i === students.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.studentAvatar, {
                    backgroundColor: status === 'present' ? '#10B981' :
                      status === 'absent' ? '#EF4444' :
                      status === 'late' ? '#F59E0B' : COLORS.primary
                  }]}>
                    <Text style={styles.studentAvatarText}>{student.userId?.name?.charAt(0)}</Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{student.userId?.name}</Text>
                    <Text style={styles.studentNum}>{student.admissionNumber}</Text>
                    {status !== 'unmarked' && (
                      <Text style={[styles.studentStatus, {
                        color: status === 'present' ? '#10B981' :
                          status === 'absent' ? '#EF4444' : '#F59E0B'
                      }]}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.attBtns}>
                    {[
                      { key: 'present', icon: 'checkmark', color: '#10B981' },
                      { key: 'late', icon: 'time', color: '#F59E0B' },
                      { key: 'absent', icon: 'close', color: '#EF4444' },
                    ].map(btn => (
                      <TouchableOpacity
                        key={btn.key}
                        onPress={() => setAttendance(prev => ({ ...prev, [studentId]: btn.key }))}
                        style={[
                          styles.attBtn,
                          status === btn.key && { backgroundColor: btn.color, borderColor: btn.color },
                        ]}
                      >
                        <Ionicons
                          name={btn.icon}
                          size={16}
                          color={status === btn.key ? COLORS.white : btn.color}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })}

            {/* Save button */}
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={saveAttendance}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.saveBtnText}>
                    Save Attendance ({students.length} students)
                  </Text>
                </>
              )}
            </TouchableOpacity>
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
  scroll: {
    flex: 1, backgroundColor: '#F5F5F5',
    borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 16,
  },
  card: {
    backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16,
    marginBottom: 12, padding: 16, elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: COLORS.dark,
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  classScroll: { marginHorizontal: -4 },
  classChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    backgroundColor: '#F5F5F5', marginHorizontal: 4, minWidth: 130,
    borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  classChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  classChipText: { fontSize: 13, fontWeight: '700', color: COLORS.dark },
  classChipTextActive: { color: COLORS.white },
  classChipSub: { fontSize: 11, color: COLORS.gray, marginTop: 2 },
  noData: { color: COLORS.gray, fontSize: 14, textAlign: 'center', padding: 12 },
  sessionBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 12, borderRadius: 12, marginBottom: 8,
    backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0',
  },
  sessionBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  sessionDate: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  sessionTime: { fontSize: 12, color: COLORS.gray, marginTop: 2 },
  sessionStatus: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  sessionStatusText: { fontSize: 11, color: COLORS.white, fontWeight: '700', textTransform: 'capitalize' },
  statsRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  statChip: { flex: 1, alignItems: 'center', padding: 8, borderRadius: 10 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 10, fontWeight: '600' },
  scanRow: { flexDirection: 'row', gap: 8 },
  scanInput: {
    flex: 1, backgroundColor: '#F5F5F5', borderRadius: 10, padding: 12,
    fontSize: 14, color: COLORS.dark, borderWidth: 1, borderColor: '#E0E0E0',
  },
  searchBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
  },
  cameraBtn: {
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: '#00b8c8', alignItems: 'center', justifyContent: 'center',
  },
  studentRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  studentAvatar: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
  },
  studentAvatarText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 14, fontWeight: '600', color: COLORS.dark },
  studentNum: { fontSize: 11, color: COLORS.gray },
  studentStatus: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  attBtns: { flexDirection: 'row', gap: 6 },
  attBtn: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E0E0E0',
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: COLORS.primary, borderRadius: 12,
    padding: 14, marginTop: 16,
  },
  saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

export default TeacherAttendance;