import { supabase } from './supabase';

export const checkAuthSession = async () => {
  try {
    console.log('Checking auth session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth session error:', error.message);
      return { session: null, user: null, error };
    }
    
    console.log('Auth session result:', session ? `User: ${session.user?.email}` : 'No session');
    return { session, user: session?.user || null, error: null };
  } catch (error) {
    console.error('Auth session check failed:', error);
    return { session: null, user: null, error };
  }
};

export const waitForAuthInitialization = (maxWaitTime = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    let timeElapsed = 0;
    const checkInterval = 100;
    
    const checkAuth = async () => {
      const { session } = await checkAuthSession();
      
      if (session !== null || timeElapsed >= maxWaitTime) {
        resolve(session !== null);
        return;
      }
      
      timeElapsed += checkInterval;
      setTimeout(checkAuth, checkInterval);
    };
    
    checkAuth();
  });
};
