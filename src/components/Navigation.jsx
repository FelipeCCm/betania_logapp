import React from 'react';
import { User, TrendingUp, History, Dumbbell } from 'lucide-react';

const Navigation = ({ currentPage, onPageChange }) => {
  const pages = [
    { id: 'students', label: 'Alunos', icon: User },
    { id: 'progress', label: 'Registrar Progresso', icon: TrendingUp },
    { id: 'history', label: 'Histórico', icon: History },
    { id: 'exercises', label: 'Exercícios', icon: Dumbbell }
  ];

  return (
    <nav style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            whiteSpace: 'nowrap'
          }}
        >
          <Icon size={18} />
          <span style={{ display: window.innerWidth < 640 ? 'none' : 'inline' }}>
            {label}
          </span>
        </button>
      ))}
    </nav>
  );
};

export default Navigation;