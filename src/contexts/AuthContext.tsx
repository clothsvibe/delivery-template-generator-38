
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';

interface AuthUser {
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Load session from localStorage on initial render
  useEffect(() => {
    const loadInitialSession = async () => {
      try {
        setLoading(true);
        console.log('Initializing auth context');
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Initial session:', session ? 'Found' : 'Not found');
        
        if (session?.user) {
          setSession(session);
          
          // Get user profile from database
          console.log('Fetching user profile for:', session.user.id);
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else {
            console.log('Profile loaded:', profileData);
            setUser({
              username: profileData?.username || session.user.email || '',
              isAdmin: profileData?.is_admin || false
            });
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadInitialSession();
  }, []);
  
  // Set up auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        setSession(session);
        
        if (session?.user) {
          try {
            // Get user profile from database
            console.log('Fetching profile after auth change for:', session.user.id);
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .single();
            
            if (profileError) {
              console.error('Error fetching profile after auth change:', profileError);
            } else {
              console.log('Profile loaded after auth change:', profileData);
              setUser({
                username: profileData?.username || session.user.email || '',
                isAdmin: profileData?.is_admin || false
              });
            }
          } catch (error) {
            console.error('Error processing auth change:', error);
          }
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: AuthUser) => {
    console.log('Manual login triggered with data:', userData);
    setUser(userData);
  };

  const logout = async () => {
    console.log('Logout triggered');
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
      console.log('Logout successful');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
