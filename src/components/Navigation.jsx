import React, { useState, useEffect } from 'react';
import { User, TrendingUp, History, Dumbbell, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Navigation = ({ currentPage, onPageChange, role }) => {
  const { signOut } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  // Abas disponíveis por role
  const allPages = [
    { id: 'students', label: 'Alunos', icon: User, roles: ['admin', 'student'] },
    { id: 'progress', label: 'Registrar Progresso', icon: TrendingUp, roles: ['admin', 'student'] },
    { id: 'history', label: 'Histórico', icon: History, roles: ['admin'] },
    { id: 'exercises', label: 'Exercícios', icon: Dumbbell, roles: ['admin'] },
  ];

  const pages = allPages.filter(p => p.roles.includes(role));

  return (
    <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
      {pages.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onPageChange(id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: currentPage === id ? '#f9ab2d' : 'transparent',
            color: currentPage === id ? '#1a1b1c' : '#ffffff',
            border: currentPage === id ? 'none' : '1px solid #3a3b3c',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: currentPage === id ? 'bold' : 'normal',
            transition: 'all 0.3s',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap',
            fontFamily: 'inherit',
          }}
        >
          <Icon size={18} />
          {!isMobile && <span>{label}</span>}
        </button>
      ))}


      {/* Botão Sair */}
      <button
        onClick={handleSignOut}
        disabled={signingOut}
        title="Sair"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1.25rem',
          backgroundColor: 'transparent',
          color: '#e57373',
          border: '1px solid #e57373',
          borderRadius: '8px',
          cursor: signingOut ? 'not-allowed' : 'pointer',
          fontWeight: 'normal',
          transition: 'all 0.3s',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          fontFamily: 'inherit',
          opacity: signingOut ? 0.6 : 1,
        }}
        onMouseEnter={e => {
          if (!signingOut) {
            e.currentTarget.style.backgroundColor = '#e57373';
            e.currentTarget.style.color = '#fff';
          }
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = '#e57373';
        }}
      >
        <LogOut size={18} />
        {!isMobile && <span>{signingOut ? 'Saindo...' : 'Sair'}</span>}
      </button>
    </nav>
  );
};

export default Navigation;