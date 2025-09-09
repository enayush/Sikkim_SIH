import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { checkAuthSession } from '../lib/authUtils';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<any>;
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
        }
        
        if (mounted) {
          console.log('AuthProvider: Initial session result:', session ? `Found user: ${user?.email}` : 'Not found');
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
      console.log('Auth state changed:', event, session ? `User: ${session.user?.email}` : 'No user');
      
      if (mounted) {
        // Handle sign out event specifically
        if (event === 'SIGNED_OUT') {
          console.log('AuthProvider: User signed out, clearing state');
          setSession(null);
          setUser(null);
          setLoading(false);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
          
          // Don't set loading to false immediately on auth changes if we haven't initialized
          if (initialized || event !== 'INITIAL_SESSION') {
            setLoading(false);
          }
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

  const signUp = async (email: string, password: string) => {
    return await supabase.auth.signUp({ email, password });
  };

  const signIn = async (email: string, password: string) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out user');
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