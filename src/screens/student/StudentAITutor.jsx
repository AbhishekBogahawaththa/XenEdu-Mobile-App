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
      content: `Hello! 🎓 I'm Zenya, your AI tutor for ${selectedSubject}!\n\nAsk me anything — concepts, examples, past paper help, or study tips!`,
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Tutor</Text>
          <Text style={styles.headerSub}>Powered by Groq AI</Text>
        </View>
        <ScrollView style={styles.selectScroll} contentContainerStyle={styles.selectContent}>
          {/* Siri ball */}
          <View style={styles.ballContainer}>
            <View style={styles.ball} />
          </View>

          <Text style={styles.selectTitle}>Choose a Subject</Text>
          <Text style={styles.selectSub}>Select a subject to start your personalized AI learning session</Text>

          <View style={styles.subjectGrid}>
            {SUBJECTS.map(subject => (
              <TouchableOpacity
                key={subject}
                onPress={() => setSelectedSubject(subject)}
                style={[styles.subjectBtn, selectedSubject === subject && styles.subjectBtnActive]}
              >
                <Text style={[styles.subjectBtnText, selectedSubject === subject && styles.subjectBtnTextActive]}>
                  {subject}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.startBtn, !selectedSubject && styles.startBtnDisabled]}
            onPress={startLearning}
            disabled={!selectedSubject}
          >
            <Text style={styles.startBtnText}>Start Learning 🚀</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => { setStarted(false); setMessages([]); setSelectedSubject(''); }}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={COLORS.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Zenya AI</Text>
          <Text style={styles.headerSub}>{selectedSubject}</Text>
        </View>
        <View style={styles.ballSmall} />
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
                <Text style={{ fontSize: 16 }}>🤖</Text>
              </View>
            )}
            <View style={[styles.msgBubble, msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleBot]}>
              <Text style={[styles.msgText, msg.role === 'user' && styles.msgTextUser]}>
                {msg.content}
              </Text>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.msgRow}>
            <View style={styles.msgAvatar}>
              <Text style={{ fontSize: 16 }}>🤖</Text>
            </View>
            <View style={styles.msgBubbleBot}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Quick questions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
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
          placeholderTextColor={COLORS.gray}
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          onPress={() => sendMessage()}
          disabled={loading || !input.trim()}
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
        >
          <Ionicons name="send" size={20} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a1a' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, paddingTop: 56, paddingBottom: 16,
    backgroundColor: '#0d1b2a',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: COLORS.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  ballContainer: { alignItems: 'center', marginBottom: 24 },
  ball: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#0EECF8',
    shadowColor: '#0EECF8', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 20, elevation: 10,
  },
  ballSmall: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#0EECF8',
    shadowColor: '#0EECF8', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 10,
  },
  selectScroll: { flex: 1 },
  selectContent: { padding: 24, alignItems: 'center' },
  selectTitle: { fontSize: 24, fontWeight: '800', color: COLORS.white, marginBottom: 8 },
  selectSub: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 32 },
  subjectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center', marginBottom: 32 },
  subjectBtn: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  subjectBtnActive: {
    backgroundColor: 'rgba(14,236,248,0.2)',
    borderColor: '#0EECF8',
  },
  subjectBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  subjectBtnTextActive: { color: '#0EECF8', fontWeight: '700' },
  startBtn: {
    backgroundColor: '#0EECF8', borderRadius: 16,
    paddingHorizontal: 48, paddingVertical: 16,
    shadowColor: '#0EECF8', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12,
  },
  startBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)', shadowOpacity: 0 },
  startBtnText: { color: '#0a0a1a', fontSize: 16, fontWeight: '800' },
  messages: { flex: 1, backgroundColor: '#0d1b2a' },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
  msgRowUser: { justifyContent: 'flex-end' },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(14,236,248,0.2)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  msgBubble: { maxWidth: '75%', padding: 12, borderRadius: 16 },
  msgBubbleBot: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  msgBubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  msgText: { fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 },
  msgTextUser: { color: COLORS.white },
  quickScroll: { maxHeight: 44, backgroundColor: '#0d1b2a' },
  quickBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: 'rgba(14,236,248,0.1)',
    borderWidth: 1, borderColor: 'rgba(14,236,248,0.3)',
  },
  quickBtnText: { fontSize: 12, color: '#0EECF8', fontWeight: '500' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 16, backgroundColor: '#0d1b2a',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    color: COLORS.white, fontSize: 14, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#0EECF8', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: 'rgba(255,255,255,0.1)' },
});

export default StudentAITutor;