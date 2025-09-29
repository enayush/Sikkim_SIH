import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
  FlatList,
  Image,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Volume2 } from 'lucide-react-native';
import { getMonasteriesWithAudioGuide, Monastery } from '@/lib/monasteryService';
import AudioGuideModal from '@/components/AudioGuideModal';
import SafeScreen from '@/components/SafeScreen';

export default function AudioGuide() {
  const router = useRouter();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonastery, setSelectedMonastery] = useState<Monastery | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadMonasteries();
  }, []);

  const loadMonasteries = async () => {
    try {
      const data = await getMonasteriesWithAudioGuide();
      // Only get monasteries that have audio guide content
      setMonasteries(data);
    } catch (error) {
      console.error('Error loading monasteries:', error);
      Alert.alert('Error', 'Failed to load monasteries');
    } finally {
      setLoading(false);
    }
  };

  const openAudioGuide = (monastery: Monastery) => {
    setSelectedMonastery(monastery);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedMonastery(null);
  };

  const renderMonasteryItem = ({ item }: { item: Monastery }) => {
    return (
      <View style={styles.monasteryCard}>
        <Image
          source={{ uri: item.images[0] || 'https://via.placeholder.com/300x200' }}
          style={styles.monasteryImage}
        />
        <View style={styles.monasteryInfo}>
          <Text style={styles.monasteryName}>{item.name}</Text>
          <Text style={styles.monasteryLocation}>📍 {item.location} Sikkim</Text>
          <Text style={styles.monasteryEra}>🏛️ {item.era}</Text>
          <Text style={styles.monasteryDescription} numberOfLines={2}>
            {item.description}
          </Text>

          <TouchableOpacity
            style={styles.playButton}
            onPress={() => openAudioGuide(item)}
          >
            <Play size={20} color="#FFFFFF" />
            <Text style={styles.playButtonText}>Play Audio Guide</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeScreen backgroundColor="#FFFFFF" forceTopPadding>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Audio Guide</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#DF8020" />
          <Text style={styles.loadingText}>Loading monasteries...</Text>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen backgroundColor="#FFFFFF" forceTopPadding>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.title}>Audio Guide</Text>
        <Volume2 size={24} color="#1F2937" />
      </View>

      <View style={styles.content}>
        <Text style={styles.subtitle}>🎧 Explore Sikkim's Sacred Monasteries</Text>
        <Text style={styles.description}>
          Listen to guided tours of our most significant monasteries
        </Text>

        <FlatList
          data={monasteries}
          renderItem={renderMonasteryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <AudioGuideModal
        visible={modalVisible}
        monastery={selectedMonastery}
        onClose={closeModal}
      />
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingBottom: 20,
  },
  monasteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  monasteryImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  monasteryInfo: {
    padding: 16,
  },
  monasteryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  monasteryLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  monasteryEra: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  monasteryDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
    lineHeight: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DF8020',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
