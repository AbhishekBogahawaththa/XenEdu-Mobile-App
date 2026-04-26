import { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Modal, ScrollView, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Animated, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axios';
import useAuthStore from '../store/authStore';
import { COLORS } from '../utils/constants';

const AVATAR = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=face&auto=format';

const faqs = [
  'What classes are available?',
  'How do I pay my fees?',
  'What is the attendance policy?',
  'How do I enroll in a class?',
  'What are the class timings?',
  'How can I view my results?',
];

const guestFAQAnswers = {
  'what classes are available': `We offer A/L classes at XenEdu Mirigama:\n\n📚 Science Stream:\n• Physics\n• Chemistry\n• Biology\n• Combined Mathematics\n\n📊 Commerce Stream:\n• Accounting\n• Economics\n• Business Studies\n\n💻 Technology: ICT\n📝 Languages: English, Sinhala\n\nAvailable for Grade 12 & 13 in Sinhala, Tamil and English mediums! 😊`,
  'how do i pay my fees': `At XenEdu, you can pay fees in 3 ways:\n\n💵 Cash — Pay at the institute counter.\n💳 Card — Pay by debit/credit card.\n🏦 Bank Transfer — Transfer and upload slip via portal.\n\n📍 Bank: Bank of Ceylon\n🔢 Account: 1234-5678-9012\n🏢 Branch: Mirigama\n\n📞 033-2242-2589 for more details! 😊`,
  'what is the attendance policy': `XenEdu requires minimum 80% attendance.\n\n📊 Attendance marked using student ID barcode.\n⚠️ If attendance drops below 80%, parents get an alert.\n\nRegular attendance is key to A/L success! 💪`,
  'how do i enroll in a class': `Enrolling at XenEdu is simple! 😊\n\n1️⃣ Register — Fill your details online.\n2️⃣ Admin Approval — Get login via email.\n3️⃣ Browse & Enroll — Login and enroll in subjects.\n4️⃣ Pay Fees — Counter or bank transfer.\n\nNeed help? Call 📞 033-2242-2589! 🎓`,
  'what are the class timings': `Class timings vary by subject and teacher.\n\n⏰ Morning: 7:00 AM - 12:00 PM\n⏰ Evening: 2:00 PM - 7:00 PM\n📅 Weekdays and weekends\n\n📞 033-2242-2589\n📧 xenedu@gmail.com`,
  'how can i view my results': `Track your progress via the student portal:\n\n📊 Attendance %, payment history, enrolled classes and outstanding fees.\n\nParents can monitor via the parent portal! 👨‍👩‍👧\n\nExam results are provided directly by teachers.`,
};

const getGuestReply = (message) => {
  const lower = message.toLowerCase();
  for (const [key, answer] of Object.entries(guestFAQAnswers)) {
    if (lower.includes(key.split(' ').slice(0, 3).join(' '))) return answer;
  }
  if (lower.includes('class') || lower.includes('subject')) return guestFAQAnswers['what classes are available'];
  if (lower.includes('fee') || lower.includes('pay')) return guestFAQAnswers['how do i pay my fees'];
  if (lower.includes('attend') || lower.includes('absent')) return guestFAQAnswers['what is the attendance policy'];
  if (lower.includes('enroll') || lower.includes('register')) return guestFAQAnswers['how do i enroll in a class'];
  if (lower.includes('time') || lower.includes('schedule')) return guestFAQAnswers['what are the class timings'];
  if (lower.includes('result') || lower.includes('mark')) return guestFAQAnswers['how can i view my results'];
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) return "Hi there! 👋 I'm Zenya, XenEdu's AI assistant!\n\nAsk me about classes, fees, enrollment and more! 😊";
  if (lower.includes('contact') || lower.includes('address')) return "📍 XenEdu Mirigama\n📞 033-2242-2589\n📧 xenedu@gmail.com\n\nMon-Fri: 8AM-6PM | Sat: 8AM-4PM";
  if (lower.includes('price') || lower.includes('cost')) return "Fees: Rs. 2,000 - Rs. 3,500/month depending on subject.\n\n📞 033-2242-2589";
  return "Thanks for your question! 😊\n\nI can help with classes, fees, enrollment and schedules.\n\n📞 033-2242-2589\n📧 xenedu@gmail.com";
};

