# Sacred Sikkim

A React Native app for exploring monasteries in Sikkim with interactive maps and location services.

## Features

- 🗺️ Interactive map centered on Sikkim
- 📍 User location tracking
- 🏛️ Monastery locations and details
- 🔍 Search monasteries by name/location
- 📱 Optimized for both Android and iOS

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup environment:
   ```bash
   npm run setup
   ```

3. Edit `.env` with your API keys:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
   ```

4. Start development:
   ```bash
   npm start
   ```

## Building

- Development: `npm start`
- Android: `eas build --platform android`
- iOS: `eas build --platform ios`