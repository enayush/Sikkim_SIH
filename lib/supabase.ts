import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
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