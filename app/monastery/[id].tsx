import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Dimensions,
  Modal,
  StatusBar,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft, Star, ChevronLeft, ChevronRight, Volume2, X, BookOpen } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getMonasteryById, getMonasteryReviews, Monastery, MonasteryReviewWithUser } from '../../lib/monasteryService';
import { useAuth } from '../../contexts/AuthContext';
import Monstyles from './styles/style';
import SafeScreen from '../../components/SafeScreen';
import ReviewsSection from './ReviewsSection';

export default function MonasteryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  // State management
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [reviews, setReviews] = useState<MonasteryReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Ref for horizontal scroll view
  const tabScrollViewRef = useRef<ScrollView>(null);
  
  // Tab configuration
  const tabs = [
    { key: 'overview', title: 'Overview' },
    { key: 'images', title: 'Images' },
    { key: 'reviews', title: 'Reviews' }
  ];

  useEffect(() => {
    fetchMonasteryDetails();
    fetchReviews();
  }, [id]);

  // Data fetching
  const fetchMonasteryDetails = async () => {
    if (!id) return;
    
    try {
      const data = await getMonasteryById(id as string);
      setMonastery(data);
    } catch (error) {
      console.error('Error fetching monastery:', error);
      Alert.alert('Error', 'Failed to load monastery details');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!id) return;
    
    try {
      const reviewsData = await getMonasteryReviews(id as string);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  // Calculate average rating
  const getAverageRating = () => {
    if (reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    return Math.round((totalRating / reviews.length) * 10) / 10; // Round to 1 decimal place
  };

  // Format rating text
  const getRatingText = () => {
    const avgRating = getAverageRating();
    const reviewCount = reviews.length;
    
    if (reviewCount === 0) {
      return 'No reviews yet';
    }
    
    return `${avgRating} (${reviewCount} review${reviewCount !== 1 ? 's' : ''})`;
  };

  // Image modal handlers
  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
    setImageModalVisible(true);
  };

  const closeImageModal = () => {
    setImageModalVisible(false);
    setSelectedImageIndex(null);
  };

  const navigateToNextImage = () => {
    if (selectedImageIndex !== null && monastery?.images) {
      setSelectedImageIndex((selectedImageIndex + 1) % monastery.images.length);
    }
  };

  const navigateToPreviousImage = () => {
    if (selectedImageIndex !== null && monastery?.images) {
      setSelectedImageIndex(
        selectedImageIndex === 0 ? monastery.images.length - 1 : selectedImageIndex - 1
      );
    }
  };

  const renderImageModal = () => {
    if (!monastery?.images || selectedImageIndex === null) return null;

    return (
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
        statusBarTranslucent={true}
      >
        <BlurView 
          style={Monstyles.imageModalContainer}
          intensity={80}
          tint="dark"
        >
          <TouchableOpacity 
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={closeImageModal}
          />
          <StatusBar hidden />
          <TouchableOpacity
            style={Monstyles.imageModalCloseButton}
            onPress={closeImageModal}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={Monstyles.imageModalContent}>
            <Image
              source={{ uri: monastery.images[selectedImageIndex] }}
              style={[Monstyles.modalImage, { width: screenWidth * 0.95, height: screenHeight * 0.8 }]}
              resizeMode="contain"
            />
          </View>

          {monastery.images.length > 1 && (
            <>
              <TouchableOpacity
                style={[Monstyles.imageNavButton, Monstyles.imageNavButtonLeft]}
                onPress={navigateToPreviousImage}
              >
                <ChevronLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[Monstyles.imageNavButton, Monstyles.imageNavButtonRight]}
                onPress={navigateToNextImage}
              >
                <ChevronRight size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </>
          )}

          <View style={Monstyles.imageCounter}>
            <Text style={Monstyles.imageCounterText}>
              {selectedImageIndex + 1} / {monastery.images.length}
            </Text>
          </View>
        </BlurView>
      </Modal>
    );
  };

  // Utility functions
  const navigateToBooking = () => {
    if (!monastery) return;
    
    router.push({
      pathname: '/booking',
      params: { 
        monasteryId: monastery.id, 
        monasteryName: monastery.name 
      }
    } as any);
  };

  const navigateToJournal = () => {
    if (!monastery) return;
    
    router.push({
      pathname: '/journal/create',
      params: { monasteryId: monastery.id }
    } as any);
  };

  const renderStars = (rating: number, size: number = 16) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={size}
        color={index < rating ? '#F59E0B' : '#E5E7EB'}
        fill={index < rating ? '#F59E0B' : 'transparent'}
      />
    ));
  };

  // Handle tab scrolling
  const handleTabScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const tabIndex = Math.round(scrollX / screenWidth);
    
    if (tabIndex !== activeTabIndex && tabIndex >= 0 && tabIndex < tabs.length) {
      setActiveTabIndex(tabIndex);
      setActiveTab(tabs[tabIndex].key);
    }
  };

  const scrollToTab = (tabKey: string) => {
    const tabIndex = tabs.findIndex(tab => tab.key === tabKey);
    if (tabIndex !== -1) {
      setActiveTab(tabKey);
      setActiveTabIndex(tabIndex);
      tabScrollViewRef.current?.scrollTo({
        x: tabIndex * screenWidth,
        animated: true
      });
    }
  };

  const renderTabButton = (tabKey: string, title: string) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        key={tabKey}
        style={[Monstyles.tabButton, isActive && Monstyles.activeTabButton]}
        onPress={() => scrollToTab(tabKey)}
      >
        <Text style={[Monstyles.tabButtonText, isActive && Monstyles.activeTabButtonText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render functions
  const renderImageGrid = () => {
    const imageSize = (screenWidth - 60) / 2; // 2 columns with spacing
    
    return (
      <FlatList
        data={monastery?.images || []}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          Monstyles.imageGridContainer, 
          { paddingBottom: 120 + insets.bottom }
        ]}
        columnWrapperStyle={Monstyles.imageGridRow}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[Monstyles.imageGridItem, { width: imageSize, height: imageSize }]}
            onPress={() => openImageModal(index)}
          >
            <Image
              source={{ uri: item }}
              style={Monstyles.gridImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
        keyExtractor={(item, index) => `monastery-image-${index}`}
      />
    );
  };

  const renderOverviewContent = () => (
    <View style={Monstyles.tabContent}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
          showsVerticalScrollIndicator={false}
        >
          <Text style={Monstyles.monasteryLocation}>{monastery?.location}</Text>
          <Text style={Monstyles.monasteryEra}>{monastery?.era}</Text>
          <Text style={Monstyles.monasteryDescription}>{monastery?.description}</Text>

          <View style={Monstyles.section}>
            <Text style={Monstyles.sectionTitle}>{t('history')}</Text>
            <Text style={Monstyles.sectionContent}>{monastery?.history}</Text>
          </View>

          <View style={Monstyles.section}>
            <Text style={Monstyles.sectionTitle}>{t('culturalSignificance')}</Text>
            <Text style={Monstyles.sectionContent}>
              {monastery?.cultural_significance}
            </Text>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Section for Overview */}
      <View style={[Monstyles.fixedBottomSection, { paddingBottom: 20 + insets.bottom }]}>
        <View style={Monstyles.buttonRow}>
          <TouchableOpacity
            style={Monstyles.audioGuideButton}
            onPress={() => router.push('/audio-guide')}
          >
            <Volume2 size={16} color="#DF8020" style={{ marginRight: 8 }} />
            <Text style={Monstyles.audioGuideButtonText}>Audio Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={Monstyles.bookVisitButton}
            onPress={navigateToBooking}
          >
            <Text style={Monstyles.bookVisitButtonText}>Book a Visit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderImagesContent = () => (
    <View style={Monstyles.tabContent}>
      <Text style={Monstyles.sectionTitle}>Photo Gallery</Text>
      {renderImageGrid()}
    </View>
  );

  const renderReviewsContent = () => (
    <View style={Monstyles.tabContent}>
      <ReviewsSection 
        monasteryId={id as string} 
        onReviewsUpdated={fetchReviews}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={Monstyles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF8020" />
        <Text style={Monstyles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!monastery) {
    return (
      <View style={Monstyles.errorContainer}>
        <Text style={Monstyles.errorText}>Monastery not found</Text>
        <TouchableOpacity style={Monstyles.backButton} onPress={() => router.back()}>
          <Text style={Monstyles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeScreen>
      <View style={Monstyles.container}>
        {/* Header with back button only */}
        <View style={Monstyles.headerControls}>
          <View style={Monstyles.headerBtnWrapper}>
            <TouchableOpacity style={Monstyles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Image with Text Overlay */}
        <View style={Monstyles.heroContainer}>
          <Image source={{ uri: monastery.images[0] }} style={Monstyles.heroImage} />
          
          {/* 360° Button - Fixed top right */}
          <TouchableOpacity 
            style={Monstyles.hero360Button}
            onPress={() => router.push({ pathname: '/monastery/360view', params: { id } })}
          >
            <Text style={Monstyles.hero360ButtonText}>360°</Text>
          </TouchableOpacity>

          {/* Journal Button - Fixed top right, below 360° */}
          <TouchableOpacity 
            style={Monstyles.heroJournalButton}
            onPress={navigateToJournal}
          >
            <BookOpen size={20} color="#DF8020" />
          </TouchableOpacity>
          
          <View style={Monstyles.heroTextOverlay}>
            <Text style={Monstyles.heroMonasteryName}>{monastery?.name}</Text>
            <View style={Monstyles.starRatingContainer}>
              <View style={Monstyles.starsContainer}>
                {renderStars(Math.round(getAverageRating()), 18)}
              </View>
              <Text style={Monstyles.heroRatingText}>
                {getRatingText()}
              </Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation with Rounded Top */}
        <View style={Monstyles.tabContainerWithRounding}>
          <View style={Monstyles.tabContainer}>
            {renderTabButton('overview', 'Overview')}
            {renderTabButton('images', 'Images')}
            {renderTabButton('reviews', 'Reviews')}
          </View>
        </View>

        {/* Tab Content - Horizontal ScrollView */}
        <ScrollView
          ref={tabScrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleTabScroll}
          style={Monstyles.tabScrollContainer}
        >
          <View style={[Monstyles.tabContentContainer, { width: screenWidth }]}>
            {renderOverviewContent()}
          </View>
          <View style={[Monstyles.tabContentContainer, { width: screenWidth }]}>
            {renderImagesContent()}
          </View>
          <View style={[Monstyles.tabContentContainer, { width: screenWidth }]}>
            {renderReviewsContent()}
          </View>
        </ScrollView>

        {renderImageModal()}
      </View>
    </SafeScreen>
  );
}
