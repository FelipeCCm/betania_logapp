import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('last_betania_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

        {/* --- MODO LOGIN --- */}
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
        </form>
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
  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.4)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f87171',
    fontSize: '0.875rem',
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
