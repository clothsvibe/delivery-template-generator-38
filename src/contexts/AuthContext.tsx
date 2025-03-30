
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Session } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

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
  
  // Set up auth state listener first
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, sessionData) => {
        console.log('Auth state changed:', event, sessionData ? 'Session exists' : 'No session');
        
        setSession(sessionData);
        
        if (sessionData?.user) {
          // Don't call supabase directly in the callback to avoid deadlocks
          // Instead, use setTimeout to defer the operation
          setTimeout(async () => {
            try {
              console.log('Fetching profile after auth change for:', sessionData.user.id);
              const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', sessionData.user.id)
                .maybeSingle();
              
              if (profileError) {
                console.error('Error fetching profile after auth change:', profileError);
                return;
              }
              
              if (profileData) {
                console.log('Profile loaded after auth change:', profileData);
                setUser({
                  username: profileData?.username || sessionData.user.email || '',
                  isAdmin: profileData?.is_admin || false
                });
              } else {
                console.log('No profile found, setting basic user data');
                setUser({
                  username: sessionData.user.email || '',
                  isAdmin: false
                });
              }
            } catch (error) {
              console.error('Error processing auth change:', error);
            }
          }, 0);
        } else {
          setUser(null);
        }
      }
    );
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  // Then check for initial session
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
            .maybeSingle();
            
          if (profileError) {
            console.error('Error fetching profile:', profileError);
          } else if (profileData) {
            console.log('Profile loaded:', profileData);
            setUser({
              username: profileData?.username || session.user.email || '',
              isAdmin: profileData?.is_admin || false
            });
          } else {
            console.log('No profile found, setting basic user data');
            setUser({
              username: session.user.email || '',
              isAdmin: false
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

  const login = (userData: AuthUser) => {
    console.log('Manual login triggered with data:', userData);
    setUser(userData);
  };

  const logout = async () => {
    console.log('Logout triggered');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
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
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Chargement de l'application...</p>
          </div>
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
