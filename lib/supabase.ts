import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV_CONFIG } from './envConfig';

// Use centralized environment configuration
const supabaseUrl = ENV_CONFIG.SUPABASE.URL;
const supabaseKey = ENV_CONFIG.SUPABASE.ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase configuration missing. Please check your environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'sacred-sikkim-app',
    },
  },
});

export type Database = {
  public: {
    Tables: {
      monasteries: {
        Row: {
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
      };
      reviews: {
        Row: {
          id: string;
          monastery_id: string;
          user_id: string;
          user_email: string;
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          monastery_id: string;
          user_id: string;
          user_email?: string;
          rating: number;
          comment: string;
        };
        Update: {
          rating?: number;
          comment?: string;
          user_email?: string;
        };
      };
      bookings: {
        Row: {
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
        };
        Insert: {
          monastery_id: string;
          user_id: string;
          email: string;
          phone: string;
          number_of_people: number;
          visit_date: string;
          special_requests?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled';
        };
        Update: {
          phone?: string;
          number_of_people?: number;
          visit_date?: string;
          special_requests?: string | null;
          status?: 'pending' | 'confirmed' | 'cancelled';
        };
      };
      events: {
        Row: {
          id: string;
          monastery_id: string;
          monastery_name: string;
          event_name: string;
          date_start: string;
          date_end: string | null;
          description: string | null;
          created_at: string;
        };
        Insert: {
          monastery_id: string;
          monastery_name: string;
          event_name: string;
          date_start: string;
          date_end?: string | null;
          description?: string | null;
        };
        Update: {
          monastery_id?: string;
          monastery_name?: string;
          event_name?: string;
          date_start?: string;
          date_end?: string | null;
          description?: string | null;
        };
      };
    };
  };
};