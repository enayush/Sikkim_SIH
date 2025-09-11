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
import { getAllMonasteries, Monastery } from '../../lib/monasteryService';
import SafeScreen from '../../components/SafeScreen';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [monasteries, setMonasteries] = useState<Monastery[]>([]);
  const [carouselMonasteries, setCarouselMonasteries] = useState<Monastery[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [activeIndex, setActiveIndex] = useState(0);
  const [displayCount, setDisplayCount] = useState(10);
  const [activeFilter, setActiveFilter] = useState('All');

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
    fetchMonasteries();
  }, []);

  const fetchMonasteries = async () => {
    try {
      setLoading(true);
      const monasteryData = await getAllMonasteries();
      
      setMonasteries(monasteryData);

      const shuffled = [...monasteryData].sort(() => 0.5 - Math.random());
      setCarouselMonasteries(shuffled.slice(0, 3));

    } catch (error) {
      console.error('Error:', error);
      setMonasteries([]);
      setCarouselMonasteries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  };

  const handleLoadMore = () => {
    setDisplayCount(prevCount => prevCount + 10);
  };

  const filteredMonasteries = monasteries.filter(monastery => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Nearby') return true; // Placeholder for nearby logic
    if (activeFilter === 'Ancient') return parseInt(monastery.era, 10) < 1800; // Example: Ancient if before 1800
    if (activeFilter === 'Festivals') return true; // Placeholder for festivals logic
    return true;
  });

  const renderCarouselItem = (monastery: Monastery) => (
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
      </View>
    </TouchableOpacity>
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

        <View style={styles.filterBarContainer}>
          {['All', 'Nearby', 'Ancient', 'Festivals'].map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === filter && styles.activeFilterButtonText,
                ]}
              >
                {t(filter.toLowerCase())}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>{t('monasteries')}</Text>
          <View style={styles.toggleButtons}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'card' && styles.activeToggleButton,
              ]}
              onPress={() => setViewMode('card')}
            >
              <Grid
                size={20}
                color={viewMode === 'card' ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                viewMode === 'list' && styles.activeToggleButton,
              ]}
              onPress={() => setViewMode('list')}
            >
              <List
                size={20}
                color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View
          style={
            viewMode === 'card'
              ? styles.monasteryGrid
              : styles.monasteryList
          }
        >
          {filteredMonasteries.slice(0, displayCount).map(renderMonasteryCard)}
        </View>
        
        {displayCount < filteredMonasteries.length && (
          <TouchableOpacity onPress={handleLoadMore} style={styles.loadMoreButton}>
            <Text style={styles.loadMoreButtonText}>{t('loadMore', 'Load More')}</Text>
          </TouchableOpacity>
        )}
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
});