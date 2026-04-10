import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Race any promise against a hard wall-clock timeout.
// Extension-proof: doesn't rely on AbortController or fetch internals.
const withTimeout = (promise, ms) =>
  Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(null), ms)),
  ]);

// Read the stored Supabase session from localStorage synchronously — zero network.
const readCachedUser = () => {
  try {
    const raw = localStorage.getItem('betania_auth_token');
    if (!raw) return null;
    const session = JSON.parse(raw);
    return session?.user ?? null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Prevent double-resolution (safety timer vs. normal flow)
  const resolvedRef = useRef(false);

  const resolveAuth = (resolvedUser, resolvedProfile) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    setUser(resolvedUser);
    setProfile(resolvedProfile);
    setLoading(false);
  };

  const fetchProfile = (userId) =>
    withTimeout(
      supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
        .then(({ data, error }) => {
          if (error || !data) return null;
          return data;
        })
        .catch(() => null),
      5000 // 5 s — extension-proof because Promise.race lives outside fetch
    );

  useEffect(() => {
    let isMounted = true;

    // ── Phase 1: Unblock from localStorage immediately ──────────────────────
    const cachedUser = readCachedUser();

    if (!cachedUser) {
      // No stored session at all → show login immediately, no network needed
      resolveAuth(null, null);
    } else {
      // We have a cached user — fetch their profile (capped at 5 s)
      fetchProfile(cachedUser.id).then((p) => {
        if (!isMounted) return;
        // Whether profile loaded or not, unblock the app.
        // If p is null (network down / timeout) force re-login by clearing user too.
        resolveAuth(p ? cachedUser : null, p);
      });
    }

    // ── Phase 2: Hard safety cap — ALWAYS unblock after 3 s ─────────────────
    // Fires before the 5 s fetchProfile timeout, so in the worst case the user
    // sees the login screen after 3 s and can log in normally.
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        console.warn('[Auth] Safety timeout reached — forcing login screen');
        resolveAuth(null, null);
      }
    }, 3000);

    // ── Phase 3: Background listener for live auth events ───────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (
          event === 'SIGNED_IN' ||
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION'
        ) {
          if (session?.user) {
            clearTimeout(safetyTimer);
            const p = await withTimeout(fetchProfile(session.user.id), 5000);
            if (isMounted) {
              // Use resolveAuth for the first resolution, then direct setState
              if (!resolvedRef.current) {
                resolveAuth(session.user, p);
              } else {
                setUser(session.user);
                setProfile(p);
                setLoading(false);
              }
            }
          } else {
            // INITIAL_SESSION with no session means expired/no token
            if (isMounted) resolveAuth(null, null);
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error(e);
    } finally {
      setUser(null);
      setProfile(null);
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  const isAdmin = profile?.role === 'admin';
  const isStudent = profile?.role === 'student';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAdmin,
      isStudent,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
