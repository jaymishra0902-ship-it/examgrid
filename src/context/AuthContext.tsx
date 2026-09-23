import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { AppUser } from '@/types';

interface AuthContextValue {
  user: AppUser | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, targetExam: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const GUEST_USER: AppUser = {
  id: 'guest',
  full_name: 'Guest Student',
  target_exam: 'Class 12 Boards',
  avatar_color: '#000000',
  isGuest: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        setSession(session);
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          setLoading(false);
        } else if (session?.user) {
          await fetchProfile(session.user.id, session);
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string, currentSession: Session | null) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, target_exam, avatar_color')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) {
      const meta = currentSession?.user?.user_metadata;
      setUser({
        id: userId,
        full_name: meta?.full_name || 'Student',
        target_exam: meta?.target_exam || 'Class 12 Boards',
        avatar_color: '#000000',
        isGuest: false,
      });
    } else {
      setUser({
        id: data.id,
        full_name: data.full_name,
        target_exam: data.target_exam,
        avatar_color: data.avatar_color || '#000000',
        isGuest: false,
      });
    }
    setLoading(false);
  }

  async function signUp(email: string, password: string, fullName: string, targetExam: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, target_exam: targetExam } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        target_exam: targetExam,
        avatar_color: '#000000',
      });
      if (profileError) return { error: profileError.message };
    }
    return { error: null };
  }

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }

  function continueAsGuest() {
    setUser(GUEST_USER);
    setLoading(false);
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, continueAsGuest }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
