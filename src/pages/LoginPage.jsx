import React, { useState, useEffect } from 'react';
import { Dumbbell, Mail, Lock, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { signIn, resetPassword, updatePassword } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'forgot' | 'update_password'
  const [email, setEmail] = useState(() => localStorage.getItem('last_betania_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      localStorage.setItem('last_betania_email', email);
      await signIn(email, password);
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'E-mail ou senha incorretos.',
        'Email not confirmed': 'Confirme seu e-mail antes de fazer login.',
        'Too many requests': 'Muitas tentativas. Aguarde alguns minutos.',
      };
      setError(msgs[err.message] || 'Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Digite seu e-mail para receber o link de redefinição.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMsg(`Link de redefinição enviado para ${email}. Verifique sua caixa de entrada.`);
    } catch (err) {
      setError('Erro ao enviar e-mail. Verifique o endereço digitado.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Caso a pessoa venha através do link enviado pro email
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      setMode('update_password');
    }
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await updatePassword(password);
      setSuccessMsg('Sua senha foi atualizada com sucesso! Volte ao modo login para entrar.');
      setPassword(''); // apaga
      setMode('login'); // volta
      // Remover os dados perigosos de reset da URL (como JWT access token visual)
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      setError('Não foi possível atualizar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      {/* Background decorativo */}
      <div style={styles.bgGlow1} />
      <div style={styles.bgGlow2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoIcon}>
            <img src="/logo.svg" alt="Betânia Logo" style={{ width: '80%', height: '80%', objectFit: 'contain' }} />
          </div>
          <h1 style={styles.logoTitle}>Betânia Log App</h1>
          <p style={styles.logoSubtitle}>Sistema de Acompanhamento de Treinos</p>
        </div>

        {/* Divider */}
        <div style={styles.divider} />

        {/* --- MODO ESQUECI MINHA SENHA --- */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgot} style={styles.form}>
            <div style={styles.modeHeader}>
              <KeyRound size={22} color="#f9ab2d" />
              <h2 style={styles.modeTitle}>Redefinir Senha</h2>
            </div>
            <p style={styles.modeDesc}>
              Digite seu e-mail e enviaremos um link para criar uma nova senha.
            </p>

            {successMsg ? (
              <div style={styles.successBox}>
                <span>✅ {successMsg}</span>
              </div>
            ) : (
              <>
                <InputField
                  icon={<Mail size={18} color="#999" />}
                  type="email"
                  placeholder="Seu e-mail"
                  value={email}
                  onChange={setEmail}
                  autoComplete="email"
                />

                {error && <ErrorBox message={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? 'Enviando...' : 'Enviar Link de Redefinição'}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => { setMode('login'); setError(''); setSuccessMsg(''); }}
              style={styles.btnBack}
            >
              <ArrowLeft size={16} />
              Voltar para o login
            </button>
          </form>
        )}

        {/* --- MODO LOGIN --- */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} style={styles.form} noValidate>
            <h2 style={styles.welcomeTitle}>Bem-vindo(a) de volta! 👋</h2>

            <InputField
              icon={<Mail size={18} color="#999" />}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(v => !v)}
            />

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>

            <button
              type="button"
              onClick={() => { setMode('forgot'); setError(''); setSuccessMsg(''); }}
              style={styles.btnForgot}
            >
              Esqueci minha senha
            </button>
          </form>
        )}

        {/* --- MODO ATUALIZAR NOVA SENHA PÓS-EMAIL --- */}
        {mode === 'update_password' && (
          <form onSubmit={handleUpdatePassword} style={styles.form} noValidate>
            <div style={styles.modeHeader}>
              <KeyRound size={22} color="#f9ab2d" />
              <h2 style={styles.modeTitle}>Criar Nova Senha</h2>
            </div>
            
            <p style={styles.modeDesc}>
              Digite a nova senha que você utilizará daqui em diante.
            </p>

            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(v => !v)}
            />

            {error && <ErrorBox message={error} />}
            {successMsg && (
              <div style={styles.successBox}>
                <span>✅ {successMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Salvando...' : 'Salvar Nova Senha'}
            </button>
          </form>
        )}
      </div>

      <p style={styles.footer}>
        © {new Date().getFullYear()} Betânia Log App · Todos os direitos reservados
      </p>
    </div>
  );
};

/* ---- Sub-componentes ---- */

const InputField = ({ icon, type, placeholder, value, onChange, autoComplete }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...styles.inputWrapper, borderColor: focused ? '#f9ab2d' : '#3a3b3c' }}>
      <span style={styles.inputIcon}>{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required
        style={styles.input}
      />
    </div>
  );
};

