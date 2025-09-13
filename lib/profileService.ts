import { supabase } from './supabase';

export interface Profile {
  id: string;
  username: string;
  updated_at: string;
}

export const profileService = {
  // Get user profile
  async getProfile(userId: string): Promise<{ profile: Profile | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return { profile: null, error };
      }

      return { profile: data, error: null };
    } catch (error) {
      console.error('Profile fetch error:', error);
      return { profile: null, error };
    }
  },

  // Update username
  async updateUsername(userId: string, newUsername: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', userId);

      if (error) {
        console.error('Error updating username:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Username update error:', error);
      return { success: false, error };
    }
  },

  // Check if username is available
  async checkUsernameAvailability(username: string): Promise<{ available: boolean; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (error && error.code === 'PGRST116') {
        // No rows found, username is available
        return { available: true, error: null };
      }

      if (error) {
        console.error('Error checking username:', error);
        return { available: false, error };
      }

      // Username exists
      return { available: false, error: null };
    } catch (error) {
      console.error('Username check error:', error);
      return { available: false, error };
    }
  },

  // Create profile (usually called by trigger, but useful for manual creation)
  async createProfile(userId: string, username: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .insert({ id: userId, username });

      if (error) {
        console.error('Error creating profile:', error);
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (error) {
      console.error('Profile creation error:', error);
      return { success: false, error };
    }
  }
};
