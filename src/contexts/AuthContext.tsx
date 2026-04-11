import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  /** Uses Google OAuth; profile photo comes from Google when enabled in Supabase. */
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (password: string) => Promise<{ error: AuthError | null }>;
  /** Custom profile photo (data URL). Pass empty string to clear and use OAuth / Gravatar. */
  updateProfileAvatar: (dataUrl: string | null) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Clears React Query when the signed-in user changes so another account never sees cached data. */
function AuthSessionQueryReset() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const prevUserId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const id = user?.id;
    const prev = prevUserId.current;
    if (prev !== undefined && prev !== id) {
      queryClient.clear();
    }
    prevUserId.current = id;
  }, [user?.id, queryClient]);

  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if supabase is configured
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error };
  };

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    return { error };
  };

  const signOut = async () => {
    if (!supabase) {
      setSession(null);
      setUser(null);
      return;
    }
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.warn('Supabase signOut:', error.message);
      }
    } finally {
      // Always clear UI state immediately. Otherwise navigate('/') can run before SIGNED_OUT is applied and
      // PublicRoute still sees user → redirects back to /dashboard (sign out appears broken).
      setSession(null);
      setUser(null);
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    return { error };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const updateProfileAvatar = async (dataUrl: string | null) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as AuthError };
    }

    const { error } = await supabase.auth.updateUser({
      data: { profile_avatar: dataUrl ?? '' },
    });
    if (!error) {
      const { data: { user: next } } = await supabase.auth.getUser();
      setUser(next ?? null);
    }
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
    updateProfileAvatar,
  };

  return (
    <AuthContext.Provider value={value}>
      <AuthSessionQueryReset />
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
