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
  user_email: string;
  created_at: string;
}

export interface MonasteryReviewWithUser extends MonasteryReview {
  // This interface can now be the same as MonasteryReview since user_email is included
}

// Helper function to process monasteries with nested reviews
const processMonasteriesWithReviews = (data: any[] | null): MonasteryWithRating[] => {
  if (!data) return [];

  return data.map(monastery => {
    // Supabase returns related records as a nested array.
    // We cast to 'any' to handle the dynamic shape before processing.
    const reviews = (monastery.reviews as any[]) || [];
    const ratings = reviews.map(r => r.rating);
    const reviewCount = ratings.length;
    const totalRating = ratings.reduce((acc, rating) => acc + rating, 0);
    const averageRating = reviewCount > 0 ? parseFloat((totalRating / reviewCount).toFixed(1)) : 0;

    // Remove the nested reviews array from the final object for a cleaner structure
    delete monastery.reviews;

    return {
      ...monastery,
      averageRating,
      reviewCount,
    };
  });
};

/**
 * NEW AND EFFICIENT: Fetch a specific list of monasteries with their ratings in a single query.
 * This is ideal for the home screen's carousel and popular sections.
 */
export const getMonasteriesByIdsWithRatings = async (ids: string[]): Promise<MonasteryWithRating[]> => {
  if (!ids || ids.length === 0) {
    return [];
  }
  try {
    const { data, error } = await supabase
      .from('monasteries')
      .select('*, reviews(rating)') // Fetch monasteries and their review ratings in one go
      .in('id', ids);

    if (error) {
      console.error('Error fetching monasteries by IDs:', error);
      throw error;
    }

    return processMonasteriesWithReviews(data);
  } catch (error) {
    console.error('Error in getMonasteriesByIdsWithRatings:', error);
    throw error;
  }
};


/**
 * OPTIMIZED: Get all monasteries with their ratings in a single efficient query.
 * This avoids the N+1 problem of fetching reviews for each monastery separately.
 */
export const getMonasteriesWithRatings = async (): Promise<MonasteryWithRating[]> => {
  try {
    const { data, error } = await supabase
      .from('monasteries')
      .select('*, reviews(rating)')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching monasteries with ratings:', error);
      throw error;
    }

    return processMonasteriesWithReviews(data);
  } catch (error) {
    console.error('Error in getMonasteriesWithRatings:', error);
    throw error;
  }
};

/**
 * OPTIMIZED: Fetch monasteries by region directly from the database.
 * This is far more efficient than fetching all monasteries and filtering them on the client-side.
 */
export const getMonasteriesByRegion = async (region: string, limit: number = 8): Promise<MonasteryWithRating[]> => {
  const regionMapping: Record<string, string> = {
    northern: 'north',
    eastern: 'east',
    southern: 'south',
    western: 'west'
  };

  const locationValue = regionMapping[region.toLowerCase()];
  if (!locationValue) {
    console.warn(`Unknown region: ${region}`);
    return []; // Return empty array for unknown region
  }

  try {
    const { data, error } = await supabase
      .from('monasteries')
      .select('*, reviews(rating)')
      .ilike('location', locationValue) // Use ilike for case-insensitive matching
      .limit(limit);

    if (error) {
      console.error(`Error fetching ${region} monasteries:`, error);
      throw error;
    }

    return processMonasteriesWithReviews(data);
  } catch (error) {
    console.error(`Error in getMonasteriesByRegion for ${region}:`, error);
    throw error;
  }
};


// ----- UNCHANGED FUNCTIONS BELOW -----

/**
 * Fetch all monasteries from Supabase (without rating data)
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
 * Fetch reviews for a monastery with user information
 */
export const getMonasteryReviews = async (monasteryId: string): Promise<MonasteryReviewWithUser[]> => {
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
        user_email: user.email || 'Anonymous User',
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

// Note: getNearbyMonasteries and calculateDistance remain unchanged as they have different logic.
// For production, consider moving the distance calculation to a database function using PostGIS for even better performance.
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
  
export const getNearbyMonasteries = async (
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<Monastery[]> => {
    try {
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
          monastery.latitude,
          monastery.longitude
        );
        return distance <= radiusKm;
      });
  
      // Sort by distance
      return nearbyMonasteries.sort((a, b) => {
        const distanceA = calculateDistance(
          latitude,
          longitude,
          a.latitude,
          a.longitude
        );
        const distanceB = calculateDistance(
          latitude,
          longitude,
          b.latitude,
          b.longitude
        );
        return distanceA - distanceB;
      });
    } catch (error) {
      console.error('Error in getNearbyMonasteries:', error);
      throw error;
    }
  };