import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/axios';
import { COLORS, SUBJECTS } from '../../utils/constants';

const StudentAITutor = () => {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  const quickQuestions = [
    'Explain this concept',
    'Give worked example',
    'Key formulas?',
    'Past paper tips',
    'Memory tricks',
    'Summarize topic',
  ];

  const startLearning = () => {
    if (!selectedSubject) return;
    setStarted(true);
    setMessages([{
      role: 'assistant',
      content: `Hello! 🎓 I'm your AI tutor for ${selectedSubject}!\n\nAsk me anything — concepts, examples, past paper help, or study tips. Let's ace your A/Levels! 💪`,
    }]);
  };

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: 'user', content: messageText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/learn', {
        message: messageText,
        subject: selectedSubject,
        conversationHistory: newMessages.slice(0, -1),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (err) {
      const isQuota = err.response?.data?.quotaExceeded;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: isQuota
          ? '⏰ AI quota exceeded! Please try again tomorrow morning.'
          : 'Sorry, I had trouble responding. Please try again!',
      }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  if (!started) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="sparkles" size={22} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Tutor</Text>
            <Text style={styles.headerSub}>Powered by Groq AI</Text>
          </View>
        </View>

        <ScrollView style={styles.selectScroll} contentContainerStyle={styles.selectContent}>
          {/* AI Icon */}
          <View style={styles.aiIconContainer}>
            <View style={styles.aiIconOuter}>
              <View style={styles.aiIconInner}>
                <Ionicons name="sparkles" size={36} color={COLORS.white} />
              </View>
            </View>
            <View style={styles.aiDots}>
              {[0, 1, 2].map(i => (
                <View key={i} style={[styles.aiDot, { opacity: 0.4 + i * 0.3 }]} />
              ))}
            </View>
          </View>

          <Text style={styles.selectTitle}>Choose Your Subject</Text>
          <Text style={styles.selectSub}>
            Select a subject to start your personalized AI learning session
          </Text>

          {/* Subject grid */}
          <View style={styles.subjectGrid}>
            {SUBJECTS.map(subject => (
              <TouchableOpacity
                key={subject}
                onPress={() => setSelectedSubject(subject)}
                style={[styles.subjectBtn, selectedSubject === subject && styles.subjectBtnActive]}
              >
                <Ionicons
                  name="book-outline"
                  size={14}
                  color={selectedSubject === subject ? COLORS.white : COLORS.primary}
                />
                <Text style={[styles.subjectBtnText, selectedSubject === subject && styles.subjectBtnTextActive]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selected subject banner */}
          {selectedSubject && (
            <View style={styles.selectedBanner}>
              <Ionicons name="checkmark-circle" size={18} color={COLORS.primary} />
              <Text style={styles.selectedText}>Selected: {selectedSubject}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.startBtn, !selectedSubject && styles.startBtnDisabled]}
            onPress={startLearning}
            disabled={!selectedSubject}
          >
            <Ionicons name="sparkles" size={18} color={selectedSubject ? COLORS.white : COLORS.gray} />
            <Text style={[styles.startBtnText, !selectedSubject && styles.startBtnTextDisabled]}>
              Start Learning
            </Text>
            {selectedSubject && <Ionicons name="arrow-forward" size={18} color={COLORS.white} />}
          </TouchableOpacity>

          {/* Features */}
          <View style={styles.featuresGrid}>
            {[
              { icon: 'bulb-outline', label: 'Concept\nExplanations' },
              { icon: 'calculator-outline', label: 'Worked\nExamples' },
              { icon: 'document-text-outline', label: 'Past Paper\nHelp' },
              { icon: 'trophy-outline', label: 'Study\nTips' },
            ].map((f, i) => (
              <View key={i} style={styles.featureCard}>
                <Ionicons name={f.icon} size={22} color={COLORS.primary} />
                <Text style={styles.featureLabel}>{f.label}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Chat Header */}
      <View style={styles.chatHeader}>
        <TouchableOpacity
          onPress={() => { setStarted(false); setMessages([]); setSelectedSubject(''); }}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.chatHeaderCenter}>
          <View style={styles.chatAvatarSmall}>
            <Ionicons name="sparkles" size={16} color={COLORS.white} />
          </View>
          <View>
            <Text style={styles.chatHeaderTitle}>AI Tutor</Text>
            <Text style={styles.chatHeaderSub}>{selectedSubject}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => { setMessages([{ role: 'assistant', content: `Hello! 🎓 I'm your AI tutor for ${selectedSubject}! Ask me anything!` }]); }}
          style={styles.clearBtn}
        >
          <Ionicons name="refresh-outline" size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((msg, i) => (
          <View key={i} style={[styles.msgRow, msg.role === 'user' && styles.msgRowUser]}>
            {msg.role === 'assistant' && (
              <View style={styles.msgAvatar}>
                <Ionicons name="sparkles" size={14} color={COLORS.primary} />
              </View>
            )}
            <View style={[styles.msgBubble, msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot]}>
              <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>
                {msg.content}
              </Text>
            </View>
            {msg.role === 'user' && (
              <View style={styles.userAvatar}>
                <Ionicons name="person" size={14} color={COLORS.white} />
              </View>
            )}
          </View>
        ))}

        {loading && (
          <View style={styles.msgRow}>
            <View style={styles.msgAvatar}>
              <Ionicons name="sparkles" size={14} color={COLORS.primary} />
            </View>
            <View style={[styles.msgBubble, styles.msgBubbleBot]}>
              <View style={styles.typingRow}>
                {[0, 1, 2].map(i => (
                  <View key={i} style={[styles.typingDot, { opacity: 0.3 + i * 0.3 }]} />
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
        style={styles.quickScroll}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
      >
        {quickQuestions.map((q, i) => (
          <TouchableOpacity key={i} onPress={() => sendMessage(q)} style={styles.quickBtn}>
            <Text style={styles.quickBtnText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          placeholder={`Ask about ${selectedSubject}...`}
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
            <Ionicons name="send" size={18} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },

  // Select screen header
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingTop: 56, paddingBottom: 20,
  },
  headerIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 },

  // Select scroll
  selectScroll: { flex: 1, backgroundColor: '#F5F5F5', borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  selectContent: { padding: 24, alignItems: 'center' },

  // AI Icon
  aiIconContainer: { alignItems: 'center', marginBottom: 24, marginTop: 8 },
  aiIconOuter: {
    width: 90, height: 90, borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  aiIconInner: { alignItems: 'center', justifyContent: 'center' },
  aiDots: { flexDirection: 'row', gap: 6 },
  aiDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  selectTitle: { fontSize: 22, fontWeight: '800', color: COLORS.dark, marginBottom: 8, textAlign: 'center' },
  selectSub: { fontSize: 13, color: COLORS.gray, textAlign: 'center', lineHeight: 20, marginBottom: 24, maxWidth: 280 },

  // Subjects
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 16, width: '100%' },
  subjectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20,
    backgroundColor: COLORS.white, borderWidth: 1.5, borderColor: '#E0E0E0',
    elevation: 1,
  },
  subjectBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  subjectBtnText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
  subjectBtnTextActive: { color: COLORS.white },

  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#F0FBF7', borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: '#C8EDE2', width: '100%', marginBottom: 16,
  },
  selectedText: { fontSize: 14, color: COLORS.primary, fontWeight: '700' },

  startBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: COLORS.primary, borderRadius: 16,
    paddingVertical: 14, paddingHorizontal: 32,
    width: '100%', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  startBtnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
  startBtnText: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  startBtnTextDisabled: { color: COLORS.gray },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%' },
  featureCard: {
    width: '47%', backgroundColor: COLORS.white, borderRadius: 14, padding: 14,
    alignItems: 'center', gap: 8, elevation: 1,
  },
  featureLabel: { fontSize: 12, color: COLORS.gray, fontWeight: '600', textAlign: 'center', lineHeight: 16 },

  // Chat header
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, paddingTop: 56,
    backgroundColor: COLORS.primary,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatAvatarSmall: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  chatHeaderTitle: { fontSize: 16, fontWeight: '800', color: COLORS.white },
  chatHeaderSub: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  clearBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Messages
  messages: { flex: 1, backgroundColor: '#F8FFFE' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: '#F0FBF7', borderWidth: 1, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  userAvatar: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  msgBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  msgBubbleBot: {
    backgroundColor: COLORS.white,
    borderWidth: 1, borderColor: '#E0F0EA',
    borderBottomLeftRadius: 4,
    elevation: 1,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgText: { fontSize: 14, color: COLORS.dark, lineHeight: 20 },
  msgTextUser: { color: COLORS.white },
  typingRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  typingDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  // Quick chips
  quickScroll: {
    maxHeight: 48, backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: '#F0FBF7', borderWidth: 1, borderColor: '#C8EDE2',
  },
  quickBtnText: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // Input
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1, borderTopColor: '#F0F0F0',
  },
  input: {
    flex: 1, backgroundColor: '#F8FFFE',
    borderWidth: 1.5, borderColor: '#E0F0EA',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.dark, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  sendBtnDisabled: { backgroundColor: '#E0E0E0', shadowOpacity: 0, elevation: 0 },
});

export default StudentAITutor;