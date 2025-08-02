import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../types';
import { supabase, signInWithEmail, signOut, getCurrentUser } from '../lib/supabase';
import { Database } from '../types/database';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  loginPOS: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: authUser } = await signInWithEmail(email, password);
      
      if (authUser) {
        // Get user profile from our users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return false;
        }

        if (userProfile) {
          const userData: User = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            avatar: userProfile.avatar
          };
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const loginPOS = async (email: string, password: string): Promise<boolean> => {
    try {
      const { user: authUser } = await signInWithEmail(email, password);
      
      if (authUser) {
        // Get user profile from our users table
        const { data: userProfile, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUser.id)
          .single();

        if (error) {
          console.error('Error fetching user profile for POS:', error);
          return false;
        }

        if (userProfile) {
          const userData: User = {
            id: userProfile.id,
            name: userProfile.name,
            email: userProfile.email,
            role: userProfile.role,
            avatar: userProfile.avatar
          };
          setUser(userData);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('POS Login error:', error);
      return false;
    }
  };

const logout = async () => {
  try {
    await signOut();
    setUser(null);

    // Elimina la info del sistema (POS o ERP)
    localStorage.removeItem('loginSystem');

    // Redirige al login limpiamente
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Forzar redirección incluso si hay error
    localStorage.removeItem('loginSystem');
    window.location.href = '/login';
  }
};


  // Check for existing session and listen for auth changes
  React.useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        // Always require fresh login - don't restore sessions
        if (false && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userProfile) {
            const userData: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar
            };
            setUser(userData);
          }
        }
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          window.location.href = '/login';
        } else if (false && event === 'SIGNED_IN' && session?.user) {
          const { data: userProfile } = await supabase
            .from('users')
            .select('*')
            .eq('auth_id', session.user.id)
            .single();

          if (userProfile) {
            const userData: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email,
              role: userProfile.role,
              avatar: userProfile.avatar
            };
            setUser(userData);
          }
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);


  return (
    <AuthContext.Provider value={{
      user,
      login,
      loginPOS,
      logout,
      isAuthenticated: !!user,
      loading: false
    }}>
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