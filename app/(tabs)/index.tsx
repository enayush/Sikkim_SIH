import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Grid, List, Bell, Mic, MessageSquare, Calendar } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getAllMonasteries, Monastery, MonasteryWithRating, getMonasteriesWithRatings, getMonasteriesByRegion } from '../../lib/monasteryService';
import SafeScreen from '../../components/SafeScreen';

// Define hardcoded monastery UUIDs
const CAROUSEL_MONASTERY_IDS = [
  'eceb7332-81c1-4888-850f-6a9196e4c71a',
  'ecbb904c-8103-4847-be38-3c79be529d9c',
  'ec47a454-ee59-40f5-838d-3a76098a0412',
  'eaf16139-1c03-4233-993d-885300136665'
];

const POPULAR_MONASTERY_IDS = [
  'eceb7332-81c1-4888-850f-6a9196e4c71a',
  'ecbb904c-8103-4847-be38-3c79be529d9c',
  'ec47a454-ee59-40f5-838d-3a76098a0412',
  'eaf16139-1c03-4233-993d-885300136665'
];

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [carouselMonasteries, setCarouselMonasteries] = useState<MonasteryWithRating[]>([]);
  const [popularMonasteries, setPopularMonasteries] = useState<MonasteryWithRating[]>([]);
  const [northernMonasteries, setNorthernMonasteries] = useState<MonasteryWithRating[]>([]);
  const [easternMonasteries, setEasternMonasteries] = useState<MonasteryWithRating[]>([]);
  const [southernMonasteries, setSouthernMonasteries] = useState<MonasteryWithRating[]>([]);
  const [westernMonasteries, setWesternMonasteries] = useState<MonasteryWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  // Animation states for header using reanimated
  const lastScrollY = useSharedValue(0);
  const scrollY = useSharedValue(0);

const HEADER_MAX_HEIGHT = 60; // or whatever your header height is

