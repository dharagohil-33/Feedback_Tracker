'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';
import { apiClient } from '../lib/apiClient';
import { toast } from 'sonner';

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBackendProfile = async (): Promise<UserProfile | null> => {
    try {
      const response = await apiClient<{ user: unknown; profile: UserProfile }>('/auth/me');
      if (response.data?.profile) {
        setProfile(response.data.profile);
        return response.data.profile;
      }
    } catch (err) {
      console.warn('Could not fetch profile from Express API:', err);
    }
    return null;
  };

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        fetchBackendProfile().finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (newSession?.user) {
        await fetchBackendProfile();
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient<{
        user: { id: string; email: string };
        profile: UserProfile;
        session: Session;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.data?.session) {
        await supabase.auth.setSession({
          access_token: response.data.session.access_token,
          refresh_token: response.data.session.refresh_token,
        });
        setSession(response.data.session);
        setProfile(response.data.profile);
        toast.success('Successfully logged in!');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await apiClient<{
        user: { id: string; email: string };
        profile: UserProfile;
        session: Session;
      }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName }),
      });

      if (response.data?.session) {
        await supabase.auth.setSession({
          access_token: response.data.session.access_token,
          refresh_token: response.data.session.refresh_token,
        });
        setSession(response.data.session);
        setProfile(response.data.profile);
        toast.success('Account created successfully!');
      } else {
        // Fallback login if session wasn't returned on sign up
        await login(email, password);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await apiClient('/auth/logout', { method: 'POST' }).catch(() => {});
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
      toast.info('Signed out of workspace session');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchBackendProfile();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        token: session?.access_token || null,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
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
