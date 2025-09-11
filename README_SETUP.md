# Sacred Sikkim - Quick Setup

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup environment:**
   ```bash
   npm run setup
   ```

3. **Edit `.env` file with your API keys:**
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start development:**
   ```bash
   npm start
   ```

## 📱 Building

### Local Development
```bash
npm start
```

### Build for devices
```bash
# Install EAS CLI if you haven't
npm install -g @expo/eas-cli

# Build for Android
eas build --platform android

# Build for iOS  
eas build --platform ios
```

## 🗺️ Google Maps Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project and enable these APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Maps JavaScript API (for web)
3. Create an API key and add it to your `.env` file
4. **Important:** Set up API restrictions and quotas to control costs

## 🔧 Key Features

- ✅ User location display
- ✅ Monastery markers
- ✅ Interactive monastery details
- ✅ Search functionality
- ✅ Optimized for cost efficiency

The app automatically validates your configuration and shows status in development mode.

That's it! Your monastery app is ready to go. 🏛️
