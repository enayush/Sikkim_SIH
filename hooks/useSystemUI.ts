import { useEffect } from 'react';
import { Platform, StatusBar } from 'react-native';
import * as SystemUI from 'expo-system-ui';

export function useSystemUI() {
  useEffect(() => {
    // Only apply system UI settings on Android and only if needed
    if (Platform.OS === 'android') {
      // Ensure we never go into immersive mode, but don't override everything
      StatusBar.setTranslucent(false);
      
      // Only set background color if needed
      SystemUI.setBackgroundColorAsync('#F9FAFB').catch(console.warn);
    }
  }, []);
}
