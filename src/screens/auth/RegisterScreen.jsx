import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS } from '../../utils/constants';

const GRADES = ['Grade 12', 'Grade 13'];
const MEDIUMS = ['Sinhala', 'Tamil', 'English'];
const STREAMS = ['Physical Science', 'Biological Science', 'Commerce', 'Arts', 'Technology'];

const SelectRow = ({ label, options, value, onChange }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.optionRow}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt}
          style={[styles.optionBtn, value === opt && styles.optionBtnActive]}
          onPress={() => onChange(opt)}
        >
          <Text style={[styles.optionText, value === opt && styles.optionTextActive]}>
            {opt}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const RegisterScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Step 1 — Student Info
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [medium, setMedium] = useState('');
  const [stream, setStream] = useState('');

  // Step 2 — Parent Info
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentContact, setParentContact] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  const handleNext = () => {
    if (!studentName || !studentEmail || !school || !grade || !medium || !stream) {
      Alert.alert('Error', 'Please fill in all student details');
      return;
    }
    if (!studentEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!parentName || !parentEmail || !parentContact) {
      Alert.alert('Error', 'Parent name, email and contact are required');
      return;
    }
    if (!parentEmail.includes('@')) {
      Alert.alert('Error', 'Please enter a valid parent email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/register/apply', {
        studentName,
        studentEmail,
        school,
        grade,
        medium,
        stream,
        parentName,
        parentEmail,
        parentContact,
        parentAddress,
      });

      Alert.alert(
        'Registration Submitted!',
        'Your registration has been submitted successfully.\n\nAdmin will review and approve your account. You will receive your login credentials via email once approved.',
        [{ text: 'OK', onPress: () => navigation.replace('Login') }]
      );
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => step === 1 ? navigation.goBack() : setStep(1)}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.white} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Student Registration</Text>
            <Text style={styles.headerSub}>Step {step} of 2</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
        </View>

        {/* Card */}
        <View style={styles.card}>
          {step === 1 ? (
            <>
              <Text style={styles.cardTitle}>Student Details</Text>
              <Text style={styles.cardSub}>Fill in the student information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={studentName}
                    onChangeText={setStudentName}
                    placeholder="Student's full name"
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={studentEmail}
                    onChangeText={setStudentEmail}
                    placeholder="student@email.com"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>School Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="school-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={school}
                    onChangeText={setSchool}
                    placeholder="Your school name"
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <SelectRow label="Grade" options={GRADES} value={grade} onChange={setGrade} />
              <SelectRow label="Medium" options={MEDIUMS} value={medium} onChange={setMedium} />
              <SelectRow label="Stream" options={STREAMS} value={stream} onChange={setStream} />

              <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
                <Text style={styles.nextBtnText}>Next — Parent Details</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.cardTitle}>Parent Details</Text>
              <Text style={styles.cardSub}>Parent/Guardian information</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parent Full Name</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="person-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={parentName}
                    onChangeText={setParentName}
                    placeholder="Parent's full name"
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parent Email</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={parentEmail}
                    onChangeText={setParentEmail}
                    placeholder="parent@email.com"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Contact Number</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={parentContact}
                    onChangeText={setParentContact}
                    placeholder="07X XXX XXXX"
                    placeholderTextColor={COLORS.gray}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address (Optional)</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="location-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={parentAddress}
                    onChangeText={setParentAddress}
                    placeholder="Home address"
                    placeholderTextColor={COLORS.gray}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Info box */}
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
                <Text style={styles.infoText}>
                  After approval, login credentials will be sent to both student and parent email addresses.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.nextBtn, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color={COLORS.white} /> : (
                  <>
                    <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.white} />
                    <Text style={styles.nextBtnText}>Submit Registration</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.loginLink} onPress={() => navigation.replace('Login')}>
          <Text style={styles.loginLinkText}>Already have an account? </Text>
          <Text style={[styles.loginLinkText, { color: COLORS.gold, fontWeight: '700' }]}>Sign In</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, padding: 24, paddingTop: 56 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.6)' },
  progressBar: { height: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 2, marginBottom: 24 },
  progressFill: { height: 4, backgroundColor: COLORS.gold, borderRadius: 2 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 28, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2, shadowRadius: 28, elevation: 12,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  cardSub: { fontSize: 14, color: COLORS.gray, marginBottom: 20 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E0E0E0',
    borderRadius: 12, backgroundColor: '#FAFAFA', paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, padding: 13, fontSize: 14, color: COLORS.dark },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F5F5F5', borderWidth: 1.5, borderColor: '#E0E0E0' },
  optionBtnActive: { backgroundColor: '#F0FBF7', borderColor: COLORS.primary },
  optionText: { fontSize: 13, fontWeight: '600', color: COLORS.gray },
  optionTextActive: { color: COLORS.primary },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#F0FBF7', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#C8EDE2', marginBottom: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 8,
  },
  nextBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  loginLinkText: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
});

export default RegisterScreen;