const ZenyaChat = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState(null);
  const scrollRef = useRef(null);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const onlinePulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // FAB float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(fabAnim, { toValue: -7, duration: 1500, useNativeDriver: true }),
        Animated.timing(fabAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    // Online pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(onlinePulse, { toValue: 1.5, duration: 1000, useNativeDriver: true }),
        Animated.timing(onlinePulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (started && pendingMessage) {
      sendMessage(pendingMessage);
      setPendingMessage(null);
    }
  }, [started, pendingMessage]);

  const startChat = (faqMessage = null) => {
    const welcomeText = user
      ? `Hi${user ? `, ${user.name.split(' ')[0]}` : ''}! 👋 I'm Zenya, your XenEdu AI assistant.\n\nI can help you with classes, fees, attendance, and anything about your studies. What would you like to know?`
      : "Hi there! 👋 I'm Zenya, XenEdu's AI assistant!\n\nI can answer your questions about our classes, fees, enrollment and more.\n\nWhat would you like to know? 😊";

    setMessages([{ role: 'assistant', content: welcomeText }]);
    setStarted(true);
    if (faqMessage) setPendingMessage(faqMessage);
  };

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      if (user) {
        const res = await api.post('/ai/chat', {
          message: messageText,
          conversationHistory: newMessages.slice(0, -1).map(m => ({ role: m.role, content: m.content })),
        });
        setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
      } else {
        await new Promise(resolve => setTimeout(resolve, 600));
        const reply = getGuestReply(messageText);
        setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (err) {
      const isQuota = err.response?.data?.quotaExceeded;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isQuota
          ? '⏰ AI quota exceeded! Please try again later.'
          : 'Sorry, I had trouble responding. Please try again!',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
    setStarted(false);
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* FAB - Girl photo button */}
      <Animated.View style={[styles.fab, { transform: [{ translateY: fabAnim }] }]}>
        <TouchableOpacity
          onPress={() => setIsOpen(true)}
          style={styles.fabBtn}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: AVATAR }}
            style={styles.fabImage}
          />
          {/* Online dot */}
          <Animated.View style={[styles.fabOnlineDot, { transform: [{ scale: onlinePulse }] }]} />
        </TouchableOpacity>
      </Animated.View>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeChat}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.headerAvatarContainer}>
                <Image source={{ uri: AVATAR }} style={styles.headerAvatar} />
                <Animated.View style={[styles.headerOnlineDot, { transform: [{ scale: onlinePulse }] }]} />
              </View>
              <View>
                <Text style={styles.headerName}>Zenya</Text>
                <Text style={styles.headerStatus}>
                  {user ? 'Online — XenEdu AI Assistant' : 'Online — Ask me anything!'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={closeChat} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {!started ? (
            /* Welcome screen */
            <ScrollView style={styles.welcomeScroll} contentContainerStyle={styles.welcomeContent}>
              {/* Big avatar */}
              <View style={styles.welcomeAvatarContainer}>
                <Image source={{ uri: AVATAR }} style={styles.welcomeAvatar} />
                <View style={styles.welcomeOnlineDot} />
              </View>

              <Text style={styles.welcomeTitle}>
                Hi, I'm <Text style={{ color: COLORS.primary }}>Zenya</Text> 👋
              </Text>
              <Text style={styles.welcomeSubtitle}>Your intelligent AI assistant</Text>
              <Text style={styles.welcomeDesc}>
                {user
                  ? 'Ask me about classes, fees, attendance or anything about your studies!'
                  : 'Ask me about XenEdu classes, fees, enrollment and more!'}
              </Text>

              {/* FAQ buttons */}
              <View style={styles.faqList}>
                {faqs.slice(0, 4).map((faq, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => startChat(faq)}
                    style={styles.faqBtn}
                  >
                    <View style={styles.faqArrow}>
                      <Text style={styles.faqArrowText}>→</Text>
                    </View>
                    <Text style={styles.faqBtnText}>{faq}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          ) : (
            /* Chat screen */
            <>
              <ScrollView
                ref={scrollRef}
                style={styles.messages}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                {messages.map((msg, i) => (
                  <View key={i} style={[
                    styles.msgRow,
                    msg.role === 'user' ? styles.msgRowUser : styles.msgRowBot
                  ]}>
                    {msg.role === 'assistant' && (
                      <Image source={{ uri: AVATAR }} style={styles.msgAvatar} />
                    )}
                    <View style={[
                      styles.msgBubble,
                      msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot
                    ]}>
                      <Text style={[
                        styles.msgText,
                        msg.role === 'user' && styles.msgTextUser
                      ]}>
                        {msg.content}
                      </Text>
                    </View>
                    {msg.role === 'user' && (
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user?.name?.charAt(0)?.toUpperCase() || '?'}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}

                {/* Loading */}
                {loading && (
                  <View style={[styles.msgRow, styles.msgRowBot]}>
                    <Image source={{ uri: AVATAR }} style={styles.msgAvatar} />
                    <View style={styles.msgBubbleBot}>
                      <View style={styles.typingRow}>
                        {[0, 1, 2].map(i => (
                          <View key={i} style={styles.typingDot} />
                        ))}
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Quick chips */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.chipsScroll}
                contentContainerStyle={styles.chipsContent}
              >
                {faqs.map((faq, i) => (
                  <TouchableOpacity
                    key={i}
                    onPress={() => sendMessage(faq)}
                    style={styles.chip}
                  >
                    <Text style={styles.chipText}>{faq}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Input */}
              <View style={styles.inputContainer}>
                <View style={styles.inputRow}>
                  <TextInput
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={() => sendMessage()}
                    placeholder={user ? 'Type your message...' : 'Ask about classes, fees, enrollment...'}
                    placeholderTextColor="#AAA"
                    style={styles.input}
                    multiline
                    maxLength={500}
                  />
                  <TouchableOpacity
                    onPress={() => sendMessage()}
                    disabled={loading || !input.trim()}
                    style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color={COLORS.white} />
                    ) : (
                      <Ionicons name="send" size={16} color={COLORS.white} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.inputHint}>Enter to send • Shift+Enter for new line</Text>
              </View>
            </>
          )}

          {/* Start button (on welcome screen) */}
          {!started && (
            <View style={styles.startBtnContainer}>
              <TouchableOpacity
                onPress={() => startChat()}
                style={styles.startBtn}
              >
                <Text style={styles.startBtnText}>Start Conversation →</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // ── FAB ──
fab: {
  position: 'absolute',
  bottom: 20,   // ← more space from bottom
  right: 24,     // ← more space from right edge
  zIndex: 999,
},
fabBtn: {
  width: 48, height: 48, borderRadius: 32,
  borderWidth: 1, borderColor: COLORS.white,
  shadowColor: COLORS.primary,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4, shadowRadius: 12,
  elevation: 10,
  position: 'relative',  // ← needed for dot positioning
},
fabImage: {
  width: 64, height: 64,  // ← exact size
  borderRadius: 32,
},
fabOnlineDot: {
  position: 'absolute',
  bottom: -19,      // ← inside button
  right: -12,       // ← inside button
  width: 14, height: 14, borderRadius: 8,
  backgroundColor: '#00C853',
  borderWidth: 2.5, borderColor: COLORS.white,
  zIndex: 10,     // ← on top of image
  elevation: 5,
},

  // ── Modal ──
  container: { flex: 1, backgroundColor: '#FAFFFE' },

  // ── Header ──
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: 56,
    backgroundColor: COLORS.primary,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatarContainer: { position: 'relative' },
  headerAvatar: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
  },
  headerOnlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: '#00FF9D',
    borderWidth: 2, borderColor: COLORS.white,
  },
  headerName: { fontSize: 15, fontWeight: '800', color: COLORS.white },
  headerStatus: { fontSize: 11, color: 'rgba(255,255,255,0.75)', marginTop: 1 },
  closeBtn: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Welcome ──
  welcomeScroll: { flex: 1 },
  welcomeContent: { padding: 24, alignItems: 'center' },
  welcomeAvatarContainer: { position: 'relative', marginBottom: 16 },
  welcomeAvatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 4, borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 16,
  },
  welcomeOnlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#00C853',
    borderWidth: 3, borderColor: COLORS.white,
  },
  welcomeTitle: { fontSize: 24, fontWeight: '800', color: '#1a1a1a', marginBottom: 4 },
  welcomeSubtitle: { fontSize: 13, fontWeight: '600', color: '#00b8c8', marginBottom: 6 },
  welcomeDesc: {
    fontSize: 13, color: '#888', lineHeight: 20,
    textAlign: 'center', maxWidth: 300, marginBottom: 24,
  },
  faqList: { width: '100%', gap: 8 },
  faqBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.white,
    borderWidth: 1.5, borderColor: '#E4F5F7',
    borderRadius: 12, padding: 12,
    elevation: 1,
  },
  faqArrow: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: '#E4F5F7',
    alignItems: 'center', justifyContent: 'center',
  },
  faqArrowText: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  faqBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '500', flex: 1 },

  // ── Start button ──
  startBtnContainer: { padding: 16, paddingBottom: 24, backgroundColor: '#FAFFFE' },
  startBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14, padding: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  startBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },

  // ── Messages ──
  messages: { flex: 1, backgroundColor: '#F8FFFE' },
  messagesContent: { padding: 16, gap: 14 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgRowBot: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 2, borderColor: COLORS.primary,
    flexShrink: 0,
  },
  msgBubble: { maxWidth: '78%', borderRadius: 20, padding: 12 },
  msgBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 8, elevation: 3,
  },
  msgBubbleBot: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: '#EEF8F4',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  msgText: { fontSize: 14, color: '#2D2D2D', lineHeight: 22 },
  msgTextUser: { color: COLORS.white },
  userAvatar: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
    flexShrink: 0,
    elevation: 2,
  },
  userAvatarText: { fontSize: 14, fontWeight: '800', color: COLORS.primary },
  typingRow: { flexDirection: 'row', gap: 4, alignItems: 'center', padding: 4 },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
    opacity: 0.6,
  },

  // ── Chips ──
  chipsScroll: {
    maxHeight: 46, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  chipsContent: { paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#E4F5F7',
    borderWidth: 1, borderColor: '#b8e4ea',
  },
  chipText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // ── Input ──
  inputContainer: {
    padding: 12, paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    backgroundColor: '#F8FFFE',
    borderWidth: 1.5, borderColor: '#E0F0EA',
    borderRadius: 18, padding: 10,
  },
  input: {
    flex: 1, fontSize: 14, color: '#2D2D2D',
    maxHeight: 100, minHeight: 24,
    lineHeight: 20,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  sendBtnDisabled: { backgroundColor: '#E8E8E8', shadowOpacity: 0, elevation: 0 },
  inputHint: { fontSize: 11, color: '#CCC', textAlign: 'center', marginTop: 5 },
});

export default ZenyaChat;