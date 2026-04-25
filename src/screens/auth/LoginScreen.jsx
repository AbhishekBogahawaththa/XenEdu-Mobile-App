import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';

const LoginScreen = ({ navigation }) => {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    // Debug alert
    Alert.alert(
      'Debug Info',
      `Email: ${email}\nPassword: ${password}\nAPI URL: ${api.defaults.baseURL}`,
      [
        { text: 'Cancel' },
        {
          text: 'Login Now',
          onPress: async () => {
            setLoading(true);
            try {
              const res = await api.post('/auth/login', { email, password });
              const { user, accessToken, refreshToken } = res.data;
              await AsyncStorage.setItem('accessToken', accessToken);
              await AsyncStorage.setItem('refreshToken', refreshToken);
              await AsyncStorage.setItem('user', JSON.stringify(user));
              setUser(user, accessToken);
            } catch (err) {
              Alert.alert(
                'Login Failed',
                `Status: ${err.response?.status || 'No response'}\nMessage: ${err.response?.data?.message || err.message}`
              );
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>X</Text>
          </View>
          <Text style={styles.logoName}>XenEdu</Text>
          <Text style={styles.logoSub}>Sri Lanka's Smart A/L Tuition System</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Sign In</Text>
          <Text style={styles.subtitle}>Welcome back! Enter your credentials</Text>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="your@email.com"
              placeholderTextColor={COLORS.gray}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                placeholderTextColor={COLORS.gray}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Text style={styles.eyeText}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Login button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.loginBtnText}>Sign In</Text>
            )}
          </TouchableOpacity>

          {/* Forgot password */}
          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Forgot your password?</Text>
          </TouchableOpacity>

          {/* Register */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>New student? </Text>
            <TouchableOpacity>
              <Text style={styles.registerLink}>Apply for registration</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>© 2026 XenEdu Mirigama</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: 16, backgroundColor: COLORS.gold, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoText: { fontSize: 32, fontWeight: '900', color: COLORS.primary },
  logoName: { fontSize: 32, fontWeight: '800', color: COLORS.white, marginBottom: 4 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', textAlign: 'center' },
  card: { width: '100%', backgroundColor: COLORS.white, borderRadius: 24, padding: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 8 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 12, padding: 14, fontSize: 14, color: COLORS.dark, backgroundColor: '#FAFAFA' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 12 },
  eyeText: { fontSize: 20 },
  loginBtn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8, elevation: 4 },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  forgotBtn: { alignItems: 'center', marginTop: 16 },
  forgotText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  registerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  registerText: { color: COLORS.gray, fontSize: 14 },
  registerLink: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  footer: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 24 },
});

export default LoginScreen;