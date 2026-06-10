import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, Phone, Hand, Dumbbell, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState(() => localStorage.getItem('last_betania_email') || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const switchMode = () => {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setError('');
    setInfo('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setError('Preencha e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('last_betania_email', cleanEmail);
      await signIn(cleanEmail, password);
    } catch (err) {
      // AuthContext já normaliza a mensagem e anexa err.code
      setError(err.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      setError('Informe seu nome.');
      return;
    }
    if (!cleanEmail) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      localStorage.setItem('last_betania_email', cleanEmail);
      const data = await signUp(cleanEmail, password, {
        full_name: cleanName,
        phone: cleanPhone,
      });

      if (!data?.session) {
        // "Confirm email" está LIGADO no Supabase — fallback defensivo.
        setInfo('Cadastro recebido. Verifique seu e-mail antes de entrar.');
        setMode('login');
        setName('');
        setPhone('');
        setPassword('');
        setConfirmPassword('');
      }
      // Se há sessão, AuthContext.onAuthStateChange já assume e o app re-renderiza.
    } catch (err) {
      setError(err.message || 'Erro ao criar conta.');
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

        {mode === 'login' ? (
          /* --- MODO LOGIN --- */
          <form onSubmit={handleLogin} style={styles.form} noValidate>
            <h2 style={styles.welcomeTitle}>
              <Hand size={22} color="#f9ab2d" aria-hidden="true" />
              <span>Bem-vindo(a) de volta!</span>
            </h2>

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
              onToggle={() => setShowPassword((v) => !v)}
              placeholder="Senha"
              autoComplete="current-password"
            />

            {info && <InfoBox message={info} />}
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
              onClick={switchMode}
              disabled={loading}
              style={styles.btnLink}
            >
              Não tem conta? <strong>Criar usuário</strong>
            </button>
          </form>
        ) : (
          /* --- MODO CADASTRO --- */
          <form onSubmit={handleSignup} style={styles.form} noValidate>
            <h2 style={styles.welcomeTitle}>
              <Dumbbell size={22} color="#f9ab2d" aria-hidden="true" />
              <span>Criar conta de aluno</span>
            </h2>

            <InputField
              icon={<User size={18} color="#999" />}
              type="text"
              placeholder="Nome completo"
              value={name}
              onChange={setName}
              autoComplete="name"
            />

            <InputField
              icon={<Mail size={18} color="#999" />}
              type="email"
              placeholder="E-mail"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <InputField
              icon={<Phone size={18} color="#999" />}
              type="tel"
              placeholder="Telefone (opcional)"
              value={phone}
              onChange={setPhone}
              autoComplete="tel"
              required={false}
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              placeholder="Senha (mín. 6 caracteres)"
              autoComplete="new-password"
            />

            <PasswordField
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              placeholder="Confirmar senha"
              autoComplete="new-password"
              hideToggle
            />

            {error && <ErrorBox message={error} />}

            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              {loading ? 'Criando conta...' : 'Cadastrar'}
            </button>

            <button
              type="button"
              onClick={switchMode}
              disabled={loading}
              style={styles.btnLink}
            >
              Já tem conta? <strong>Entrar</strong>
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

const InputField = ({ icon, type, placeholder, value, onChange, autoComplete, required = true }) => {
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
        required={required}
        style={styles.input}
      />
    </div>
  );
};

const PasswordField = ({
  value,
  onChange,
  show,
  onToggle,
  placeholder = 'Senha',
  autoComplete = 'current-password',
  hideToggle = false,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...styles.inputWrapper, borderColor: focused ? '#f9ab2d' : '#3a3b3c' }}>
      <span style={styles.inputIcon}><Lock size={18} color="#999" /></span>
      <input
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        required
        style={styles.input}
      />
      {!hideToggle && (
        <button type="button" onClick={onToggle} style={styles.eyeBtn} tabIndex={-1}>
          {show ? <EyeOff size={18} color="#999" /> : <Eye size={18} color="#999" />}
        </button>
      )}
    </div>
  );
};

const ErrorBox = ({ message }) => (
  <div style={styles.errorBox}>
    <AlertCircle size={16} color="#f87171" aria-hidden="true" style={{ flexShrink: 0 }} />
    <span>{message}</span>
  </div>
);

const InfoBox = ({ message }) => (
  <div style={styles.infoBox}>
    <Info size={16} color="#f9ab2d" aria-hidden="true" style={{ flexShrink: 0 }} />
    <span>{message}</span>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  infoBox: {
    backgroundColor: 'rgba(249,171,45,0.1)',
    border: '1px solid rgba(249,171,45,0.4)',
    borderRadius: '8px',
    padding: '0.75rem 1rem',
    color: '#f9ab2d',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  },
  btnLink: {
    background: 'none',
    border: 'none',
    color: '#bbb',
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    cursor: 'pointer',
    padding: '0.5rem',
    textAlign: 'center',
    width: '100%',
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
