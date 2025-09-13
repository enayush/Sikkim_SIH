import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkAuthSession } from '../lib/authUtils';
import { clearAllLocationData } from '../components/splash/locationUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session with improved error handling
    const getInitialSession = async () => {
      try {
        console.log('AuthProvider: Getting initial session...');
        const { session, user, error } = await checkAuthSession();
        
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
          // If there's an error getting session, clear everything
          if (mounted) {
            setSession(null);
            setUser(null);
            setInitialized(true);
            setLoading(false);
          }
          return;
        }
        
        if (mounted) {
          setSession(session);
          setUser(user);
          setInitialized(true);
          
          // Delay setting loading to false to ensure UI has time to process
          setTimeout(() => {
            if (mounted) {
              console.log('AuthProvider: Setting loading to false');
              setLoading(false);
            }
          }, 200);
        }
      } catch (error) {
        console.error('AuthProvider: Session retrieval error:', error);
        if (mounted) {
          setInitialized(true);
          setLoading(false);
        }
      }
    };

    // Listen for auth changes first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      if (mounted) {
        console.log('AuthProvider: Auth state change:', event);
        
        // Handle different auth events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          console.log('AuthProvider: User signed out or token refreshed, clearing state');
          setSession(null);
          setUser(null);
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          console.log('AuthProvider: User signed in');
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
          console.log('AuthProvider: Initial session loaded');
          setSession(session);
          setUser(session?.user ?? null);
          if (initialized) {
            setLoading(false);
          }
        } else {
          // Handle other events like PASSWORD_RECOVERY, etc.
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    });

    // Get initial session after setting up the listener
    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [initialized]);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const result = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      // Handle specific auth errors
      if (result.error) {
        console.error('Signup error:', result.error);
        // Don't throw, let the calling component handle the error
      }
      
      return result;
    } catch (error) {
      console.error('Signup exception:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      
      // Handle specific auth errors
      if (result.error) {
        console.error('Signin error:', result.error);
        // Don't throw, let the calling component handle the error
      }
      
      return result;
    } catch (error) {
      console.error('Signin exception:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
      
      // Clear location data first
      await clearAllLocationData();
      
      const result = await supabase.auth.signOut();
      // Clear state immediately to prevent any timing issues
      setSession(null);
      setUser(null);
      return result;
    } catch (error) {
      console.error('AuthProvider: Sign out error:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}