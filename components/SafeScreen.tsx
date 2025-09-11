import React from 'react';
import { SafeAreaView, StatusBar, Platform, StyleSheet, ViewStyle } from 'react-native';

interface SafeScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  backgroundColor?: string;
  statusBarStyle?: 'default' | 'light-content' | 'dark-content';
}

export default function SafeScreen({ 
  children, 
  style, 
  backgroundColor = '#F9FAFB',
  statusBarStyle = 'dark-content'
}: SafeScreenProps) {
  return (
    <>
      <StatusBar 
        barStyle={statusBarStyle}
        backgroundColor={Platform.OS === 'android' ? backgroundColor : undefined}
        translucent={false}
      />
      <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
        {children}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
