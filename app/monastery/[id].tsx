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
      const data = await getMonasteryReviews(id as string);
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

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
