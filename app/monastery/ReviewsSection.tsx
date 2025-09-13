import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, MessageCircle, Send, User } from 'lucide-react-native';
import { getMonasteryReviews, addMonasteryReview, MonasteryReviewWithUser } from '../../lib/monasteryService';
import { useAuth } from '../../contexts/AuthContext';
import { profileService } from '../../lib/profileService';
import Monstyles from './styles/style';

interface ReviewsSectionProps {
  monasteryId: string;
  onReviewsUpdated?: () => void;
}

export default function ReviewsSection({ monasteryId, onReviewsUpdated }: ReviewsSectionProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [reviews, setReviews] = useState<MonasteryReviewWithUser[]>([]);
  const [usernames, setUsernames] = useState<{[userId: string]: string}>({});
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    fetchReviews();
  }, [monasteryId]);

  // Keyboard listeners for better UX
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardVisible(true);
      setKeyboardHeight(event.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, []);

  const fetchUsernames = async (reviewData: MonasteryReviewWithUser[]) => {
    try {
      const usernameMap: {[userId: string]: string} = {};
      
      // Get unique user IDs from reviews
      const userIds = [...new Set(reviewData.map(review => review.user_id))];
      
      // Fetch usernames for each user
      for (const userId of userIds) {
        try {
          const { profile } = await profileService.getProfile(userId);
          if (profile?.username) {
            usernameMap[userId] = profile.username;
          }
        } catch (error) {
          console.error(`Error fetching username for user ${userId}:`, error);
          // Keep the email as fallback
        }
      }
      
      setUsernames(usernameMap);
    } catch (error) {
      console.error('Error fetching usernames:', error);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await getMonasteryReviews(monasteryId);
      setReviews(data || []);
      
      // Fetch usernames for the reviews
      if (data && data.length > 0) {
        await fetchUsernames(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    }
  };

  const submitReview = async () => {
    if (!user) {
      Alert.alert('Error', 'Please login to write a review');
      return;
    }

    if (!newComment.trim()) {
      Alert.alert('Error', 'Please write a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await addMonasteryReview(monasteryId, newRating, newComment.trim());
      
      // Reset form
      setNewComment('');
      setNewRating(5);
      setShowReviewForm(false);
      
      // Refresh reviews and usernames
      await fetchReviews();
      
      // Notify parent component
      if (onReviewsUpdated) {
        onReviewsUpdated();
      }
      
      Alert.alert('Success', 'Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
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

  const getInitials = (username: string) => {
    if (!username || username === 'Anonymous User') return 'A';
    
    // Get the first letter of the username
    return username.charAt(0).toUpperCase();
  };

  const getDisplayName = (review: MonasteryReviewWithUser) => {
    // Try to get username first, fallback to email
    const username = usernames[review.user_id];
    if (username) {
      return username;
    }
    
    // Fallback to email (for backward compatibility)
    return review.user_email || 'Anonymous User';
  };

  const renderReviewCard = (review: MonasteryReviewWithUser) => {
    const displayName = getDisplayName(review);
    const isUsername = usernames[review.user_id];
    
    return (
      <View key={review.id} style={Monstyles.reviewCard}>
        <View style={Monstyles.reviewHeader}>
          <View style={Monstyles.reviewUserInfo}>
            <View style={Monstyles.profileIcon}>
              {displayName && displayName !== 'Anonymous User' ? (
                <Text style={Monstyles.profileIconText}>
                  {getInitials(displayName)}
                </Text>
              ) : (
                <User size={20} color="#FFFFFF" />
              )}
            </View>
            <View style={Monstyles.reviewUserDetails}>
              <Text style={Monstyles.reviewUserEmail}>
                {displayName}
              </Text>
              <View style={Monstyles.reviewRating}>
                {renderStars(review.rating, 14)}
              </View>
            </View>
          </View>
          <Text style={Monstyles.reviewDate}>
            {new Date(review.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Text style={Monstyles.reviewComment}>{review.comment}</Text>
      </View>
    );
  };

  return (
    <View style={Monstyles.reviewsContainer}>
      <View style={{ flex: 1 }}>
        <Text style={Monstyles.sectionTitle}>{t('reviews')}</Text>
        
        <FlatList
          data={reviews}
          keyExtractor={(item: MonasteryReviewWithUser) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 120 + insets.bottom 
          }}
          renderItem={({ item }: { item: MonasteryReviewWithUser }) => renderReviewCard(item)}
          ListEmptyComponent={() => (
            <View style={Monstyles.noReviews}>
              <Text style={Monstyles.noReviewsText}>
                No reviews yet. Be the first to share your experience!
              </Text>
            </View>
          )}
        />
      </View>

      {/* Fixed Bottom Section - Button or Form */}
      <View style={[
        Monstyles.fixedBottomSection,
        { 
          paddingBottom: keyboardVisible ? 10 : 20 + insets.bottom,
          transform: keyboardVisible && showReviewForm ? [{ translateY: -keyboardHeight }] : [{ translateY: 0 }],
        },
      ]}>
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
          <View style={[Monstyles.reviewForm, { marginHorizontal: 0 }]}>
            <Text style={Monstyles.formLabel}>{t('rating')}</Text>
            {renderRatingSelector()}
            
            <Text style={Monstyles.formLabel}>{t('comment')}</Text>
            <TextInput
              style={Monstyles.commentInput}
              placeholder="Share your experience..."
              value={newComment}
              onChangeText={setNewComment}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              returnKeyType="done"
              blurOnSubmit={true}
            />
            
            <View style={Monstyles.formButtons}>
              <TouchableOpacity
                style={Monstyles.cancelButton}
                onPress={() => {
                  setShowReviewForm(false);
                  Keyboard.dismiss();
                }}
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
    </View>
  );
}
