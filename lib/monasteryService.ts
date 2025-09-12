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

export interface MonasteryWithRating extends Monastery {
  averageRating: number;
  reviewCount: number;
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

/**
 * Calculate the average rating of a monastery
 */
export const calculateMonasteryAverageRating = async (monasteryId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('monastery_id', monasteryId);

    if (error) {
      console.error('Error fetching reviews for average rating:', error);
      throw error;
    }

    const ratings = data?.map(review => review.rating) || [];
    const total = ratings.reduce((acc, rating) => acc + rating, 0);
    return ratings.length > 0 ? total / ratings.length : 0;
  } catch (error) {
    console.error('Error in calculateMonasteryAverageRating:', error);
    throw error;
  }
};

/**
 * Calculate average rating for a monastery
 */
export const getMonasteryAverageRating = async (monasteryId: string): Promise<{ averageRating: number; reviewCount: number }> => {
  try {
    const reviews = await getMonasteryReviews(monasteryId);
    
    if (reviews.length === 0) {
      return { averageRating: 0, reviewCount: 0 };
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;
    
    return { 
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviews.length 
    };
  } catch (error) {
    console.error('Error calculating average rating:', error);
    return { averageRating: 0, reviewCount: 0 };
  }
};

/**
 * Get all monasteries with their ratings
 */
export const getMonasteriesWithRatings = async (): Promise<MonasteryWithRating[]> => {
  try {
    const monasteries = await getAllMonasteries();
    
    const monasteriesWithRatings = await Promise.all(
      monasteries.map(async (monastery) => {
        const { averageRating, reviewCount } = await getMonasteryAverageRating(monastery.id);
        return {
          ...monastery,
          averageRating,
          reviewCount,
        };
      })
    );
    
    return monasteriesWithRatings;
  } catch (error) {
    console.error('Error fetching monasteries with ratings:', error);
    throw error;
  }
};

/**
 * Fetch monasteries by region based on location keywords
 */
export const getMonasteriesByRegion = async (region: string, limit: number = 8): Promise<MonasteryWithRating[]> => {
  try {
    const allMonasteriesWithRatings = await getMonasteriesWithRatings();
    
    // Map region names to exact location values
    const regionMapping: Record<string, string> = {
      northern: 'north',
      eastern: 'east',
      southern: 'south',
      western: 'west'
    };
    
    const locationValue = regionMapping[region.toLowerCase()];
    
    if (!locationValue) {
      throw new Error(`Unknown region: ${region}`);
    }
    
    // Filter monasteries by exact location match
    const filteredMonasteries = allMonasteriesWithRatings.filter(monastery => {
      return monastery.location.toLowerCase() === locationValue;
    });
    
    // If no monasteries found, return some from the general pool as fallback
    if (filteredMonasteries.length === 0) {
      const startIndex = region === 'northern' ? 0 : region === 'eastern' ? 2 : region === 'southern' ? 4 : 6;
      return allMonasteriesWithRatings.slice(startIndex, startIndex + limit);
    }
    
    return filteredMonasteries.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching ${region} monasteries:`, error);
    throw error;
  }
};
