import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon, Filter, X } from 'lucide-react-native';
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

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

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
        setMonasteries(mockMonasteries);
      } else if (data && data.length > 0) {
        setMonasteries(data);
      } else {
        setMonasteries(mockMonasteries);
      }
    } catch (error) {
      console.error('Error:', error);
      setMonasteries(mockMonasteries);
    } finally {
      setLoading(false);
    }
  };

  const filteredMonasteries = monasteries.filter((monastery) => {
    const matchesSearch =
      monastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monastery.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEra = !selectedEra || monastery.era === selectedEra;
    const matchesLocation =
      !selectedLocation ||
      monastery.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesEra && matchesLocation;
  });

  const uniqueEras = [...new Set(monasteries.map((m) => m.era))];
  const uniqueLocations = [...new Set(monasteries.map((m) => m.location))];

  const clearFilters = () => {
    setSelectedEra('');
    setSelectedLocation('');
    setSearchQuery('');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF8020" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('search')}</Text>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} color="#DF8020" />
        </TouchableOpacity>
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

      {showFilters && (
        <View style={styles.filtersContainer}>
          <Text style={styles.filtersTitle}>{t('filters')}</Text>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Era:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedEra && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedEra('')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !selectedEra && styles.filterChipTextActive,
                    ]}
                  >
                    {t('allEras')}
                  </Text>
                </TouchableOpacity>
                {uniqueEras.map((era) => (
                  <TouchableOpacity
                    key={era}
                    style={[
                      styles.filterChip,
                      selectedEra === era && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedEra(era)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedEra === era && styles.filterChipTextActive,
                      ]}
                    >
                      {era}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Location:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterChips}>
                <TouchableOpacity
                  style={[
                    styles.filterChip,
                    !selectedLocation && styles.filterChipActive,
                  ]}
                  onPress={() => setSelectedLocation('')}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      !selectedLocation && styles.filterChipTextActive,
                    ]}
                  >
                    {t('allLocations')}
                  </Text>
                </TouchableOpacity>
                {uniqueLocations.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.filterChip,
                      selectedLocation === location && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedLocation(location)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedLocation === location &&
                          styles.filterChipTextActive,
                      ]}
                    >
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.clearFiltersButton} onPress={clearFilters}>
            <X size={16} color="#6B7280" />
            <Text style={styles.clearFiltersText}>{t('clearFilters')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredMonasteries.map((monastery) => (
          <TouchableOpacity
            key={monastery.id}
            style={styles.monasteryCard}
            onPress={() => router.push(`/monastery/${monastery.id}` as any)}
          >
            <Image
              source={{ uri: monastery.images[0] }}
              style={styles.monasteryImage}
            />
            <View style={styles.monasteryInfo}>
              <Text style={styles.monasteryName}>{monastery.name}</Text>
              <Text style={styles.monasteryLocation}>{monastery.location}</Text>
              <Text style={styles.monasteryEra}>{monastery.era}</Text>
              <Text style={styles.monasteryDescription} numberOfLines={2}>
                {monastery.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
        {filteredMonasteries.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No monasteries found matching your criteria
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    paddingTop: 20,
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
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
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filtersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  filterChips: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#DF8020',
    borderColor: '#DF8020',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    flexDirection: 'row',
    padding: 16,
  },
  monasteryImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginRight: 16,
  },
  monasteryInfo: {
    flex: 1,
    justifyContent: 'center',
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
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    fontWeight: '600',
  },
  monasteryDescription: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});