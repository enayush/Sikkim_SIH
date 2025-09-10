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
          rating: number;
          comment: string;
          created_at: string;
        };
        Insert: {
          monastery_id: string;
          user_id: string;
          rating: number;
          comment: string;
        };
      };
    };
  };
};