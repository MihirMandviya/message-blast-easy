import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClientUser {
  id: string;
  email: string;
  business_name: string;
  phone_number: string;
  whatsapp_api_key: string | null;
  whatsapp_number: string | null;
  user_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
  subscription_plan: string;
  subscription_expires_at: string | null;
}

interface ClientSession {
  client: ClientUser;
  token: string;
  session_id: string;
}

interface ClientAuthContextType {
  client: ClientUser | null;
  session: ClientSession | null;
  isLoading: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const ClientAuthContext = createContext<ClientAuthContextType | undefined>(undefined);

export const useClientAuth = () => {
  const context = useContext(ClientAuthContext);
  if (!context) {
    throw new Error('useClientAuth must be used within ClientAuthProvider');
  }
  return context;
};

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<ClientUser | null>(null);
  const [session, setSession] = useState<ClientSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for existing session
      const storedSession = localStorage.getItem('client_session');
      if (storedSession) {
        try {
          const parsedSession = JSON.parse(storedSession) as ClientSession;
          // Validate session is still valid
          if (parsedSession.client && parsedSession.token) {
            // Check if client data is missing user_id and refresh it
            if (!parsedSession.client.user_id && parsedSession.client.id) {
              try {
                const { data, error } = await supabase
                  .from('client_users')
                  .select('*')
                  .eq('id', parsedSession.client.id)
                  .single();
                
                if (!error && data) {
                  parsedSession.client = data;
                  localStorage.setItem('client_session', JSON.stringify(parsedSession));
                  console.log('Refreshed client session with complete data');
                }
              } catch (error) {
                console.error('Error refreshing client data:', error);
              }
            }
            
            setSession(parsedSession);
            setClient(parsedSession.client);
          } else {
            localStorage.removeItem('client_session');
          }
        } catch (error) {
          console.error('Error parsing stored session:', error);
          localStorage.removeItem('client_session');
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const signIn = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      // First try to authenticate with user_id
      let { data, error } = await supabase.rpc('authenticate_client_by_user_id', {
        user_id_input: identifier,
        password_input: password
      });

      // If that fails, try with email (backward compatibility)
      if (error || !data || !data.success) {
        const { data: emailData, error: emailError } = await supabase.rpc('authenticate_client', {
          email_input: identifier,
          password_input: password
        });

        if (emailError || !emailData || !emailData.success) {
          setIsLoading(false);
          return { error: 'Invalid User ID/Email or password' };
        }

        data = emailData;
      }

      const response = data as any;
      if (response.success) {
        const sessionData: ClientSession = {
          client: response.client,
          token: response.token,
          session_id: response.session_id
        };
        
        setSession(sessionData);
        setClient(response.client);
        localStorage.setItem('client_session', JSON.stringify(sessionData));
        setIsLoading(false);
        return { error: null };
      } else {
        setIsLoading(false);
        return { error: response.error || 'Authentication failed' };
      }
    } catch (error) {
      setIsLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  const signOut = async () => {
    if (session) {
      // Delete session from database
      await supabase
        .from('client_sessions')
        .delete()
        .eq('id', session.session_id);
    }
    
    setClient(null);
    setSession(null);
    localStorage.removeItem('client_session');
  };

  const isAuthenticated = !!client && !!session;

  return (
    <ClientAuthContext.Provider value={{
      client,
      session,
      isLoading,
      signIn,
      signOut,
      isAuthenticated
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
};