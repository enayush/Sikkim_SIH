import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, MessageSquare, X, Clock, MessageCircle } from 'lucide-react-native';
import { timeAgo } from '@/lib/utils'; // We will create this utility function

type Conversation = {
  id: string;
  summary: string | null;
  updated_at: string;
  created_at: string;
  message_count: number;
};

type Props = {
  conversations: Conversation[];
  isLoading: boolean;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
  activeConversationId: string | null;
};

export default function ChatHistorySidebar({
  conversations,
  isLoading,
  onSelectConversation,
  onNewChat,
  onClose,
  activeConversationId,
}: Props) {
  const renderItem = ({ item }: { item: Conversation }) => (
    <TouchableOpacity
      style={[
        styles.conversationItem,
        item.id === activeConversationId && styles.activeConversation,
      ]}
      onPress={() => onSelectConversation(item.id)}
    >
      <View style={styles.conversationIcon}>
        <MessageSquare size={18} color="#DF8020" />
      </View>
      <View style={styles.conversationText}>
        <Text style={styles.summary} numberOfLines={1}>
          {item.summary || 'New Chat'}
        </Text>
        <View style={styles.metadata}>
          <View style={styles.metadataItem}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.timestamp}>{timeAgo(item.updated_at)}</Text>
          </View>
          <View style={styles.metadataItem}>
            <MessageCircle size={12} color="#9CA3AF" />
            <Text style={styles.messageCount}>{item.message_count} messages</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.newChatButton} onPress={onNewChat}>
        <Plus size={20} color="#FFFFFF" />
        <Text style={styles.newChatButtonText}>New Chat</Text>
      </TouchableOpacity>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color="#DF8020" />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DF8020',
    margin: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loader: {
    marginTop: 32,
  },
  list: {
    paddingHorizontal: 16,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeConversation: {
    backgroundColor: '#FEF3E7',
    borderColor: '#DF8020',
  },
  conversationIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3E7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  conversationText: {
    flex: 1,
  },
  summary: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  metadata: {
    flexDirection: 'column',
    gap: 2,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  messageCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
