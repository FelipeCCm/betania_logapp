import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const isNetworkError = (err) => {
  if (!err) return false;
  const msg = (err.message || '').toLowerCase();
  return (
    err.name === 'TypeError' ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('err_name_not_resolved') ||
    msg.includes('load failed')
  );
};

const normalizeAuthError = (err) => {
  if (isNetworkError(err)) {
    const e = new Error(
      'Não foi possível conectar ao servidor. Verifique sua conexão com a internet (ou o DNS) e tente novamente.'
    );
    e.code = 'network_error';
    return e;
  }
  const dict = {
    'Invalid login credentials': 'E-mail ou senha incorretos.',
    'Email not confirmed': 'Confirme seu e-mail antes de fazer login.',
    'Too many requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  };
  const friendly = dict[err?.message] || err?.message || 'Erro desconhecido ao autenticar.';
  const e = new Error(friendly);
  e.code = err?.code || 'auth_error';
  return e;
};

const fetchUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, role, student_id, operator_name')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const mountedRef = useRef(true);

  // -------------------------------------------------------------------------
  // Efeito 1: fonte da verdade da SESSÃO
  // - getSession() recupera a sessão persistida no refresh
  // - onAuthStateChange escuta login/logout/refresh de token
  // IMPORTANTE: o callback de onAuthStateChange é SÍNCRONO (sem await em
  // queries do supabase-js), para evitar o deadlock conhecido da state
  // machine interna do SDK.
  // -------------------------------------------------------------------------
  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    const applyUser = (sessionUser) => {
      if (!mountedRef.current || cancelled) return;
      if (sessionUser) {
        // Preserva a mesma referência se o id não mudou
        setUser((prev) => (prev?.id === sessionUser.id ? prev : sessionUser));
      } else {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    };

    // Sessão inicial (após F5, por exemplo)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applyUser(session?.user ?? null))
      .catch((err) => {
        console.error('[Auth] getSession falhou:', err);
        if (mountedRef.current && !cancelled) setLoading(false);
      });

    // Escuta mudanças de auth — callback síncrono
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  // -------------------------------------------------------------------------
  // Efeito 2: busca o PERFIL sempre que o user.id mudar
  // Rodar fora do callback de onAuthStateChange evita o deadlock e centraliza
  // o controle de loading.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (!user?.id) return;

    let cancelled = false;
    setLoading(true);

    (async () => {
      try {
        const data = await fetchUserProfile(user.id);
        if (cancelled || !mountedRef.current) return;

        if (!data) {
          setProfile(null);
          setProfileError('profile_missing');
        } else if (!['admin', 'student'].includes(data.role)) {
          setProfile(null);
          setProfileError('invalid_role');
        } else {
          setProfile(data);
          setProfileError(null);
        }
      } catch (err) {
        if (cancelled || !mountedRef.current) return;
        console.error('[Auth] Erro ao buscar perfil:', err);
        setProfile(null);
        setProfileError(isNetworkError(err) ? 'network_error' : 'profile_fetch_error');
      } finally {
        if (!cancelled && mountedRef.current) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data;
    } catch (err) {
      throw normalizeAuthError(err);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.error('[Auth] Erro ao sair:', e);
    } finally {
      if (mountedRef.current) {
        setUser(null);
        setProfile(null);
        setProfileError(null);
        setLoading(false);
      }
    }
  };

  const refreshProfile = async () => {
    if (!user?.id) return;
    try {
      const data = await fetchUserProfile(user.id);
      if (mountedRef.current) setProfile(data || null);
    } catch (err) {
      console.error('[Auth] Erro ao atualizar perfil:', err);
    }
  };

  const isAdmin = profile?.role === 'admin';
  const isStudent = profile?.role === 'student';
  const isUnlinkedStudent = isStudent && !profile?.student_id;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        profileError,
        isAdmin,
        isStudent,
        isUnlinkedStudent,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
