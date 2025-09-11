import 'dotenv/config';

// Import your existing app.json configuration
const appConfig = require('./app.json');

export default ({ config }) => ({
  ...appConfig.expo, // Use all your existing app.json config
  extra: {
    ...appConfig.expo.extra, // Keep any existing extra config
    // Add only the environment variables you need
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
  },
  // Override Google Maps configuration from environment
  android: {
    ...appConfig.expo.android,
    config: {
      ...appConfig.expo.android?.config,
      googleMaps: {
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
  ios: {
    ...appConfig.expo.ios,
  },
});
