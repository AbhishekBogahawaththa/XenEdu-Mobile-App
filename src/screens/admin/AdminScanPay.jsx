import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  Alert, Modal,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

// ── Pay Fee Modal ─────────────────────────────────────────────────
const PayFeeModal = ({ fee, studentName, onClose, onSuccess }) => {
  const [method, setMethod] = useState('cash');
  const [loading, setLoading] = useState(false);

  const handlePay = async () => {
    setLoading(true);
    try {
      const res = await api.post('/fees/pay', {
        feeRecordId: fee.feeRecordId,
        method,
      });
      Alert.alert(
        'Payment Recorded!',
        `Receipt: ${res.data.receipt?.receiptNumber}\nStudent: ${studentName}\nClass: ${fee.class}\nAmount: Rs. ${fee.amount?.toLocaleString()}\nMonth: ${fee.month}`,
        [{ text: 'OK', onPress: () => { onSuccess(); onClose(); } }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <View style={payStyles.container}>
        <View style={payStyles.header}>
          <View>
            <Text style={payStyles.title}>Record Payment</Text>
            <Text style={payStyles.subtitle}>{studentName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={payStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView style={payStyles.scroll} contentContainerStyle={{ padding: 16 }}>
          {/* Fee details */}
          <View style={payStyles.feeCard}>
            <View style={payStyles.feeRow}>
              <Text style={payStyles.feeLabel}>Class</Text>
              <Text style={payStyles.feeValue}>{fee.class}</Text>
            </View>
            <View style={payStyles.feeRow}>
              <Text style={payStyles.feeLabel}>Month</Text>
              <Text style={payStyles.feeValue}>{fee.month}</Text>
            </View>
            <View style={payStyles.feeRow}>
              <Text style={payStyles.feeLabel}>Amount</Text>
              <Text style={[payStyles.feeValue, { color: COLORS.primary, fontWeight: '800', fontSize: 20 }]}>
                Rs. {fee.amount?.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Payment method */}
          <Text style={payStyles.sectionTitle}>Payment Method</Text>
          <View style={payStyles.methodRow}>
            {[
              { key: 'cash', label: 'Cash', icon: 'cash-outline' },
              { key: 'card', label: 'Card', icon: 'card-outline' },
              { key: 'bank_transfer', label: 'Bank', icon: 'business-outline' },
            ].map(m => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMethod(m.key)}
                style={[payStyles.methodBtn, method === m.key && payStyles.methodBtnActive]}
              >
                <Ionicons name={m.icon} size={24} color={method === m.key ? COLORS.primary : COLORS.gray} style={{ marginBottom: 4 }} />
                <Text style={[payStyles.methodLabel, method === m.key && { color: COLORS.primary }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Confirm button */}
          <TouchableOpacity
            style={[payStyles.confirmBtn, loading && payStyles.confirmBtnDisabled]}
            onPress={handlePay}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={payStyles.confirmBtnText}>
                  Confirm Payment — Rs. {fee.amount?.toLocaleString()}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  title: { fontSize: 20, fontWeight: '800', color: COLORS.dark },
  subtitle: { fontSize: 13, color: COLORS.gray, marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  feeCard: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16, marginBottom: 20, elevation: 2 },
  feeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  feeLabel: { fontSize: 14, color: COLORS.gray, fontWeight: '600' },
  feeValue: { fontSize: 14, color: COLORS.dark, fontWeight: '700' },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: COLORS.dark, marginBottom: 10, textTransform: 'uppercase' },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  methodBtn: { flex: 1, alignItems: 'center', padding: 14, backgroundColor: COLORS.white, borderRadius: 12, borderWidth: 2, borderColor: '#F0F0F0' },
  methodBtnActive: { borderColor: COLORS.primary, backgroundColor: '#F0FBF7' },
  methodLabel: { fontSize: 12, fontWeight: '600', color: COLORS.gray },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16,
  },
  confirmBtnDisabled: { backgroundColor: COLORS.gray },
  confirmBtnText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
});

// ── Main Screen ───────────────────────────────────────────────────
const AdminScanPay = () => {
  const queryClient = useQueryClient();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [selectedFee, setSelectedFee] = useState(null);
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScan = async ({ data }) => {
    if (scanned || loading) return;
    setScanned(true);
    setScanning(false);
    setLoading(true);

    try {
      const res = await api.get(`/scan/${data}`);
      setStudentData(res.data);
    } catch (err) {
      Alert.alert(
        'Not Found',
        err.response?.data?.message || 'Student not found',
        [{ text: 'Scan Again', onPress: () => { setScanned(false); setScanning(true); } }]
      );
    } finally {
      setLoading(false);
    }
  };

  const resetScan = () => {
    setStudentData(null);
    setScanned(false);
    setScanning(true);
  };

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Scan & Pay</Text>
          <Text style={styles.headerSub}>Camera permission required</Text>
        </View>
        <View style={styles.permissionBox}>
          <Ionicons name="camera-outline" size={64} color={COLORS.gray} />
          <Text style={styles.permissionText}>Camera access is needed to scan student QR codes</Text>
          <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Enable Camera</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pay Fee Modal */}
      {selectedFee && studentData && (
        <PayFeeModal
          fee={selectedFee}
          studentName={studentData.student?.name}
          onClose={() => setSelectedFee(null)}
          onSuccess={() => {
            api.get(`/scan/${studentData.student?.admissionNumber}`).then(res => {
              setStudentData(res.data);
            });
            queryClient.invalidateQueries(['admin-outstanding']);
          }}
        />
      )}

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Pay</Text>
        <Text style={styles.headerSub}>Scan student QR to record payment</Text>
      </View>

      <ScrollView style={styles.scroll}>

        {/* Scanner */}
        {!studentData && (
          <View style={styles.scanSection}>
            {scanning ? (
              <View style={styles.cameraBox}>
                <CameraView
                  style={styles.camera}
                  barcodeScannerSettings={{ barcodeTypes: ['qr', 'code128', 'code39'] }}
                  onBarcodeScanned={handleBarcodeScan}
                />
                <View style={styles.scanOverlay}>
                  <View style={styles.scanFrame}>
                    <View style={[styles.corner, styles.cornerTL]} />
                    <View style={[styles.corner, styles.cornerTR]} />
                    <View style={[styles.corner, styles.cornerBL]} />
                    <View style={[styles.corner, styles.cornerBR]} />
                  </View>
                  <Text style={styles.scanHint}>Point camera at student ID barcode</Text>
                </View>
                <TouchableOpacity style={styles.cancelScanBtn} onPress={() => setScanning(false)}>
                  <Text style={styles.cancelScanText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.startScanBox}>
                {loading ? (
                  <>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={styles.loadingText}>Looking up student...</Text>
                  </>
                ) : (
                  <>
                    <View style={styles.scanIconBox}>
                      <Ionicons name="qr-code-outline" size={64} color={COLORS.primary} />
                    </View>
                    <Text style={styles.scanTitle}>Scan Student QR Code</Text>
                    <Text style={styles.scanDesc}>
                      Scan the student's QR code or barcode from their Student ID card to view their fee details and record payment.
                    </Text>
                    <TouchableOpacity style={styles.scanBtn} onPress={() => setScanning(true)}>
                      <Ionicons name="camera-outline" size={20} color={COLORS.white} />
                      <Text style={styles.scanBtnText}>Start Scanning</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {/* Student Data */}
        {studentData && (
          <View style={styles.studentSection}>
            {/* Student card */}
            <View style={styles.studentCard}>
              <View style={styles.studentCardTop}>
                <View style={[styles.studentAvatar, {
                  backgroundColor: studentData.student?.status === 'active' ? COLORS.primary : '#EF4444'
                }]}>
                  <Text style={styles.studentAvatarText}>
                    {studentData.student?.name?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{studentData.student?.name}</Text>
                  <Text style={styles.studentDetail}>
                    {studentData.student?.admissionNumber} • {studentData.student?.grade}
                  </Text>
                  <Text style={styles.studentDetail}>{studentData.student?.school}</Text>
                  <View style={[styles.statusBadge, {
                    backgroundColor: studentData.student?.status === 'active' ? '#F0FBF7' : '#FEF2F2'
                  }]}>
                    <Text style={[styles.statusText, {
                      color: studentData.student?.status === 'active' ? '#10B981' : '#EF4444'
                    }]}>
                      {studentData.student?.status?.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={resetScan} style={styles.rescanBtn}>
                  <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.rescanText}>Rescan</Text>
                </TouchableOpacity>
              </View>

              {studentData.outstandingFees?.total > 0 && (
                <View style={styles.outstandingBanner}>
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text style={styles.outstandingText}>
                    Total Outstanding: Rs. {studentData.outstandingFees?.total?.toLocaleString()}
                  </Text>
                </View>
              )}
            </View>

            {/* Outstanding fees */}
            {studentData.outstandingFees?.records?.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Outstanding Fees</Text>
                {studentData.outstandingFees.records.map((fee, i) => (
                  <View key={i} style={styles.feeCard}>
                    <View style={styles.feeCardLeft}>
                      <Text style={styles.feeClass}>{fee.class}</Text>
                      <Text style={styles.feeSubject}>{fee.subject}</Text>
                      <View style={styles.feeMetaRow}>
                        <Ionicons name="calendar-outline" size={12} color={COLORS.primary} />
                        <Text style={styles.feeMonth}>{fee.month}</Text>
                      </View>
                      {fee.dueDate && (
                        <Text style={styles.feeDue}>
                          Due: {new Date(fee.dueDate).toLocaleDateString('en-GB')}
                        </Text>
                      )}
                    </View>
                    <View style={styles.feeCardRight}>
                      <Text style={styles.feeAmount}>Rs. {fee.amount?.toLocaleString()}</Text>
                      <TouchableOpacity
                        style={styles.payNowBtn}
                        onPress={() => setSelectedFee(fee)}
                      >
                        <Ionicons name="card-outline" size={14} color={COLORS.white} />
                        <Text style={styles.payNowText}>Pay Now</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Enrolled classes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enrolled Classes</Text>
              {studentData.enrolledClasses?.map((cls, i) => (
                <View key={i} style={styles.classCard}>
                  <View style={styles.classCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.className}>{cls.name}</Text>
                      <Text style={styles.classSubject}>{cls.subject} • {cls.grade}</Text>
                      <View style={styles.classMetaRow}>
                        <Ionicons name="person-outline" size={11} color={COLORS.gray} />
                        <Text style={styles.classTeacher}>{cls.teacher}</Text>
                      </View>
                      <View style={styles.classMetaRow}>
                        <Ionicons name="calendar-outline" size={11} color={COLORS.gray} />
                        <Text style={styles.classSchedule}>
                          {cls.schedule?.dayOfWeek} at {cls.schedule?.startTime} • {cls.hall}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.classCardRight}>
                      <Text style={styles.classFee}>Rs. {cls.monthlyFee?.toLocaleString()}</Text>
                      <Text style={styles.classFeeSub}>/month</Text>
                    </View>
                  </View>

                  <View style={styles.classCardFooter}>
                    <View style={[styles.feeStatusBadge, {
                      backgroundColor:
                        cls.feePaidThisMonth ? '#F0FBF7' :
                        cls.feeStatus === 'not_generated' ? '#F5F5F5' : '#FEF2F2'
                    }]}>
                      <Text style={[styles.feeStatusText, {
                        color:
                          cls.feePaidThisMonth ? '#10B981' :
                          cls.feeStatus === 'not_generated' ? COLORS.gray : '#EF4444'
                      }]}>
                        {cls.feePaidThisMonth ? 'Paid This Month' :
                         cls.feeStatus === 'not_generated' ? 'Fee Not Generated' : 'Unpaid'}
                      </Text>
                    </View>

                    <View style={[styles.attBadge, {
                      backgroundColor: cls.attendanceRisk ? '#FEF2F2' : '#F0FBF7'
                    }]}>
                      <Ionicons name="stats-chart-outline" size={11} color={cls.attendanceRisk ? '#EF4444' : '#10B981'} />
                      <Text style={[styles.attText, {
                        color: cls.attendanceRisk ? '#EF4444' : '#10B981'
                      }]}>
                        {cls.attendancePercentage}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}

              {studentData.enrolledClasses?.length === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyText}>No classes enrolled</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.scanAgainBtn} onPress={resetScan}>
              <Ionicons name="qr-code-outline" size={18} color={COLORS.white} />
              <Text style={styles.scanAgainText}>Scan Another Student</Text>
            </TouchableOpacity>

            <View style={{ height: 24 }} />
          </View>
        )}
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

  permissionBox: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  permissionText: { fontSize: 15, color: COLORS.gray, textAlign: 'center', marginTop: 16, marginBottom: 24, lineHeight: 22 },
  permissionBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permissionBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  scanSection: { marginHorizontal: 16, marginBottom: 16 },
  cameraBox: { borderRadius: 20, overflow: 'hidden', height: 400, position: 'relative' },
  camera: { flex: 1 },
  scanOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: { position: 'absolute', width: 32, height: 32, borderColor: '#00FF9D', borderWidth: 4 },
  cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  scanHint: { color: COLORS.white, fontSize: 14, marginTop: 20, fontWeight: '600', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  cancelScanBtn: { position: 'absolute', bottom: 16, alignSelf: 'center', backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 },
  cancelScanText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },

  startScanBox: { backgroundColor: COLORS.white, borderRadius: 20, padding: 32, alignItems: 'center', elevation: 2 },
  scanIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F0FBF7', alignItems: 'center', justifyContent: 'center', marginBottom: 20, borderWidth: 2, borderColor: COLORS.primary },
  scanTitle: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },
  scanDesc: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  scanBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14 },
  scanBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  loadingText: { fontSize: 14, color: COLORS.gray, marginTop: 16, fontWeight: '600' },

  studentSection: { gap: 0 },
  studentCard: { backgroundColor: COLORS.white, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, padding: 16, elevation: 2 },
  studentCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  studentAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  studentAvatarText: { fontSize: 22, fontWeight: '800', color: COLORS.gold },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 18, fontWeight: '800', color: COLORS.dark },
  studentDetail: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, marginTop: 6 },
  statusText: { fontSize: 10, fontWeight: '800' },
  rescanBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F0FBF7', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  rescanText: { fontSize: 12, color: COLORS.primary, fontWeight: '700' },
  outstandingBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FFF9E6', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FDE68A' },
  outstandingText: { fontSize: 13, color: '#92400E', fontWeight: '700' },

  section: { marginHorizontal: 16, marginBottom: 12 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.dark, marginBottom: 10 },

  feeCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1.5, borderColor: '#FEE2E2', elevation: 1 },
  feeCardLeft: { flex: 1 },
  feeClass: { fontSize: 15, fontWeight: '700', color: COLORS.dark },
  feeSubject: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  feeMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  feeMonth: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },
  feeDue: { fontSize: 11, color: '#EF4444', marginTop: 2 },
  feeCardRight: { alignItems: 'flex-end', gap: 8 },
  feeAmount: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  payNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  payNowText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },

  classCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 14, marginBottom: 8, elevation: 1 },
  classCardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  className: { fontSize: 14, fontWeight: '700', color: COLORS.dark },
  classSubject: { fontSize: 12, color: COLORS.gray, marginTop: 1 },
  classMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  classTeacher: { fontSize: 11, color: COLORS.gray },
  classSchedule: { fontSize: 11, color: COLORS.gray },
  classCardRight: { alignItems: 'flex-end' },
  classFee: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  classFeeSub: { fontSize: 10, color: COLORS.gray },
  classCardFooter: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  feeStatusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  feeStatusText: { fontSize: 11, fontWeight: '700' },
  attBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  attText: { fontSize: 11, fontWeight: '700' },

  emptyCard: { backgroundColor: COLORS.white, borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyText: { color: COLORS.gray, fontSize: 14 },

  scanAgainBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, padding: 14, marginHorizontal: 16, marginTop: 8 },
  scanAgainText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});

export default AdminScanPay;