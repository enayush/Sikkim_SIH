import React from 'react';
import { SafeAreaView, StatusBar, Platform, StyleSheet, ViewStyle, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
  hideStatusBar?: boolean;
  forceTopPadding?: boolean;
}

export default function SafeScreen({
  children,
  style,
  backgroundColor = '#FFFFFF',
  statusBarStyle = 'dark-content',
  hideStatusBar = false,
  forceTopPadding = false
}: SafeScreenProps) {
  const insets = useSafeAreaInsets();

  // For Expo Go, ensure minimum top padding
  const topPadding = Math.max(insets.top, forceTopPadding ? 44 : 0);

  return (
    <View style={[styles.container, { backgroundColor, paddingTop: topPadding }, style]}>
      {!hideStatusBar && (
        <StatusBar
          barStyle={statusBarStyle}
          backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
          translucent={Platform.OS === 'android'}
        />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
