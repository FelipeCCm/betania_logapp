import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  // SEMPRE iniciar o app livre, direto na tela. Sem estado falso de "Carregando" pro user.
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !data) {
        console.warn('[Auth] Perfil não encontrado:', error?.message);
        return null;
      }
      return data;
    } catch (e) {
      console.error('[Auth] Erro fetch perfil:', e);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Quando alguém ativamente faz login no formulário
      if (event === 'SIGNED_IN') {
        if (session?.user) {
          const p = await fetchProfile(session.user.id);
          if (isMounted) {
            setUser(session.user);
            setProfile(p);
            setLoading(false);
          }
        }
      } 
      // Se ele clica em "Sair"
      else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    supabase.auth.signOut().catch(e => console.error(e));
    setUser(null);
    setProfile(null);
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
