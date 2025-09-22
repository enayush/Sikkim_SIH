import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  ImageBackground,
  StyleSheet,
} from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Mic, MessageSquare, Bell } from 'lucide-react-native';
import { MonasteryWithRating, getMonasteriesByRegion, getMonasteriesByIdsWithRatings } from '../../lib/monasteryService';
import SafeScreen from '../../components/SafeScreen';
import indstyle from './map/styles/indstyle';

// Define hardcoded monastery UUIDs
const CAROUSEL_MONASTERY_IDS = [
  '3d5d7d8c-da97-4918-83b5-0eab661f330a',
  'e8b8751d-0ad4-45e3-b87e-79251b319847',
  '58533da4-51fe-4b14-80b3-f67da2647351',
  '611c2131-1bfa-4996-8376-c7e699b46f26'
];

const POPULAR_MONASTERY_IDS = [
  'eceb7332-81c1-4888-850f-6a9196e4c71a',
  '907feb61-d267-404c-b5be-4331d17cc0c6',
  'e2082f48-ffe4-496d-8cab-da40ae177205',
  '90899b00-b549-47bd-ab40-251cf75041a7'
];

const { width } = Dimensions.get('window');

// Initial map region for Sikkim
const initialMapRegion = {
  latitude: 27.3314,
  longitude: 88.6138,
  latitudeDelta: 1,
  longitudeDelta: 1,
};

