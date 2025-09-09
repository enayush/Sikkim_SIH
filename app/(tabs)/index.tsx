import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Grid, List, Search as SearchIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { mockMonasteries } from '../../lib/mockData';

type Monastery = {
  id: string;
  name: string;
  location: string;
  era: string;
  description: string;
  history: string;
  cultural_significance: string;
  images: string[];
  latitude: number | null;
  longitude: number | null;
  created_at: string;
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMonasteries();
  }, []);

  const fetchMonasteries = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('monasteries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching monasteries:', error);
        // Fallback to mock data
        setMonasteries(mockMonasteries);
      } else if (data && data.length > 0) {
        setMonasteries(data);
      } else {
        // Use mock data if no data in Supabase
        setMonasteries(mockMonasteries);
      }
    } catch (error) {
      console.error('Error:', error);
      setMonasteries(mockMonasteries);
    } finally {
      setLoading(false);
    }
  };

  const filteredMonasteries = monasteries.filter(
    (monastery) =>
      monastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monastery.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monastery.era.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderMonasteryCard = (monastery: Monastery) => (
    <TouchableOpacity
      key={monastery.id}
      style={[
        styles.monasteryCard,
        viewMode === 'list' && styles.monasteryListItem,
      ]}
      onPress={() => router.push(`/monastery/${monastery.id}` as any)}
    >
      <Image
        source={{ uri: monastery.images[0] }}
        style={[
          styles.monasteryImage,
          viewMode === 'list' && styles.monasteryListImage,
        ]}
      />
      <View
        style={[
          styles.monasteryInfo,
          viewMode === 'list' && styles.monasteryListInfo,
        ]}
      >
        <Text style={styles.monasteryName}>{monastery.name}</Text>
        <Text style={styles.monasteryLocation}>{monastery.location}</Text>
        <Text style={styles.monasteryEra}>{monastery.era}</Text>
        <Text
          style={styles.monasteryDescription}
          numberOfLines={viewMode === 'card' ? 3 : 2}
        >
          {monastery.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('monasteries')}</Text>
        <View style={styles.headerControls}>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'card' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('card')}
          >
            <Grid size={20} color={viewMode === 'card' ? '#FFF' : '#6B7280'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewModeButton,
              viewMode === 'list' && styles.viewModeButtonActive,
            ]}
            onPress={() => setViewMode('list')}
          >
            <List size={20} color={viewMode === 'list' ? '#FFF' : '#6B7280'} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchContainer}>
        <SearchIcon size={20} color="#6B7280" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredMonasteries.map(renderMonasteryCard)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  viewModeButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  viewModeButtonActive: {
    backgroundColor: '#3B82F6',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  monasteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monasteryListItem: {
    flexDirection: 'row',
    padding: 16,
  },
  monasteryImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  monasteryListImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  monasteryInfo: {
    padding: 20,
  },
  monasteryListInfo: {
    flex: 1,
    padding: 0,
    justifyContent: 'center',
  },
  monasteryName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  monasteryLocation: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  monasteryEra: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
    fontWeight: '600',
  },
  monasteryDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});