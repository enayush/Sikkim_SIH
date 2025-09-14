import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getJournalEntriesForUser, JournalEntry } from '../../lib/journalService';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function JournalListScreen() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadEntries();
  }, []);

  // Refresh entries when screen comes into focus (e.g., after deleting an entry)
  useFocusEffect(
    React.useCallback(() => {
      loadEntries();
    }, [])
  );

  const loadEntries = async () => {
    try {
      const data = await getJournalEntriesForUser();
      setEntries(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load journal entries');
    } finally {
      setLoading(false);
    }
  };

  const renderEntry = ({ item }: { item: JournalEntry }) => (
    <TouchableOpacity
      style={styles.entryCard}
      onPress={() => router.push(`/journal/${item.id}` as any)}
    >
      <Text style={styles.entryTitle}>
        {item.title || 'Untitled Entry'}
      </Text>
      <Text style={styles.entryDate}>
        {new Date(item.created_at).toLocaleDateString()}
      </Text>
      <Text style={styles.entryPreview} numberOfLines={2}>
        {item.content}
      </Text>
      {item.image_urls.length > 0 && (
        <Text style={styles.imageCount}>
          📷 Photo attached
        </Text>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <FlatList
        data={entries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No journal entries yet. Start documenting your journey!
            </Text>
          </View>
        }
        contentContainerStyle={entries.length === 0 ? styles.emptyList : undefined}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  entryCard: {
    backgroundColor: 'white',
    margin: 10,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  entryDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  entryPreview: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  imageCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
});
