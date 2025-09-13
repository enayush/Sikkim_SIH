import React from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Plus, MessageSquare, X } from 'lucide-react-native';
import { timeAgo } from '@/lib/utils'; // We will create this utility function

type Conversation = {
  id: string;
  summary: string | null;
  updated_at: string;
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
      <MessageSquare size={18} color="#9CA3AF" style={styles.icon} />
      <View style={styles.conversationText}>
        <Text style={styles.summary} numberOfLines={1}>
          {item.summary || 'New Chat'}
        </Text>
        <Text style={styles.timestamp}>{timeAgo(item.updated_at)}</Text>
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
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  activeConversation: {
    backgroundColor: '#FFFFFF',
  },
  icon: {
    marginRight: 12,
  },
  conversationText: {
    flex: 1,
  },
  summary: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
