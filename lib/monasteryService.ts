import { supabase } from './supabase';

export interface Monastery {
  id: string;
  name: string;
  location: string;
  era: string;
  description: string;
  history: string;
  cultural_significance: string;
  images: string[];
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface MonasteryReview {
  id: string;
  monastery_id: string;
  user_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

/**
 * Fetch all monasteries from Supabase
 */
export const getAllMonasteries = async (): Promise<Monastery[]> => {
  try {
    const { data, error } = await supabase
      .from('monasteries')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching monasteries:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllMonasteries:', error);
    throw error;
  }
};

/**
 * Fetch monasteries near a specific location
 */
export const getNearbyMonasteries = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 50
): Promise<Monastery[]> => {
  try {
    // Note: This is a simple implementation. For production, you might want to use PostGIS
    // or implement proper geographical distance calculations in Supabase
    const { data, error } = await supabase
      .from('monasteries')
      .select('*')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Error fetching nearby monasteries:', error);
      throw error;
    }

    if (!data) return [];

    // Calculate distance and filter
    const nearbyMonasteries = data.filter((monastery) => {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(monastery.latitude.toString()),
        parseFloat(monastery.longitude.toString())
      );
      return distance <= radiusKm;
    });

    // Sort by distance
    return nearbyMonasteries.sort((a, b) => {
      const distanceA = calculateDistance(
        latitude,
        longitude,
        parseFloat(a.latitude.toString()),
        parseFloat(a.longitude.toString())
      );
      const distanceB = calculateDistance(
        latitude,
        longitude,
        parseFloat(b.latitude.toString()),
        parseFloat(b.longitude.toString())
      );
      return distanceA - distanceB;
    });
  } catch (error) {
    console.error('Error in getNearbyMonasteries:', error);
    throw error;
  }
};

/**
 * Fetch a single monastery by ID
 */
export const getMonasteryById = async (id: string): Promise<Monastery | null> => {
  try {
    const { data, error } = await supabase
      .from('monasteries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching monastery:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in getMonasteryById:', error);
    throw error;
  }
};

/**
 * Fetch reviews for a monastery
 */
export const getMonasteryReviews = async (monasteryId: string): Promise<MonasteryReview[]> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('monastery_id', monasteryId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getMonasteryReviews:', error);
    throw error;
  }
};

/**
 * Add a review for a monastery
 */
export const addMonasteryReview = async (
  monasteryId: string,
  rating: number,
  comment: string
): Promise<MonasteryReview> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to add a review');
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        monastery_id: monasteryId,
        user_id: user.id,
        rating,
        comment,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding review:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addMonasteryReview:', error);
    throw error;
  }
};

/**
 * Calculate distance between two coordinates (in kilometers)
 */
const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
