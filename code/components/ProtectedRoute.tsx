import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!loading && !user && !hasRedirected) {
      console.log('ProtectedRoute: User not authenticated, redirecting to login');
      setHasRedirected(true);
      // User is not authenticated, redirect directly to login to avoid loops
      router.replace('/auth/login');
    }
    
    // Reset redirect flag if user becomes authenticated
    if (user && hasRedirected) {
      setHasRedirected(false);
    }
  }, [user, loading, router, hasRedirected]);

  // Show loading while auth is being checked
  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  // If no user and not loading, return null (will redirect)
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Redirecting...</Text>
      </View>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
  },
});