const HomeScreen = React.memo(() => {
  const { t } = useTranslation();
  const router = useRouter();
  const [carouselMonasteries, setCarouselMonasteries] = useState<MonasteryWithRating[]>([]);
  const [popularMonasteries, setPopularMonasteries] = useState<MonasteryWithRating[]>([]);
  const [northernMonasteries, setNorthernMonasteries] = useState<MonasteryWithRating[]>([]);
  const [easternMonasteries, setEasternMonasteries] = useState<MonasteryWithRating[]>([]);
  const [southernMonasteries, setSouthernMonasteries] = useState<MonasteryWithRating[]>([]);
  const [westernMonasteries, setWesternMonasteries] = useState<MonasteryWithRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [regionalLoading, setRegionalLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  // Animation states for header using reanimated
  const scrollY = useSharedValue(0);
  const HEADER_MAX_HEIGHT = 60;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event, ctx: { prevY?: number }) => {
      const y = event.contentOffset.y;
      const diff = y - (ctx.prevY ?? 0);

      if (diff > 0) {
        scrollY.value = Math.min(scrollY.value + diff, HEADER_MAX_HEIGHT);
      } else {
        scrollY.value = Math.max(scrollY.value + diff, 0);
      }
      ctx.prevY = y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollY.value }],
  }));

  useEffect(() => {
    fetchPrimaryMonasteries();
    fetchRegionalMonasteries(); // Start fetching regional data in parallel
  }, []);

  // OPTIMIZED: Fetch only the specific monasteries needed for the carousel and popular sections.
  const fetchPrimaryMonasteries = async () => {
    try {
      setLoading(true);
      
      // Combine IDs and remove duplicates to fetch all required data in one call
      const uniqueIdsToFetch = [...new Set([...CAROUSEL_MONASTERY_IDS, ...POPULAR_MONASTERY_IDS])];
      
      // Fetch only the monasteries we need
      const fetchedMonasteries = await getMonasteriesByIdsWithRatings(uniqueIdsToFetch);
      const monasteryMap = new Map(fetchedMonasteries.map(m => [m.id, m]));

      const carouselData = CAROUSEL_MONASTERY_IDS.map(id => monasteryMap.get(id)).filter(Boolean) as MonasteryWithRating[];
      const popularData = POPULAR_MONASTERY_IDS.map(id => monasteryMap.get(id)).filter(Boolean) as MonasteryWithRating[];

      setCarouselMonasteries(carouselData);
      setPopularMonasteries(popularData);

    } catch (error) {
      console.error('Error fetching primary monasteries:', error);
      // You might want to set some default or empty state here
      setCarouselMonasteries([]);
      setPopularMonasteries([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch regional monasteries in the background
  const fetchRegionalMonasteries = async () => {
    try {
      setRegionalLoading(true);
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
      console.error('Error fetching regional monasteries:', error);
    } finally {
      setRegionalLoading(false);
    }
  };
  
  const handleScroll = useCallback((event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setActiveIndex(index);
  }, []);

  const renderCarouselItem = useCallback((monastery: MonasteryWithRating) => (
    <TouchableOpacity
      key={monastery.id}
      style={indstyle.carouselItem}
      onPress={() => router.push(`/monastery/${monastery.id}`)}
    >
      <ImageBackground
        source={{ uri: monastery.images[0] }}
        style={indstyle.carouselImage}
      >
        <View style={indstyle.carouselTextContainer}>
          <Text style={indstyle.carouselMonasteryName}>{monastery.name}</Text>
          <Text style={indstyle.carouselMonasteryInfo}>
            {monastery.location} - {monastery.era}
          </Text>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  ), [router]);

  const renderPopularMonasteryCard = useCallback((monastery: MonasteryWithRating) => (
    <TouchableOpacity
      key={monastery.id}
      style={indstyle.popularMonasteryCard}
      onPress={() => router.push(`/monastery/${monastery.id}`)}
    >
      <Image
        source={{ uri: monastery.images[0] }}
        style={indstyle.popularMonasteryImage}
      />
      <View style={indstyle.popularMonasteryInfo}>
        <Text style={indstyle.popularMonasteryName} numberOfLines={1}>
          {monastery.name}
        </Text>
        <Text style={indstyle.popularMonasteryDescription} numberOfLines={1}>
          {monastery.description}
        </Text>
        <View style={indstyle.metaRow}>
          <Text style={indstyle.metaText}>
            {monastery.era} • {monastery.location} • <Text style={indstyle.goldStar}>★</Text> {monastery.averageRating > 0 ? monastery.averageRating.toFixed(1) : 'N/A'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  ), [router]);

  const renderMonasterySection = useCallback((title: string, monasteries: MonasteryWithRating[], searchPath: string) => (
    <View style={indstyle.popularSection}>
      <View style={indstyle.popularHeader}>
        <Text style={indstyle.popularTitle}>{title}</Text>
      </View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={indstyle.popularScrollContainer}
      >
        {regionalLoading && monasteries.length === 0 ? (
          <View style={indstyle.loadingContainer}>
            <ActivityIndicator size="small" color="#DF8020" />
            <Text style={indstyle.loadingText}>Loading...</Text>
          </View>
        ) : (
          <>
            {monasteries.map(renderPopularMonasteryCard)}
            <TouchableOpacity
              style={indstyle.moreButton}
              onPress={() => router.push('./search')}
            >
              <Text style={indstyle.moreButtonText}>More →</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.ScrollView>
    </View>
  ), [regionalLoading, renderPopularMonasteryCard, router]);


  if (loading) {
    return (
      <View style={indstyle.centered}>
        <ActivityIndicator size="large" color="#DF8020" />
      </View>
    );
  }

  return (
    <SafeScreen style={indstyle.container}>
      <Animated.View style={[indstyle.topBar, headerStyle]}>
        <View style={indstyle.logoContainer}>
          <Image source={require('../../assets/images/icon.png')} style={indstyle.logo} />
          <Text style={indstyle.appName}>Monastery360</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/notification')}>
          <Bell size={24} color="#1F2937" />
        </TouchableOpacity>
      </Animated.View>
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={indstyle.scrollContent}
      >
        <View style={indstyle.carouselContainer}>
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {carouselMonasteries.map(renderCarouselItem)}
          </Animated.ScrollView>
          <View style={indstyle.pagination}>
            {carouselMonasteries.map((_, index) => (
              <View
                key={index}
                style={[
                  indstyle.dot,
                  index === activeIndex && indstyle.activeDot,
                ]}
              />
            ))}
          </View>
        </View>
        

        <View style={indstyle.smallButtonsContainer}>
          <TouchableOpacity style={indstyle.smallButton} onPress={() => router.push('/cultural-calendar')}>
            <Calendar size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={indstyle.actionButtonText}>Cultural Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={indstyle.smallButton} onPress={() => router.push('/audio-guide')}>
            <Mic size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={indstyle.actionButtonText}>Audio Guide</Text>
          </TouchableOpacity>
        </View>

        {/* --- NEW MAP FEATURE START --- */}
        <TouchableOpacity
          style={indstyle.mapPreviewContainer}
          onPress={() => router.push('/map')} // Navigate to your map page
        >
          <MapView
            style={indstyle.map}
            initialRegion={initialMapRegion}
            pitchEnabled={false}
            rotateEnabled={false}
            scrollEnabled={false}
            zoomEnabled={false}
          >
            <Marker coordinate={initialMapRegion} />
          </MapView>
          <View style={indstyle.mapOverlay}>
            <Text style={indstyle.mapOverlayText}>Explore on Map</Text>
          </View>
        </TouchableOpacity>
        {/* --- NEW MAP FEATURE END --- */}

        <View style={indstyle.popularSection}>
          <View style={indstyle.popularHeader}>
            <Text style={indstyle.popularTitle}>Popular Monasteries</Text>
          </View>
          <Animated.ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={indstyle.popularScrollContainer}
          >
            {popularMonasteries.map(renderPopularMonasteryCard)}
            <TouchableOpacity
              style={indstyle.moreButton}
              onPress={() => router.push('/search')}
            >
              <Text style={indstyle.moreButtonText}>More →</Text>
            </TouchableOpacity>
          </Animated.ScrollView>
        </View>

        {renderMonasterySection('Northern Monasteries', northernMonasteries, '/search')}
        {renderMonasterySection('Eastern Monasteries', easternMonasteries, '/search')}
        {renderMonasterySection('Southern Monasteries', southernMonasteries, '/search')}
        {renderMonasterySection('Western Monasteries', westernMonasteries, '/search')}
      </Animated.ScrollView>
      <TouchableOpacity
        style={indstyle.chatbotButton}
        onPress={() => router.push('/chatbot')}
      >
        <MessageSquare size={30} color="#FFFFFF" />
      </TouchableOpacity>
    </SafeScreen>
  );
});

export default HomeScreen;