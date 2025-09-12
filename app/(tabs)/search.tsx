import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Search as SearchIcon } from 'lucide-react-native';
import { getAllMonasteries, Monastery } from '../../lib/monasteryService';
import SafeScreen from '../../components/SafeScreen';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';

export default function SearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // 🔹 Header animation values
  const lastScrollY = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const HEADER_HEIGHT = 55; // Increased slightly to ensure complete hiding

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const diff = y - lastScrollY.value;

      if (diff > 0 && y > 10) {
        // scrolling down → hide header (only after scrolling past 10px)
        scrollY.value = Math.min(scrollY.value + diff, HEADER_HEIGHT + 5);
      } else if (diff < 0) {
        // scrolling up → show header
        scrollY.value = Math.max(scrollY.value + diff, 0);
      }

      lastScrollY.value = y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -scrollY.value }],
    };
  });

  useEffect(() => {
    fetchMonasteries();
  }, []);

  const fetchMonasteries = async () => {
    try {
      setLoading(true);
      const data = await getAllMonasteries();
      setMonasteries(data);
    } catch (error) {
      console.error('Error fetching monasteries:', error);
      setMonasteries([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMonasteries = monasteries.filter((monastery) => {
    const matchesSearch =
      monastery.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monastery.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF8020" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      {/* Search Bar as Top Bar - Clean like archive */}
      <Animated.View style={[styles.searchHeader, headerStyle]}>
        <View style={styles.searchContainer}>
          <SearchIcon size={18} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchPlaceholder')}
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </Animated.View>

      {/* Content */}
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 75 }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {filteredMonasteries.map((monastery) => (
          <TouchableOpacity
            key={monastery.id}
            style={styles.monasteryCard}
            onPress={() => router.push(`/monastery/${monastery.id}` as any)}
          >
            <Image source={{ uri: monastery.images[0] }} style={styles.monasteryImage} />
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
      </Animated.ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB' 
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  loadingText: { 
    marginTop: 16, 
    fontSize: 16, 
    color: '#6B7280' 
  },

  // Search Header (exactly like archive filterHeader)
  searchHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, // Slightly increased for better proportions
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12, // Reduced for shorter height
    backgroundColor: '#F9FAFB',
    borderRadius: 25, // Much more rounded like Google search
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flex: 1, // Takes full width now that there's no filter button
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: { 
    marginRight: 8 
  },
  searchInput: { 
    flex: 1, 
    fontSize: 16, // Slightly larger for better readability
    color: '#1F2937',
    height: 18, // Reduced height for more compact appearance
    paddingVertical: 0, // Remove any default padding
  },

  // Content
  scrollView: { 
    flex: 1 
  },
  scrollContent: { 
    padding: 20,
    paddingBottom: 100, // Extra bottom padding
  },
  monasteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    flexDirection: 'row',
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  monasteryImage: { 
    width: 100, 
    height: 100, 
    borderRadius: 16, 
    marginRight: 16 
  },
  monasteryInfo: { 
    flex: 1, 
    justifyContent: 'center' 
  },
  monasteryName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#1F2937', 
    marginBottom: 4 
  },
  monasteryLocation: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginBottom: 2 
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
    lineHeight: 20 
  },
  emptyState: { 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 40 
  },
  emptyStateText: { 
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center' 
  },
});
