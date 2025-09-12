import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
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
import { ArrowLeft, Star, MessageCircle, Send, X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { getMonasteryById, getMonasteryReviews, Monastery, MonasteryReview } from '../../lib/monasteryService';
import { useAuth } from '../../contexts/AuthContext';
import Monstyles from './styles/style';
import SafeScreen from '../../components/SafeScreen';

export default function MonasteryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // State management
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [reviews, setReviews] = useState<MonasteryReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  // Screen dimensions
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

  // Import events data directly
  const eventsData = require('../data/sikkim_monastery_calendar_with_coords (1).json');

  // Function to get monastery details from event ID
  const getMonasteryFromEvent = (eventId: string) => {
    try {
      return eventsData.find((e: any) => e.id && e.id.toString() === eventId) || null;
    } catch (error) {
      console.error('Error finding event:', error);
      return null;
    }
  };

  const fetchMonasteryDetails = async () => {
    if (!id) {
      setLoading(false);
      return;
    }
    
    try {
      // First check if the ID is a valid UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id as string);
      
      if (isUuid) {
        // If it's a UUID, fetch directly
        const { data, error } = await supabase
          .from('monasteries')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error) throw error;
        setMonastery(data);
      } else {
        // If not a UUID, try to get the event data
        const eventData = await getMonasteryFromEvent(id as string);
        
        if (eventData && eventData.monastery) {
          // If it's an event, find the monastery by name
          const { data, error } = await supabase
            .from('monasteries')
            .select('*')
            .ilike('name', `%${eventData.monastery}%`)
            .maybeSingle();
            
          if (error) throw error;
          if (data) {
            setMonastery(data);
          } else {
            // If no monastery found by name, create a minimal monastery object from event data
            const now = new Date().toISOString();
            const minimalMonastery: Monastery = {
              id: id as string,
              name: eventData.monastery || 'Unknown Monastery',
              location: eventData.latitude && eventData.longitude 
                ? `${eventData.latitude},${eventData.longitude}`
                : '',
              description: eventData.description || '',
              era: '',
              history: '',
              cultural_significance: '',
              latitude: eventData.latitude || 0,
              longitude: eventData.longitude || 0,
              images: [],
              created_at: now
            };
            setMonastery(minimalMonastery);
          }
        } else {
          // If not an event, try to fetch by name as a last resort
          const { data, error } = await supabase
            .from('monasteries')
            .select('*')
            .ilike('name', `%${id}%`)
            .maybeSingle();
            
          if (error) throw error;
          if (data) {
            setMonastery(data);
          } else {
            // If no monastery found at all, set to null to show not found state
            setMonastery(null);
          }
        }
      }
    } catch (error) {
      console.error('Error loading monastery:', error);
      setMonastery(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    if (!monastery) return;
    
    try {
      let query = supabase
        .from('reviews')
        .select('*');
      
      // Try to match by monastery_id first if it's a UUID
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(monastery.id)) {
        query = query.eq('monastery_id', monastery.id);
      } else {
        // Fall back to name matching if ID is not a UUID
        query = query.eq('monastery_name', monastery.name);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchMonasteryDetails();
    };
    
    loadData();
  }, [id]);

  useEffect(() => {
    if (monastery) {
      fetchReviews();
    }
  }, [monastery]);

  // Review submission
  const submitReview = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to submit a review');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please enter a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        monastery_id: id as string,
        user_id: user.id,
        rating: newRating,
        comment: newComment.trim(),
      });

      if (error) throw error;

      Alert.alert('Success', 'Review submitted successfully!');
      setNewComment('');
      setNewRating(5);
      setShowReviewForm(false);
      await fetchReviews();
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
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
  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
    return sum / reviews.length;
  };

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

  const renderRatingSelector = () => {
    return (
      <View style={Monstyles.ratingSelector}>
        {Array.from({ length: 5 }, (_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => setNewRating(index + 1)}
          >
            <Star
              size={32}
              color={index < newRating ? '#F59E0B' : '#E5E7EB'}
              fill={index < newRating ? '#F59E0B' : 'transparent'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderTabButton = (tabKey: string, title: string) => {
    const isActive = activeTab === tabKey;
    return (
      <TouchableOpacity
        key={tabKey}
        style={[Monstyles.tabButton, isActive && Monstyles.activeTabButton]}
        onPress={() => setActiveTab(tabKey)}
      >
        <Text style={[Monstyles.tabButtonText, isActive && Monstyles.activeTabButtonText]}>
          {title}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderStarRating = (rating: number, size = 20) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star
            key={i}
            size={size}
            fill="#FFD700"
            color="#FFD700"
          />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <View key={i} style={{ position: 'relative' }}>
            <Star size={size} color="#E0E0E0" fill="#E0E0E0" />
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', overflow: 'hidden' }}>
              <Star size={size} color="#FFD700" fill="#FFD700" />
            </View>
          </View>
        );
      } else {
        stars.push(
          <Star
            key={i}
            size={size}
            color="#E0E0E0"
            fill="#E0E0E0"
          />
        );
      }
    }

    return (
      <View style={Monstyles.starRatingContainer}>
        <View style={Monstyles.starsContainer}>
          {stars}
        </View>
        <Text style={Monstyles.ratingText}>
          {rating.toFixed(1)} ({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})
        </Text>
      </View>
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
        contentContainerStyle={Monstyles.imageGridContainer}
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
    <ScrollView style={Monstyles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={Monstyles.monasteryName}>{monastery?.name}</Text>
      {renderStarRating(calculateAverageRating())}
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
      <View style={{ height: 100 }} />
    </ScrollView>
  );

  const renderImagesContent = () => (
    <View style={Monstyles.tabContent}>
      <Text style={Monstyles.sectionTitle}>Photo Gallery</Text>
      {renderImageGrid()}
    </View>
  );

  const renderReviewsContent = () => (
    <View style={Monstyles.tabContent}>
      <Text style={Monstyles.sectionTitle}>{t('reviews')}</Text>
      
      <ScrollView style={Monstyles.reviewsList} showsVerticalScrollIndicator={false}>
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <View key={review.id} style={Monstyles.reviewCard}>
              <View style={Monstyles.reviewHeader}>
                <View style={Monstyles.reviewRating}>
                  {renderStars(review.rating)}
                </View>
                <Text style={Monstyles.reviewDate}>
                  {new Date(review.created_at).toLocaleDateString()}
                </Text>
              </View>
              <Text style={Monstyles.reviewComment}>{review.comment}</Text>
            </View>
          ))
        ) : (
          <View style={Monstyles.noReviews}>
            <Text style={Monstyles.noReviewsText}>
              No reviews yet. Be the first to share your experience!
            </Text>
          </View>
        )}
        <View style={{ height: 150 }} />
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <SafeScreen>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <ActivityIndicator size="large" color="#0000ff" />
          <Text style={{ marginTop: 10 }}>Loading monastery details...</Text>
        </View>
      </SafeScreen>
    );
  }

  if (!monastery) {
    return (
      <SafeScreen>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 20,
        }}>
          <Text style={{ fontSize: 18, textAlign: 'center' }}>
            Monastery not found. The event might be associated with a monastery that is no longer listed.
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()} 
            style={{
              backgroundColor: '#3b82f6',
              padding: 12,
              borderRadius: 8,
              marginTop: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <View style={Monstyles.container}>
        {/* Header with back button and 360 button */}
        <View style={Monstyles.headerControls}>
          <View style={Monstyles.headerBtnWrapper}>
            <TouchableOpacity style={Monstyles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <View style={Monstyles.headerBtnWrapperRight}>
            <TouchableOpacity 
              style={Monstyles.circleButton}
              onPress={() => router.push({ pathname: '/monastery/360view', params: { id } })}
            >
              <Text style={{ color: '#DF8020', fontWeight: 'bold', fontSize: 16 }}>360°</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Image */}
        <Image source={{ uri: monastery.images[0] }} style={Monstyles.heroImage} />

        {/* Tab Navigation */}
        <View style={Monstyles.tabContainer}>
          {renderTabButton('overview', 'Overview')}
          {renderTabButton('images', 'Images')}
          {renderTabButton('reviews', 'Reviews')}
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && renderOverviewContent()}
        {activeTab === 'images' && renderImagesContent()}
        {activeTab === 'reviews' && renderReviewsContent()}

        {/* Fixed Bottom Section */}
        {activeTab === 'overview' && (
          <View style={Monstyles.fixedBottomSection}>
            <TouchableOpacity
              style={Monstyles.bookVisitButton}
              onPress={navigateToBooking}
            >
              <Text style={Monstyles.bookVisitButtonText}>Book a Visit</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Write Review Section - Fixed at bottom for Reviews tab */}
        {activeTab === 'reviews' && (
          <View style={Monstyles.fixedBottomSection}>
            {!showReviewForm ? (
              <TouchableOpacity
                style={Monstyles.bookVisitButton}
                onPress={() => {
                  if (!user) {
                    Alert.alert('Error', 'Please login to write a review');
                    return;
                  }
                  setShowReviewForm(true);
                }}
              >
                <MessageCircle size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={Monstyles.bookVisitButtonText}>Write a Review</Text>
              </TouchableOpacity>
            ) : (
              <View style={Monstyles.reviewForm}>
                <Text style={Monstyles.formLabel}>{t('rating')}</Text>
                {renderRatingSelector()}
                
                <Text style={Monstyles.formLabel}>{t('comment')}</Text>
                <TextInput
                  style={Monstyles.commentInput}
                  placeholder="Share your experience..."
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                
                <View style={Monstyles.formButtons}>
                  <TouchableOpacity
                    style={Monstyles.cancelButton}
                    onPress={() => setShowReviewForm(false)}
                  >
                    <Text style={Monstyles.cancelButtonText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      Monstyles.submitButton,
                      submittingReview && Monstyles.submitButtonDisabled,
                    ]}
                    onPress={submitReview}
                    disabled={submittingReview}
                  >
                    <Send size={16} color="#FFFFFF" />
                    <Text style={Monstyles.submitButtonText}>
                      {submittingReview ? t('loading') : t('submit')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}

        {renderImageModal()}
      </View>
    </SafeScreen>
  );
}