const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event) => {
    const y = event.contentOffset.y;
    const diff = y - lastScrollY.value;

    if (diff > 0) {
      // scrolling down → hide
      scrollY.value = Math.min(scrollY.value + diff, HEADER_MAX_HEIGHT);
    } else {
      // scrolling up → show
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
    fetchSelectedMonasteries();
  }, []);

  const fetchSelectedMonasteries = async () => {
    try {
      setLoading(true);
      const allMonasteriesWithRatings = await getMonasteriesWithRatings();
      
      // Filter carousel monasteries by hardcoded UUIDs
      const carouselData = allMonasteriesWithRatings.filter(monastery => 
        CAROUSEL_MONASTERY_IDS.includes(monastery.id)
      );
      
      // Filter popular monasteries by hardcoded UUIDs
      const popularData = allMonasteriesWithRatings.filter(monastery => 
        POPULAR_MONASTERY_IDS.includes(monastery.id)
      );
      
      // If no monasteries found with hardcoded UUIDs, use fallback
      if (carouselData.length === 0) {
        carouselData.push(...allMonasteriesWithRatings.slice(0, 4));
      }
      
      if (popularData.length === 0) {
        popularData.push(...allMonasteriesWithRatings.slice(4, 8));
      }
      
      setCarouselMonasteries(carouselData);
      setPopularMonasteries(popularData);

      // Fetch regional monasteries
      const [northern, eastern, southern, western] = await Promise.all([
        getMonasteriesByRegion('northern', 8),
        getMonasteriesByRegion('eastern', 8),
        getMonasteriesByRegion('southern', 8),
        getMonasteriesByRegion('western', 8)
      ]);

      setNorthernMonasteries(northern);
      setEasternMonasteries(eastern);
      setSouthernMonasteries(southern);
      setWesternMonasteries(western);

    } catch (error) {
      console.error('Error:', error);
      setCarouselMonasteries([]);
      setPopularMonasteries([]);
      setNorthernMonasteries([]);
      setEasternMonasteries([]);
      setSouthernMonasteries([]);
      setWesternMonasteries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const renderCarouselItem = (monastery: MonasteryWithRating) => (
    <TouchableOpacity
      key={monastery.id}
      style={styles.carouselItem}
      onPress={() => router.push(`/monastery/${monastery.id}` as any)}
    >
      <ImageBackground
        source={{ uri: monastery.images[0] }}
        style={styles.carouselImage}
      >
        <View style={styles.carouselTextContainer}>
          <Text style={styles.carouselMonasteryName}>{monastery.name}</Text>
          <Text style={styles.carouselMonasteryInfo}>
            {monastery.location} - {monastery.era}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderPopularMonasteryCard = (monastery: MonasteryWithRating) => (
    <TouchableOpacity
      key={monastery.id}
      style={styles.popularMonasteryCard}
      onPress={() => router.push(`/monastery/${monastery.id}` as any)}
    >
      <Image
        source={{ uri: monastery.images[0] }}
        style={styles.popularMonasteryImage}
      />
      <View style={styles.popularMonasteryInfo}>
        <Text style={styles.popularMonasteryName} numberOfLines={1}>
          {monastery.name}
        </Text>
        <Text style={styles.popularMonasteryDescription} numberOfLines={1}>
          {monastery.description}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            {monastery.era} • {monastery.location} • <Text style={styles.goldStar}>★</Text> {monastery.averageRating > 0 ? monastery.averageRating.toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderMonasterySection = (title: string, monasteries: MonasteryWithRating[], searchPath: string) => (
    <View style={styles.popularSection}>
      <View style={styles.popularHeader}>
        <Text style={styles.popularTitle}>{title}</Text>
      </View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.popularScrollContainer}
      >
        {monasteries.map(renderPopularMonasteryCard)}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => router.push(searchPath as any)}
        >
          <Text style={styles.moreButtonText}>More →</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#DF8020" />
      </View>
    );
  }

  return (
    <SafeScreen style={styles.container}>
      <Animated.View style={[styles.topBar, headerStyle]}>
        <View style={styles.logoContainer}>
          <Image source={require('../../assets/images/icon.png')} style={styles.logo} />
          <Text style={styles.appName}>Sacred Sikkim</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Bell size={24} color="#1F2937" />
        </TouchableOpacity>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.carouselContainer}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {carouselMonasteries.map(renderCarouselItem)}
          </Animated.ScrollView>
          <View style={styles.pagination}>
            {carouselMonasteries.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === activeIndex && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.smallButtonsContainer}>
          <TouchableOpacity style={styles.smallButton} onPress={() => router.push('/cultural-calendar')}>
            <Calendar size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Cultural Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={() => router.push('/audio-guide')}>
            <Mic size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.actionButtonText}>Audio Guide</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.popularSection}>
          <View style={styles.popularHeader}>
            <Text style={styles.popularTitle}>Popular Monasteries</Text>
          </View>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.popularScrollContainer}
          >
            {popularMonasteries.map(renderPopularMonasteryCard)}
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => router.push('/search')}
            >
              <Text style={styles.moreButtonText}>More →</Text>
            </TouchableOpacity>
          </Animated.ScrollView>
        </View>

        {renderMonasterySection('Northern Monasteries', northernMonasteries, '/search')}
        {renderMonasterySection('Eastern Monasteries', easternMonasteries, '/search')}
        {renderMonasterySection('Southern Monasteries', southernMonasteries, '/search')}
        {renderMonasterySection('Western Monasteries', westernMonasteries, '/search')}
      </Animated.ScrollView>
      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={() => router.push('/chatbot')}
      >
        <MessageSquare size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeScreen>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 60, // Height of the topBar
  },
  chatbotButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#DF8020',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    height: 220,
    marginTop: -60, // Pull carousel up to touch the header
  },
  carouselItem: {
    width: width,
    height: 220,
  },
  carouselImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 16,
  },
  carouselTextContainer: {
    padding: 12,
  },
  carouselMonasteryName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  carouselMonasteryInfo: {
    color: '#FFFFFF',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  smallButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 10,
  },
  largeButton: {
    flexDirection: 'row',
    backgroundColor: '#DF8020',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  largeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  smallButton: {
    flexDirection: 'row',
    backgroundColor: '#DF8020',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 6,
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  filterBarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  activeFilterButton: {
    backgroundColor: '#DF8020',
  },
  filterButtonText: {
    color: '#1F2937',
    fontWeight: '600',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#FFFFFF',
  },
  loadMoreButton: {
    backgroundColor: '#DF8020',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 24,
  },
  loadMoreButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  toggleButtons: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activeToggleButton: {
    backgroundColor: '#DF8020',
  },
  monasteryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  monasteryList: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  monasteryCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  monasteryListItem: {
    width: '100%',
    flexDirection: 'row',
  },
  monasteryImage: {
    width: '100%',
    height: 120,
  },
  monasteryListImage: {
    width: 100,
    height: '100%',
  },
  monasteryInfo: {
    padding: 12,
  },
  monasteryListInfo: {
    flex: 1,
    padding: 12,
  },
  monasteryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  monasteryLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  popularSection: {
    paddingTop: 20,
    paddingBottom: 20,
  },
  popularHeader: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  popularTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  popularScrollContainer: {
    paddingHorizontal: 16,
  },
  popularMonasteryCard: {
    width: 300,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginRight: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  popularMonasteryImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  popularMonasteryInfo: {
    padding: 16,
  },
  popularMonasteryName: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  popularMonasteryDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
  },
  goldStar: {
    color: '#FFD700',
  },
  popularMonasteryLocation: {
    fontSize: 15,
    color: '#6B7280',
    marginBottom: 4,
  },
  popularMonasteryEra: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    flexDirection: 'row',
    marginRight: 8,
  },
  starIcon: {
    fontSize: 14,
    color: '#FFD700',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  moreButton: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 260, // Match the new card height (180px image + ~80px info)
    paddingHorizontal: 20,
  },
  moreButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DF8020',
  },
});