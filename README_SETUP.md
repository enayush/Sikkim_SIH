# Sacred Sikkim
## Major Features
1. **Interactive Maps & Location Services**
Interactive map with monastery markers, GPS tracking, 360° Street View integration, and location-based search functionality.

2. **Comprehensive Monastery Database**
Detailed information about 50+ monasteries with photo galleries, historical context, regional organization, and advanced search filters.

3. **Smart Booking & Visit Planning**
Complete visit scheduling system with date selection, group management, booking history, email confirmations, and cancellation features.

4. **Digital Cultural Archive & Audio Guides**
Audio-guided tours, cultural calendar, historical documents, sacred music collections, and educational Buddhist content.

5. **Community & Gamification Features**
User reviews, explorer badges, community challenges, donation platform, and progress tracking for monastery visits.

6. **AI-Powered Multilingual Experience**
Smart chatbot assistance, personalized recommendations, support for English/Hindi/Nepali, and offline capabilities.


## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Edit `.env` file with your API keys:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

3. **Start Expo for Testing**
   ```bash
   npx expo start
   ```

## How to build APK 

### Method 1: Using EAS Build (Recommended)
```bash
# Install EAS CLI if you haven't already
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Build APK
eas build --platform android --profile preview
```

### Method 2: Local Build
```bash
# Prebuild to generate native code
npx expo prebuild --clean

# Build APK using Gradle
cd android
./gradlew assembleRelease

# APK will be generated at: android/app/build/outputs/apk/release/app-release.apk
```

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API (for web)
3. Create an API key and add it to your `.env` file
4. **Important:** Set up API restrictions and quotas to control costs

That's it! Your monastery app is ready to go. 
