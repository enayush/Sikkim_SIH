import { supabase } from './supabase';

export interface Booking {
  id: string;
  monastery_id: string;
  user_id: string;
  email: string;
  phone: string;
  number_of_people: number;
  visit_date: string;
  special_requests: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface BookingInsert {
  monastery_id: string;
  user_id: string;
  email: string;
  phone: string;
  number_of_people: number;
  visit_date: string;
  special_requests?: string | null;
  status?: 'pending' | 'confirmed' | 'cancelled';
}

/**
 * Create a new booking
 */
export const createBooking = async (bookingData: BookingInsert): Promise<Booking> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .single();

    if (error) {
      console.error('Error creating booking:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in createBooking:', error);
    throw error;
  }
};

/**
 * Get all bookings for a user
 */
export const getUserBookings = async (userId: string): Promise<Booking[]> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        monasteries (
          name,
          location,
          images
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user bookings:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserBookings:', error);
    throw error;
  }
};

/**
 * Update a booking
 */
export const updateBooking = async (
  bookingId: string,
  updates: Partial<BookingInsert>
): Promise<Booking> => {
  try {
    const { data, error } = await supabase
      .from('bookings')
      .update(updates)
      .eq('id', bookingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateBooking:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (bookingId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in cancelBooking:', error);
    throw error;
  }
};
