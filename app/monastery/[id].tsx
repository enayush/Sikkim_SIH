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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, MessageCircle, Send } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { mockMonasteries, mockReviews } from '../../lib/mockData';
import { useAuth } from '../../contexts/AuthContext';

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

type Review = {
  id: string;
  monastery_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
};

export default function MonasteryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchMonasteryDetails();
    fetchReviews();
  }, [id]);

  const fetchMonasteryDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('monasteries')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        // Fallback to mock data
        const mockMonastery = mockMonasteries.find((m) => m.id === id);
        if (mockMonastery) {
          setMonastery(mockMonastery);
        }
      } else {
        setMonastery(data);
      }
    } catch (error) {
      console.error('Error fetching monastery:', error);
      const mockMonastery = mockMonasteries.find((m) => m.id === id);
      if (mockMonastery) {
        setMonastery(mockMonastery);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('monastery_id', id)
        .order('created_at', { ascending: false });

      if (error || !data || data.length === 0) {
        // Fallback to mock data
        const mockReviewsForMonastery = mockReviews.filter(
          (r) => r.monastery_id === id
        );
        setReviews(mockReviewsForMonastery);
      } else {
        setReviews(data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      const mockReviewsForMonastery = mockReviews.filter(
        (r) => r.monastery_id === id
      );
      setReviews(mockReviewsForMonastery);
    }
  };

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

      if (error) {
        Alert.alert('Error', 'Failed to submit review');
      } else {
        Alert.alert('Success', 'Review submitted successfully!');
        setNewComment('');
        setNewRating(5);
        setShowReviewForm(false);
        fetchReviews();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to submit review');
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
      <View style={styles.ratingSelector}>
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#DF8020" />
        <Text style={styles.loadingText}>{t('loading')}</Text>
      </View>
    );
  }

  if (!monastery) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Monastery not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <Image source={{ uri: monastery.images[0] }} style={styles.heroImage} />

      <View style={styles.content}>
        <Text style={styles.monasteryName}>{monastery.name}</Text>
        <Text style={styles.monasteryLocation}>{monastery.location}</Text>
        <Text style={styles.monasteryEra}>{monastery.era}</Text>
        <Text style={styles.monasteryDescription}>{monastery.description}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('history')}</Text>
          <Text style={styles.sectionContent}>{monastery.history}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('culturalSignificance')}</Text>
          <Text style={styles.sectionContent}>
            {monastery.cultural_significance}
          </Text>
        </View>

        <View style={styles.section}>
          <View style={styles.reviewsHeader}>
            <Text style={styles.sectionTitle}>{t('reviews')}</Text>
            {user && (
              <TouchableOpacity
                style={styles.writeReviewButton}
                onPress={() => setShowReviewForm(!showReviewForm)}
              >
                <MessageCircle size={16} color="#DF8020" />
                <Text style={styles.writeReviewText}>{t('writeReview')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {showReviewForm && (
            <View style={styles.reviewForm}>
              <Text style={styles.formLabel}>{t('rating')}</Text>
              {renderRatingSelector()}
              
              <Text style={styles.formLabel}>{t('comment')}</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Share your experience..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowReviewForm(false)}
                >
                  <Text style={styles.cancelButtonText}>{t('cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    submittingReview && styles.submitButtonDisabled,
                  ]}
                  onPress={submitReview}
                  disabled={submittingReview}
                >
                  <Send size={16} color="#FFFFFF" />
                  <Text style={styles.submitButtonText}>
                    {submittingReview ? t('loading') : t('submit')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {reviews.length > 0 ? (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewRating}>
                    {renderStars(review.rating)}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))
          ) : (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>
                No reviews yet. Be the first to share your experience!
              </Text>
            </View>
          )}
        </View>
      </View>
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.bookVisitButton}
          onPress={() => router.push('/donations-bookings/booking')}
        >
          <Text style={styles.bookVisitButtonText}>Book a Visit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
  },
  header: {
    position: 'absolute',
    top: 60,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  bookVisitButton: {
    backgroundColor: '#DF8020',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  bookVisitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButtonText: {
    fontSize: 16,
    color: '#DF8020',
    fontWeight: '600',
  },
  heroImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 20,
  },
  monasteryName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  monasteryLocation: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 4,
  },
  monasteryEra: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
    marginBottom: 16,
  },
  monasteryDescription: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  reviewsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  writeReviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#EBF4FF',
    borderRadius: 8,
    gap: 6,
  },
  writeReviewText: {
    fontSize: 14,
    color: '#DF8020',
    fontWeight: '600',
  },
  reviewForm: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  ratingSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#DF8020',
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewComment: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  noReviews: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});