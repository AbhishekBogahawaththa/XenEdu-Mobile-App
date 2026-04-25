import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const StudentQRCode = () => {
  const { user } = useAuthStore();

  const { data: dashboard } = useQuery({
    queryKey: ['mobile-dashboard'],
    queryFn: () => api.get('/dashboard/student').then(r => r.data),
  });

  const admissionNumber = dashboard?.student?.admissionNumber || '';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Student ID</Text>
        <Text style={styles.headerSub}>Show this to mark attendance</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

        {/* Student info card */}
        <View style={styles.idCard}>
          <View style={styles.idCardHeader}>
            <View style={styles.idLogoBox}>
              <Text style={styles.idLogoText}>X</Text>
            </View>
            <View>
              <Text style={styles.idSchoolName}>XenEdu</Text>
              <Text style={styles.idSchoolSub}>Mirigama</Text>
            </View>
          </View>

          <View style={styles.idAvatar}>
            <Text style={styles.idAvatarText}>{user?.name?.charAt(0)}</Text>
          </View>

          <Text style={styles.idName}>{user?.name}</Text>
          <Text style={styles.idNumber}>{admissionNumber}</Text>

          <View style={styles.idBadge}>
            <Text style={styles.idBadgeText}>STUDENT</Text>
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            {admissionNumber ? (
              <QRCode
                value={admissionNumber}
                size={180}
                color={COLORS.dark}
                backgroundColor="white"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.qrPlaceholderText}>Loading...</Text>
              </View>
            )}
          </View>

          <Text style={styles.qrHint}>Scan QR code or barcode to mark attendance</Text>

          {/* Barcode number */}
          <View style={styles.barcodeRow}>
            {admissionNumber.split('').map((char, i) => (
              <Text key={i} style={styles.barcodeChar}>{char}</Text>
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How to use</Text>
          {[
            { icon: '📱', text: 'Show QR code to teacher at class start' },
            { icon: '✅', text: 'Teacher scans to mark you present' },
            { icon: '📊', text: 'View attendance in Dashboard' },
            { icon: '⚠️', text: 'Maintain 80% minimum attendance' },
          ].map((item, i) => (
            <View key={i} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{item.icon}</Text>
              <Text style={styles.infoText}>{item.text}</Text>
            </View>
          ))}
        </View>

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
  scroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  scrollContent: { padding: 20 },
  idCard: {
    backgroundColor: COLORS.white, borderRadius: 24, padding: 24,
    alignItems: 'center', marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 16, elevation: 4,
  },
  idCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    alignSelf: 'flex-start', marginBottom: 20,
  },
  idLogoBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  idLogoText: { fontSize: 18, fontWeight: '900', color: COLORS.gold },
  idSchoolName: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  idSchoolSub: { fontSize: 11, color: COLORS.gray },
  idAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  idAvatarText: { fontSize: 32, fontWeight: '800', color: COLORS.gold },
  idName: { fontSize: 20, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  idNumber: { fontSize: 16, color: COLORS.primary, fontWeight: '700', marginBottom: 8 },
  idBadge: {
    backgroundColor: COLORS.gold, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 4, marginBottom: 24,
  },
  idBadgeText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  qrContainer: {
    padding: 16, backgroundColor: 'white',
    borderRadius: 16, borderWidth: 2, borderColor: '#F0F0F0',
    marginBottom: 16,
  },
  qrPlaceholder: {
    width: 180, height: 180,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5F5F5', borderRadius: 8,
  },
  qrPlaceholderText: { color: COLORS.gray },
  qrHint: { fontSize: 12, color: COLORS.gray, textAlign: 'center', marginBottom: 12 },
  barcodeRow: { flexDirection: 'row', gap: 4 },
  barcodeChar: { fontSize: 18, fontWeight: '800', color: COLORS.dark, letterSpacing: 2 },
  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    elevation: 2, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.dark, marginBottom: 12, textTransform: 'uppercase' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  infoIcon: { fontSize: 20, width: 28 },
  infoText: { fontSize: 13, color: COLORS.gray, flex: 1 },
});

export default StudentQRCode;