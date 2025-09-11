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
import { getMonasteryById, getMonasteryReviews, Monastery, MonasteryReview } from '../../lib/monasteryService';
import { useAuth } from '../../contexts/AuthContext';
import Monstyles  from './styles/style';

export default function MonasteryDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [monastery, setMonastery] = useState<Monastery | null>(null);
  const [reviews, setReviews] = useState<MonasteryReview[]>([]);
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
    try {
      const data = await getMonasteryReviews(id as string);
      setReviews(data);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      // Set empty array on error
      setReviews([]);
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
      <ScrollView style={Monstyles.container}>
        <View style={{ position: 'absolute', top: 60, left: 0, right: 0, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 }}>
          <TouchableOpacity style={Monstyles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <TouchableOpacity 
              style={Monstyles.backButton}
              onPress={() => router.push({ pathname: '/monastery/360view', params: { id } })}
            >
              <Text style={{ color: '#DF8020', fontWeight: 'bold' }}>360°</Text>
            </TouchableOpacity>
        </View>

        <Image source={{ uri: monastery.images[0] }} style={Monstyles.heroImage} />

      <View style={Monstyles.content}>
        <Text style={Monstyles.monasteryName}>{monastery.name}</Text>
        <Text style={Monstyles.monasteryLocation}>{monastery.location}</Text>
        <Text style={Monstyles.monasteryEra}>{monastery.era}</Text>
        <Text style={Monstyles.monasteryDescription}>{monastery.description}</Text>

        <View style={Monstyles.section}>
          <Text style={Monstyles.sectionTitle}>{t('history')}</Text>
          <Text style={Monstyles.sectionContent}>{monastery.history}</Text>
        </View>

        <View style={Monstyles.section}>
          <Text style={Monstyles.sectionTitle}>{t('culturalSignificance')}</Text>
          <Text style={Monstyles.sectionContent}>
            {monastery.cultural_significance}
          </Text>
        </View>

        <View style={Monstyles.section}>
          <View style={Monstyles.reviewsHeader}>
            <Text style={Monstyles.sectionTitle}>{t('reviews')}</Text>
            {user && (
              <TouchableOpacity
                style={Monstyles.writeReviewButton}
                onPress={() => setShowReviewForm(!showReviewForm)}
              >
                <MessageCircle size={16} color="#DF8020" />
                <Text style={Monstyles.writeReviewText}>{t('writeReview')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {showReviewForm && (
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
        </View>
      </View>
      <View style={Monstyles.footer}>
        <TouchableOpacity
          style={Monstyles.bookVisitButton}
          onPress={() => router.push('/donations-bookings/booking')}
        >
          <Text style={Monstyles.bookVisitButtonText}>Book a Visit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
