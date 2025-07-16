import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
  updated_at: string;
  last_login: string | null;
  is_active: boolean;
}

interface AdminSession {
  admin: AdminUser;
  token: string;
  session_id: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  session: AdminSession | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedSession = localStorage.getItem('admin_session');
    if (storedSession) {
      try {
        const parsedSession = JSON.parse(storedSession) as AdminSession;
        setSession(parsedSession);
        setAdmin(parsedSession.admin);
      } catch (error) {
        console.error('Error parsing stored session:', error);
        localStorage.removeItem('admin_session');
      }
    }
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('authenticate_admin', {
        email_input: email,
        password_input: password
      });

      if (error) {
        setIsLoading(false);
        return { error: error.message };
      }

      const response = data as any;
      if (response.success) {
        const sessionData: AdminSession = {
          admin: response.admin,
          token: response.token,
          session_id: response.session_id
        };
        
        setSession(sessionData);
        setAdmin(response.admin);
        localStorage.setItem('admin_session', JSON.stringify(sessionData));
        setIsLoading(false);
        return { error: null };
      } else {
        setIsLoading(false);
        return { error: response.error };
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
        .from('admin_sessions')
        .delete()
        .eq('id', session.session_id);
    }
    
    setAdmin(null);
    setSession(null);
    localStorage.removeItem('admin_session');
  };

  const isAuthenticated = !!admin && !!session;

  return (
    <AdminAuthContext.Provider value={{
      admin,
      session,
      isLoading,
      signIn,
      signOut,
      isAuthenticated
    }}>
      {children}
    </AdminAuthContext.Provider>
  );
};