import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

// Polyfill for crypto.randomUUID
if (typeof crypto.randomUUID !== 'function') {
  // @ts-ignore - The types are slightly different but functionally compatible
  crypto.randomUUID = uuidv4;
}

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Dimensions,
  ScrollView,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, MessageSquare, Sparkles, History } from 'lucide-react-native';
import SafeScreen from '@/components/SafeScreen';
import { processChatMessage, getChatHistory, getOrCreateConversation, saveMessage, getAllConversations } from '@/lib/chatService';
import { useAuth } from '@/contexts/AuthContext';
import ChatHistorySidebar from '@/components/ChatHistorySidebar';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export default function Chatbot() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "🙏 Namaste! I'm your Sacred Sikkim guide. I can help you learn about monasteries, plan visits, and explore our beautiful Buddhist heritage. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const loadHistory = async () => {
      if (user) {
        // This will get the latest conversation or create a new one
        const convId = await getOrCreateConversation();
        if (convId) {
          setConversationId(convId);
          const history = await getChatHistory(convId);
          if (history.length > 0) {
            setMessages(history);
          }
        }
      }
    };
    loadHistory();
  }, [user]);

  // Keyboard listeners
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => setKeyboardHeight(e.endCoordinates.height)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardHeight(0)
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const loadConversations = async () => {
    if (!user) return;
    setIsLoadingConversations(true);
    try {
      const allConversations = await getAllConversations();
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const handleSelectConversation = async (selectedConversationId: string) => {
    setConversationId(selectedConversationId);
    const history = await getChatHistory(selectedConversationId);
    setMessages(history.length > 0 ? history : [
      {
        id: '1',
        text: "🙏 Welcome back! How can I help you explore Sikkim's monasteries today?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    setIsSidebarVisible(false);
  };

  const handleNewChat = async () => {
    const newConvId = await getOrCreateConversation();
    setConversationId(newConvId);
    setMessages([
      {
        id: '1',
        text: "🙏 Namaste! I'm your Sacred Sikkim guide. I can help you learn about monasteries, plan visits, and explore our beautiful Buddhist heritage. What would you like to know?",
        isUser: false,
        timestamp: new Date(),
      }
    ]);
    setIsSidebarVisible(false);
  };

  const handleOpenSidebar = () => {
    loadConversations();
    setIsSidebarVisible(true);
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    flatListRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    // Save user message to DB
    if (conversationId) {
      await saveMessage(conversationId, userMessage);
    }

    // Add typing indicator
    const typingMessage: Message = {
      id: 'typing',
      text: '...',
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Get the last two messages for context
      const lastMessages = messages.slice(-2);

      // Call our RAG + Gemini service with conversation history
      const response = await processChatMessage(userMessage.text, lastMessages);

      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      // Remove typing indicator and add response
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(botResponse));

      // Save bot response to DB
      if (conversationId) {
        await saveMessage(conversationId, botResponse);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I'm having trouble processing your request right now. Please try asking about specific monasteries or Buddhist culture in Sikkim!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages(prev => prev.filter(msg => msg.id !== 'typing').concat(errorResponse));
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessage : styles.botMessage
    ]}>
      {!item.isUser && (
        <View style={styles.botAvatar}>
          <MessageSquare size={16} color="#FFFFFF" />
        </View>
      )}
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.botBubble
      ]}>
        {item.isTyping ? (
          <View style={styles.typingContainer}>
            <ActivityIndicator size="small" color="#6B7280" />
            <Text style={styles.typingText}>Sacred Sikkim is typing...</Text>
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            item.isUser ? styles.userText : styles.botText
          ]}>
            {item.text}
          </Text>
        )}
      </View>
    </View>
  );

  const quickReplies = [
    "Tell me about Rumtek Monastery",
    "What monasteries are in Gangtok?",
    "Help me plan a visit",
    "Buddhist festivals in Sikkim"
  ];

  const handleQuickReply = (text: string) => {
    setInputText(text);
  };

  const handleOpenHistory = async () => {
    await loadConversations();
    setIsSidebarVisible(true);
  };  const handleCloseHistory = () => {
    setIsSidebarVisible(false);
  };

  // Group conversations by date
  const groupConversationsByDate = (convs: { id: string; summary: string | null; updated_at: string; }[]) => {
    const grouped: { [key: string]: { id: string; summary: string | null; updated_at: string; }[] } = {};

    convs.forEach((conv: { id: string; summary: string | null; updated_at: string; }) => {
      const date = new Date(conv.updated_at);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateKey: string;

      if (date.toDateString() === today.toDateString()) {
        dateKey = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        dateKey = 'Yesterday';
      } else {
        dateKey = date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(conv);
    });

    return grouped;
  };

  const groupedConversations = groupConversationsByDate(conversations);

  return (
    <SafeScreen>
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingBottom: keyboardHeight }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.headerAvatar}>
              <Sparkles size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Sacred Sikkim Guide</Text>
              <Text style={styles.headerSubtitle}>Monastery Expert Assistant</Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleOpenHistory} style={styles.historyButton}>
            <History size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          style={styles.messagesList}
          contentContainerStyle={[styles.messagesContent, { paddingBottom: keyboardHeight > 0 ? 120 : 80 }]}
          showsVerticalScrollIndicator={false}
        />

        {/* Quick Replies */}
        {messages.length === 1 && (
          <View style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>Try asking:</Text>
            <View style={styles.quickRepliesGrid}>
              {quickReplies.map((reply, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.quickReplyButton}
                  onPress={() => handleQuickReply(reply)}
                >
                  <Text style={styles.quickReplyText}>{reply}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about monasteries, visits, culture..."
              placeholderTextColor="#9CA3AF"
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Send size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Chat History Sidebar */}
        <Modal
          visible={isSidebarVisible}
          animationType="slide"
          transparent
        >
          <View style={styles.sidebarContainer}>
            <View style={styles.sidebarContent}>
              <TouchableOpacity onPress={handleCloseHistory} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✖️</Text>
              </TouchableOpacity>
              <Text style={styles.sidebarTitle}>Chat History</Text>
              <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
                {Object.entries(groupedConversations).map(([date, dateConversations]) => (
                  <View key={date} style={styles.dateSection}>
                    <Text style={styles.dateHeader}>{date}</Text>
                    {dateConversations.map((conv) => (
                      <TouchableOpacity
                        key={conv.id}
                        onPress={() => handleSelectConversation(conv.id)}
                        style={styles.historyItem}
                      >
                        <Text style={styles.historyText}>
                          {conv.summary || 'New Conversation'}
                        </Text>
                        <Text style={styles.historyTime}>
                          {new Date(conv.updated_at).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
                {conversations.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>No chat history yet</Text>
                    <Text style={styles.emptySubtext}>Start a conversation to see it here</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyButton: {
    padding: 8,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  botMessage: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#DF8020',
    borderBottomRightRadius: 4,
    marginLeft: 'auto',
  },
  botBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#1F2937',
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  quickRepliesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickReplyButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickReplyText: {
    fontSize: 14,
    color: '#4B5563',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DF8020',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  sidebarContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 50,
  },
  sidebarContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    height: Dimensions.get('window').height * 0.7,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  historyList: {
    flex: 1,
  },
  historyContent: {
    paddingBottom: 16,
  },
  historyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dateSection: {
    marginBottom: 20,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DF8020',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  historyTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
