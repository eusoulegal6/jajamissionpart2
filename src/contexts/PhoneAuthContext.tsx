
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserSession {
  id: string;
  phone_number: string;
  display_name: string | null;
  created_at: string;
  last_login: string;
}

interface PhoneAuthContextType {
  user: UserSession | null;
  isAuthenticated: boolean;
  login: (phoneNumber: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const PhoneAuthContext = createContext<PhoneAuthContextType | null>(null);

export const usePhoneAuth = () => {
  const context = useContext(PhoneAuthContext);
  if (!context) {
    throw new Error('usePhoneAuth must be used within a PhoneAuthProvider');
  }
  return context;
};

interface PhoneAuthProviderProps {
  children: ReactNode;
}

export const PhoneAuthProvider: React.FC<PhoneAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('PhoneAuth: Initializing authentication...');
        
        // Check for existing session in localStorage
        const savedSession = localStorage.getItem('phone_auth_session');
        if (savedSession) {
          try {
            const parsedSession = JSON.parse(savedSession);
            console.log('PhoneAuth: Found saved session');
            setUser(parsedSession);
          } catch (error) {
            console.error('PhoneAuth: Error parsing saved session:', error);
            localStorage.removeItem('phone_auth_session');
          }
        } else {
          console.log('PhoneAuth: No saved session found');
        }
        
        console.log('PhoneAuth: Authentication initialization complete');
        setIsLoading(false);
      } catch (error) {
        console.error('PhoneAuth: Error during initialization:', error);
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (phoneNumber: string, displayName?: string) => {
    try {
      // First, try to find existing user
      const { data: existingUser, error: findError } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('phone_number', phoneNumber)
        .single();

      let userSession: UserSession;

      if (existingUser && !findError) {
        // Update last_login for existing user
        const { data: updatedUser, error: updateError } = await supabase
          .from('user_sessions')
          .update({ 
            last_login: new Date().toISOString(),
            ...(displayName && { display_name: displayName })
          })
          .eq('phone_number', phoneNumber)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating user session:', updateError);
          return { success: false, error: 'Erro ao fazer login' };
        }

        userSession = updatedUser;
      } else {
        // Create new user session
        const { data: newUser, error: insertError } = await supabase
          .from('user_sessions')
          .insert({
            phone_number: phoneNumber,
            display_name: displayName || null
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating user session:', insertError);
          return { success: false, error: 'Erro ao criar sessão' };
        }

        userSession = newUser;
      }

      // Save session to localStorage and state
      localStorage.setItem('phone_auth_session', JSON.stringify(userSession));
      setUser(userSession);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Erro inesperado' };
    }
  };

  const logout = () => {
    localStorage.removeItem('phone_auth_session');
    setUser(null);
  };

  const value: PhoneAuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading
  };

  return (
    <PhoneAuthContext.Provider value={value}>
      {children}
    </PhoneAuthContext.Provider>
  );
};
