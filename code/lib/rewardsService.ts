import { supabase } from '../lib/supabase';

export async function getUserPointsAndRewards(userId: string) {
  // Fetch bookings and monasteries visited for the user
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('id, monastery_id')
    .eq('user_id', userId);

  if (bookingsError || !bookings) {
    return { points: 0, visitedMonasteries: [], bookings: [], error: bookingsError };
  }

  // Get unique visited monasteries from bookings
  const monasteryIds = Array.from(new Set(bookings.map((b: any) => b.monastery_id)));
  // Calculate points
  const bookingPoints = bookings.length * 20;
  const visitPoints = monasteryIds.length * 50;
  const points = bookingPoints + visitPoints;

  return {
    points,
    visitedMonasteries: monasteryIds,
    bookings: bookings.map((b: any) => b.id),
    error: null,
  };
}
