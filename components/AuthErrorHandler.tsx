import React, { useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

interface AuthErrorHandlerProps {
  children: React.ReactNode;
}

export default function AuthErrorHandler({ children }: AuthErrorHandlerProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Global error handler for auth-related errors
    const handleAuthError = (error: any) => {
      console.error('Global auth error:', error);
      
      // Check if it's a token expiration or auth error
      if (error?.message?.includes('JWT') || 
          error?.message?.includes('token') ||
          error?.message?.includes('unauthorized') ||
          error?.message?.includes('Invalid JWT') ||
          error?.code === 'PGRST301' ||
          error?.status === 401) {
        
        console.log('Token expired or auth error detected, redirecting to login');
        
        // Show a brief message and redirect to login
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please sign in again.',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace('/auth/login');
              }
            }
          ]
        );
      }
    };

    // Set up global error handling
    const originalConsoleError = console.error;
    console.error = (...args) => {
      originalConsoleError(...args);
      
      // Check if any of the arguments contain auth-related errors
      const errorMessage = args.join(' ');
      if (errorMessage.includes('JWT') || 
          errorMessage.includes('token') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('Invalid JWT')) {
        handleAuthError({ message: errorMessage });
      }
    };

    // Cleanup
    return () => {
      console.error = originalConsoleError;
    };
  }, [router]);

  // If user is null and not loading, redirect to login
  useEffect(() => {
    if (!loading && !user) {
      console.log('No user found, redirecting to login');
      router.replace('/auth/login');
    }
  }, [user, loading, router]);

  return <>{children}</>;
}
