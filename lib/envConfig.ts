import Constants from 'expo-constants';

/**
 * Simple environment configuration
 */
export const ENV_CONFIG = {
  // Supabase Configuration
  SUPABASE: {
    URL: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_URL || '',
    ANON_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Google Maps Configuration
  GOOGLE_MAPS: {
    API_KEY: Constants.expoConfig?.extra?.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  },
  
  // Development flag
  IS_DEV: __DEV__,
} as const;

/**
 * Simple validation utility
 */
export const validateEnvironment = () => {
  const hasSupabase = ENV_CONFIG.SUPABASE.URL && ENV_CONFIG.SUPABASE.ANON_KEY;
  const hasMaps = ENV_CONFIG.GOOGLE_MAPS.API_KEY;
  
  if (ENV_CONFIG.IS_DEV && (!hasSupabase || !hasMaps)) {
    console.warn('⚠️ Some environment variables are missing. Check your .env file.');
  }
  
  return hasSupabase && hasMaps;
};
