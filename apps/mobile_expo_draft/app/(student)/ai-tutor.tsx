import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  I18nManager,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMutation } from '@tanstack/react-query';
import { sendAiMessage, AiMessage } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/authStore';
import { Avatar } from '../../src/components/ui/Avatar';

const isRTL = I18nManager.isRTL;

const t = {
  title: isRTL ? 'المساعد الذكي' : 'AI Tutor',
  subtitle: isRTL ? 'اسألني أي سؤال دراسي' : 'Ask me anything academic',
  placeholder: isRTL ? 'اكتب سؤالك...' : 'Type your question...',
  welcome: isRTL
    ? 'مرحباً! أنا مساعدك الذكي في EduCore. يمكنني مساعدتك في أي مادة دراسية. ما الذي تودّ تعلّمه اليوم؟'
    : "Hello! I'm your AI tutor at EduCore. I can help you with any subject. What would you like to learn today?",
  errorMsg: isRTL ? 'فشل إرسال الرسالة. حاول مجدداً.' : 'Failed to send message. Try again.',
  clearChat: isRTL ? 'مسح المحادثة' : 'Clear Chat',
  suggestions: isRTL
    ? ['اشرح لي نظرية فيثاغورس', 'ما أسباب الحرب العالمية الأولى؟', 'كيف تعمل الخلية النباتية؟']
    : [
        'Explain the Pythagorean theorem',
        "What caused World War I?",
        'How does photosynthesis work?',
      ],
};

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: t.welcome,
  timestamp: new Date(),
};

export default function AiTutorScreen() {
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const mutation = useMutation({
    mutationFn: (apiMessages: AiMessage[]) => sendAiMessage(apiMessages),
    onSuccess: (data) => {
      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    onError: () => {
      Alert.alert('', t.errorMsg);
    },
  });

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || mutation.isPending) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => {
        const updated = [...prev, userMsg];
        // Build API history (skip welcome)
        const apiHistory: AiMessage[] = updated
          .filter((m) => m.id !== 'welcome')
          .map((m) => ({ role: m.role, content: m.content }));
        mutation.mutate(apiHistory);
        return updated;
      });

      setInput('');
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [mutation],
  );

  const clearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    return (
      <View
        style={[
          styles.messageRow,
          isUser
            ? isRTL
              ? styles.messageRowLeftRTL
              : styles.messageRowRight
            : styles.messageRowLeft,
        ]}
      >
        {!isUser && (
          <View style={styles.botAvatar}>
            <Text style={styles.botAvatarText}>🤖</Text>
          </View>
        )}
        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userBubbleText : styles.assistantBubbleText,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.timestamp,
              isUser ? styles.userTimestamp : styles.assistantTimestamp,
            ]}
          >
            {item.timestamp.toLocaleTimeString(isRTL ? 'ar-SA' : 'en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isUser && (
          <Avatar name={user?.name} uri={user?.avatarUrl} size={32} style={{ marginLeft: 8 }} />
        )}
      </View>
    );
  };

  const showSuggestions = messages.length === 1;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, isRTL && styles.rowReverse]}>
        <View style={styles.botIconWrapper}>
          <Text style={styles.botIconText}>🤖</Text>
        </View>
        <View style={{ flex: 1, marginLeft: isRTL ? 0 : 10, marginRight: isRTL ? 10 : 0 }}>
          <Text style={[styles.headerTitle, isRTL && styles.rtlText]}>{t.title}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtlText]}>{t.subtitle}</Text>
        </View>
        <TouchableOpacity onPress={clearChat} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>{t.clearChat}</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            mutation.isPending ? (
              <View style={styles.typingRow}>
                <View style={styles.botAvatar}>
                  <Text style={styles.botAvatarText}>🤖</Text>
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color="#1e3a5f" />
                  <Text style={styles.typingText}>
                    {isRTL ? 'يكتب...' : 'Typing...'}
                  </Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Suggestions */}
        {showSuggestions && (
          <View style={styles.suggestionsContainer}>
            {t.suggestions.map((s, i) => (
              <TouchableOpacity
                key={i}
                style={styles.suggestionChip}
                onPress={() => sendMessage(s)}
              >
                <Text style={styles.suggestionText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={[styles.inputRow, isRTL && styles.rowReverse]}>
          <TextInput
            style={[styles.input, isRTL && styles.rtlInput]}
            value={input}
            onChangeText={setInput}
            placeholder={t.placeholder}
            placeholderTextColor="#9ca3af"
            multiline
            maxLength={1000}
            textAlign={isRTL ? 'right' : 'left'}
          />
          <TouchableOpacity
            style={[styles.sendBtn, mutation.isPending && styles.sendBtnDisabled]}
            onPress={() => sendMessage(input)}
            disabled={mutation.isPending || !input.trim()}
          >
            <Text style={styles.sendIcon}>{isRTL ? '←' : '→'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f3f4f6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowReverse: { flexDirection: 'row-reverse' },
  rtlText: { textAlign: 'right' },
  rtlInput: { textAlign: 'right' },
  botIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5c518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  botIconText: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: '#93c5fd', marginTop: 1 },
  clearBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  clearBtnText: { color: '#ffffff', fontSize: 12 },
  messageList: { padding: 16, paddingBottom: 8 },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageRowLeft: { justifyContent: 'flex-start' },
  messageRowRight: { justifyContent: 'flex-end' },
  messageRowLeftRTL: { justifyContent: 'flex-end' },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  botAvatarText: { fontSize: 16 },
  bubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
  },
  userBubble: {
    backgroundColor: '#1e3a5f',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  userBubbleText: { color: '#ffffff' },
  assistantBubbleText: { color: '#111827' },
  timestamp: { fontSize: 10, marginTop: 4 },
  userTimestamp: { color: 'rgba(255,255,255,0.6)', textAlign: 'right' },
  assistantTimestamp: { color: '#9ca3af' },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 0,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    padding: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  typingText: { fontSize: 13, color: '#6b7280' },
  suggestionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#e0e7ff',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 6,
  },
  suggestionText: { fontSize: 13, color: '#1e3a5f', fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 10,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e3a5f',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  sendIcon: { fontSize: 18, color: '#ffffff', fontWeight: '700' },
});
