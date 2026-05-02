import { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { COLORS } from '../../utils/constants';
import { savePushTokenToBackend } from '../../utils/notifications';

// ── XE Logo Component ──────────────────────────────────────────────────────────
export const XELogo = ({ size = 'md' }) => {
  const sizes = {
    sm: { box: 48, radius: 14, xSize: 20, eSize: 17 },
    md: { box: 80, radius: 22, xSize: 34, eSize: 28 },
    lg: { box: 120, radius: 32, xSize: 48, eSize: 40 },
  };
  const s = sizes[size];
  return (
    <View style={[xeStyles.box, { width: s.box, height: s.box, borderRadius: s.radius }]}>
      <View style={xeStyles.inner}>
        <Text style={[xeStyles.x, { fontSize: s.xSize }]}>X</Text>
        <Text style={[xeStyles.e, { fontSize: s.eSize }]}>E</Text>
      </View>
    </View>
  );
};

const xeStyles = StyleSheet.create({
  box: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  inner: { flexDirection: 'row', alignItems: 'baseline' },
  x: { fontWeight: '900', color: COLORS.gold, letterSpacing: -2 },
  e: { fontWeight: '900', color: COLORS.white, letterSpacing: -1 },
});

// ── FAQ Questions ──────────────────────────────────────────────────────────────
const FAQ_QUESTIONS = [
  { id: 1, q: 'How do I get my login credentials?', icon: 'key-outline' },
  { id: 2, q: 'What is XenEdu?', icon: 'information-circle-outline' },
  { id: 3, q: 'How do I pay fees?', icon: 'card-outline' },
  { id: 4, q: 'What subjects are available?', icon: 'book-outline' },
  { id: 5, q: 'How does attendance work?', icon: 'checkmark-circle-outline' },
  { id: 6, q: 'How to contact admin?', icon: 'call-outline' },
];

// ── FAQ Chat Modal ─────────────────────────────────────────────────────────────
const FAQModal = ({ visible, onClose }) => {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', text: "Hi! I'm Zenya, XenEdu's assistant. How can I help you today?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', text: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/ai/faq', {
        message: text.trim(),
        conversationHistory: newMessages.slice(-6).map(m => ({ role: m.role, content: m.text })),
      });
      const reply = res.data.reply || 'Sorry, I could not get a response.';
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        text: 'Sorry, I am having trouble connecting. Please call us at 033-2242-2589.',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const showFAQs = messages.length <= 1;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={faqStyles.container}>
        <View style={faqStyles.header}>
          <View style={faqStyles.headerLeft}>
            <View style={faqStyles.botAvatar}>
              <Text style={faqStyles.botAvatarText}>Z</Text>
            </View>
            <View>
              <Text style={faqStyles.headerTitle}>Zenya</Text>
              <Text style={faqStyles.headerSub}>XenEdu Assistant</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={faqStyles.closeBtn}>
            <Ionicons name="close" size={24} color={COLORS.dark} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollRef}
          style={faqStyles.messages}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(msg => (
            <View key={msg.id} style={[faqStyles.bubble, msg.role === 'user' ? faqStyles.userBubble : faqStyles.botBubble]}>
              <Text style={[faqStyles.bubbleText, msg.role === 'user' ? faqStyles.userText : faqStyles.botText]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {loading && <View style={faqStyles.botBubble}><ActivityIndicator size="small" color={COLORS.primary} /></View>}
          {showFAQs && (
            <View style={faqStyles.faqGrid}>
              <Text style={faqStyles.faqLabel}>Common questions:</Text>
              {FAQ_QUESTIONS.map(faq => (
                <TouchableOpacity key={faq.id} style={faqStyles.faqBtn} onPress={() => sendMessage(faq.q)}>
                  <Ionicons name={faq.icon} size={16} color={COLORS.primary} />
                  <Text style={faqStyles.faqBtnText}>{faq.q}</Text>
                  <Ionicons name="chevron-forward" size={14} color={COLORS.gray} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={faqStyles.inputRow}>
          <TextInput
            style={faqStyles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type your question..."
            placeholderTextColor={COLORS.gray}
            multiline
            maxLength={200}
          />
          <TouchableOpacity
            style={[faqStyles.sendBtn, (!input.trim() || loading) && faqStyles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="send" size={18} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const faqStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 56, backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: '#F0F0F0',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  botAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  botAvatarText: { fontSize: 18, fontWeight: '800', color: COLORS.gold },
  headerTitle: { fontSize: 16, fontWeight: '800', color: COLORS.dark },
  headerSub: { fontSize: 12, color: COLORS.gray },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  messages: { flex: 1 },
  bubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 8 },
  botBubble: { backgroundColor: COLORS.white, alignSelf: 'flex-start', borderBottomLeftRadius: 4, elevation: 1 },
  userBubble: { backgroundColor: COLORS.primary, alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  botText: { color: COLORS.dark },
  userText: { color: COLORS.white },
  faqGrid: { marginTop: 8 },
  faqLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', marginBottom: 8 },
  faqBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E0E0E0', elevation: 1 },
  faqBtnText: { flex: 1, fontSize: 13, color: COLORS.dark, fontWeight: '500' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.dark, maxHeight: 100, borderWidth: 1, borderColor: '#E0E0E0' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: COLORS.gray },
});

// ── Login Screen ───────────────────────────────────────────────────────────────
const LoginScreen = ({ navigation }) => {
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, accessToken, refreshToken } = res.data;
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      setUser(user, accessToken);
      savePushTokenToBackend();
    } catch (err) {
      Alert.alert('Login Failed', err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FAQModal visible={showFAQ} onClose={() => setShowFAQ(false)} />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Logo */}
          <View style={styles.logoContainer}>
            <XELogo size="md" />
            <Text style={styles.logoName}>XenEdu</Text>
            <Text style={styles.logoSub}>Sri Lanka's Smart A/L Tuition System</Text>
          </View>

          {/* Card */}
          <View style={styles.card}>
            <Text style={styles.title}>Sign In</Text>
            <Text style={styles.subtitle}>Welcome back! Enter your credentials</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputRow}>
                <Ionicons name="mail-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
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
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.gray} style={styles.inputIcon} />
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
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={COLORS.gray} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <>
                  <Ionicons name="log-in-outline" size={20} color={COLORS.white} />
                  <Text style={styles.loginBtnText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>XenEdu Mirigama</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
              <Text style={styles.infoText}>
                Use your registered email and password to login. Contact admin if you forgot your credentials.
              </Text>
            </View>
          </View>

          {/* Register Button */}
          <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate('Register')}>
            <View style={styles.btnLeft}>
              <Ionicons name="person-add-outline" size={20} color={COLORS.gold} />
              <Text style={styles.registerBtnText}>New Student?</Text>
            </View>
            <View style={styles.btnRight}>
              <Text style={styles.btnSub}>Register here</Text>
              <Ionicons name="chevron-forward" size={16} color={COLORS.gold} />
            </View>
          </TouchableOpacity>

          {/* FAQ Help Button */}
          <TouchableOpacity style={styles.helpBtn} onPress={() => setShowFAQ(true)}>
            <View style={styles.btnLeft}>
              <Ionicons name="help-circle-outline" size={20} color={COLORS.white} />
              <Text style={styles.helpBtnText}>Need Help?</Text>
            </View>
            <View style={styles.btnRight}>
              <Text style={styles.btnSub}>Chat with Zenya</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
            </View>
          </TouchableOpacity>

          <Text style={styles.footer}>© 2026 XenEdu Mirigama. All rights reserved.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoName: { fontSize: 34, fontWeight: '900', color: COLORS.white, marginTop: 14, marginBottom: 4, letterSpacing: 2 },
  logoSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', textAlign: 'center', letterSpacing: 0.5 },
  card: {
    width: '100%', backgroundColor: COLORS.white, borderRadius: 28, padding: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 28, elevation: 12,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.dark, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.gray, marginBottom: 24 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: '#555', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 12, backgroundColor: '#FAFAFA', paddingHorizontal: 12 },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, padding: 13, fontSize: 14, color: COLORS.dark },
  eyeBtn: { padding: 10 },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.primary, borderRadius: 14, padding: 16, marginTop: 8,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#F0F0F0' },
  dividerText: { fontSize: 12, color: COLORS.gray, fontWeight: '600' },
  infoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#F0FBF7', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#C8EDE2' },
  infoText: { flex: 1, fontSize: 12, color: COLORS.primary, lineHeight: 18 },

  // Register button — gold border
  registerBtn: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 16, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 16, borderWidth: 1.5, borderColor: COLORS.gold,
  },
  registerBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.gold },

  // Help button — subtle white border
  helpBtn: {
    width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 10, backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  helpBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },

  // Shared left/right layouts
  btnLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  btnRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  btnSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)' },

  footer: { color: 'rgba(255,255,255,0.4)', fontSize: 12, marginTop: 24 },
});

export default LoginScreen;