const PasswordField = ({ value, onChange, show, onToggle }) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...styles.inputWrapper, borderColor: focused ? '#f9ab2d' : '#3a3b3c' }}>
      <span style={styles.inputIcon}><Lock size={18} color="#999" /></span>
      <input
        type={show ? 'text' : 'password'}
        placeholder="Senha"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete="current-password"
        required
        style={styles.input}
      />
      <button type="button" onClick={onToggle} style={styles.eyeBtn} tabIndex={-1}>
        {show ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
      </button>
    </div>
  );
};

const ErrorBox = ({ message }) => (
  <div style={styles.errorBox}>
    <span>⚠️ {message}</span>
  </div>
);

/* ---- Estilos ---- */

const styles = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1b1c',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
    boxSizing: 'border-box',
  },
  bgGlow1: {
    position: 'absolute',
    top: '-120px',
    right: '-120px',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,171,45,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  bgGlow2: {
    position: 'absolute',
    bottom: '-100px',
    left: '-100px',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(249,171,45,0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    backgroundColor: '#242526',
    border: '1px solid #3a3b3c',
    borderRadius: '20px',
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    position: 'relative',
    zIndex: 1,
    boxSizing: 'border-box',
  },
  logoWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  logoIcon: {
    width: '72px',
    height: '72px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.5rem',
  },
  logoTitle: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#f9ab2d',
    margin: 0,
    textAlign: 'center',
  },
  logoSubtitle: {
    fontSize: '0.8rem',
    color: '#777',
    margin: 0,
    textAlign: 'center',
    letterSpacing: '0.02em',
  },
  divider: {
    height: '1px',
    backgroundColor: '#3a3b3c',
    marginBottom: '1.75rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  welcomeTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: '0 0 0.25rem 0',
    textAlign: 'center',
  },
  modeHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    marginBottom: '0.25rem',
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: '1.2rem',
    fontWeight: '600',
    color: '#f9ab2d',
    margin: 0,
  },
  modeDesc: {
    fontSize: '0.875rem',
    color: '#999',
    textAlign: 'center',
    margin: '-0.25rem 0 0.25rem 0',
  },
  inputWrapper: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#1a1b1c',
    border: '1.5px solid #3a3b3c',
    borderRadius: '10px',
    padding: '0 1rem',
    transition: 'border-color 0.2s',
    gap: '0.75rem',
    height: '50px',
  },
  inputIcon: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '0.95rem',
    padding: 0,
    fontFamily: 'inherit',
    width: '100%',
    minWidth: 0,
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '0',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  btnPrimary: {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#f9ab2d',
    color: '#1a1b1c',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    fontFamily: 'inherit',
    transition: 'transform 0.15s, box-shadow 0.15s',
    boxShadow: '0 4px 16px rgba(249,171,45,0.3)',
    marginTop: '0.25rem',
  },
  btnForgot: {
    background: 'none',
    border: 'none',
    color: '#f9ab2d',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    padding: '0.25rem 0',
    textAlign: 'center',
    opacity: 0.85,
    textDecoration: 'underline',
    textDecorationColor: 'transparent',
    transition: 'opacity 0.2s, text-decoration-color 0.2s',
  },
  btnBack: {
    background: 'none',
    border: 'none',
    color: '#999',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.25rem 0',
    transition: 'color 0.2s',
  },
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f87171',
    fontSize: '0.875rem',
    textAlign: 'center',
  },
  successBox: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    border: '1px solid rgba(34,197,94,0.4)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#4ade80',
    fontSize: '0.875rem',
    lineHeight: 1.5,
    textAlign: 'center',
  },
  footer: {
    color: '#555',
    fontSize: '0.75rem',
    marginTop: '2rem',
    textAlign: 'center',
    position: 'relative',
    zIndex: 1,
  },
};

export default LoginPage;
