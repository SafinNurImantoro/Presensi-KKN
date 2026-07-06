import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/db';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [error, setError] = useState(null);

  const loadProfile = useCallback(async (userId) => {
    const { data, error: profileError } = await supabase
      .from('kkn_profiles')
      .select('id, member_name, app_role, is_active')
      .eq('id', userId)
      .maybeSingle();

    if (profileError) throw profileError;
    return data;
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    const applySession = async (nextSession) => {
      if (!active) return;

      setSession(nextSession);
      setError(null);

      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const nextProfile = await loadProfile(nextSession.user.id);
        if (active) setProfile(nextProfile);
      } catch (profileError) {
        console.error('Gagal memuat profil pengguna:', profileError);
        if (active) {
          setProfile(null);
          setError('Profil anggota gagal dimuat.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (sessionError) {
        setError('Sesi login gagal dimuat.');
        setLoading(false);
        return;
      }
      void applySession(data.session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void applySession(nextSession);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (signInError) throw signInError;
  }, []);

  const signOut = useCallback(async () => {
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user ?? null,
    profile,
    loading,
    error,
    isAdmin: !isSupabaseConfigured || profile?.app_role === 'admin',
    signIn,
    signOut
  }), [session, profile, loading, error, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
