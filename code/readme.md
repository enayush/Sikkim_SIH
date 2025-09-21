# Sacred Sikkim

## Tasks Accomplished

- [x] **Task 1:** Designed and implemented an interactive map with monastery markers, GPS tracking, and 360° Street View integration.
- [x] **Task 2:** Developed a comprehensive monastery database with detailed information, photo galleries, and advanced search filters.
- [x] **Task 3:** Built a smart booking system for visit planning, including group management, booking history, and email confirmations.
- [x] **Task 4:** Integrated a digital cultural archive with audio-guided tours, historical documents, and sacred music collections.
- [x] **Task 5:** Added community and gamification features like user reviews, explorer badges, and donation platforms.
- [x] **Task 6:** Implemented an AI-powered chatbot for multilingual support and personalized recommendations.

---

## Technology Stack

This project leverages the following technologies:

- **[React Native](https://reactnative.dev/):** Used for building a cross-platform mobile application with a seamless user experience.
- **[Expo](https://expo.dev/):** Simplified development, testing, and deployment of the app.
- **[Supabase](https://supabase.com/):** Backend-as-a-Service for database management and user authentication.
- **[Google Maps API](https://developers.google.com/maps):** Enabled interactive maps, monastery markers, and location-based services.
- **[Lucide Icons](https://lucide.dev/):** Provided a modern and consistent icon set for the app.
- **[i18n](https://www.i18next.com/):** Added multilingual support for English, Hindi, and Nepali.

---

## Key Features

- **Interactive Maps & Location Services:** Explore monasteries with GPS tracking, 360° Street View, and location-based search.
- **Comprehensive Monastery Database:** Access detailed information about 100+ monasteries, including history and photo galleries.
- **Smart Booking System:** Plan visits with group management, booking history, and email confirmations.
- **Digital Cultural Archive:** Discover audio-guided tours, historical documents, and sacred music collections.
- **Community Features:** Engage with user reviews, earn explorer badges, and participate in community challenges.
- **AI-Powered Chatbot:** Get personalized recommendations and multilingual support.

---

## Local Setup Instructions

Follow these steps to run the project locally:

### **Same for Windows and macOS**

1. **Clone the Repository**
   ```bash
   git clone https://github.com/enayush/Sikkim_SIH.git
   cd code
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up Environment Variables**
   - Create a `.env` file in the root directory and add the following:
     ```env
     EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
     EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
     EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
     ```

4. **Start the Development Server**
   ```bash
   npx expo start
   ```

5. **Run on Emulator or Device**
   - Use the Expo Go app to scan the QR code or run the app on an Android/iOS emulator.


## How to Build APK

### **Using EAS Build (Recommended)**
1. Install EAS CLI:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. Login to Expo:
   ```bash
   eas login
   ```

3. Build APK:
   ```bash
   eas build --platform android --profile preview
   ```

### **Using Local Build**
1. Prebuild to generate native code:
   ```bash
   npx expo prebuild --clean
   ```

2. Build APK using Gradle:
   ```bash
   cd android
   ./gradlew assembleRelease
   ```

3. The APK will be generated at:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

---

## Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API (for web)
3. Create an API key and add it to your `.env` file.
4. **Important:** Set up API restrictions and quotas to control costs.

---

## Impact

- **Boosts Tourism:** Makes monasteries more accessible to tourists worldwide.
- **Preserves Cultural Heritage:** Digitally archives endangered cultural assets.
- **Empowers Communities:** Encourages participatory archiving and local engagement.
- **Supports Education:** Provides a platform for spiritual and cultural exploration.

---

That's it! Your Sacred Sikkim app is ready to go.