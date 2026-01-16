import React from 'react';
import { User, Trash2 } from 'lucide-react';

const StudentList = ({ students, onDelete, onSelectStudent }) => {
  const handleDelete = async (e, student) => {
    e.stopPropagation(); // Previne que o click abra o perfil
    
    if (window.confirm(`Tem certeza que deseja excluir ${student.name}? Todos os registros de progresso deste aluno também serão removidos.`)) {
      onDelete(student.id);
    }
  };

  if (students.length === 0) {
    return (
      <div style={{ 
        gridColumn: '1 / -1',
        textAlign: 'center', 
        padding: '3rem',
        backgroundColor: '#2a2b2c',
        borderRadius: '12px',
        border: '2px dashed #3a3b3c'
      }}>
        <User size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: '#999', fontSize: '1.1rem' }}>
          Nenhum aluno cadastrado ainda. Clique em "Novo Aluno" para começar!
        </p>
      </div>
    );
  }

  return (
    <>
      {students.map(student => (
        <div
          key={student.id}
          onClick={() => onSelectStudent(student)}
          style={{
            backgroundColor: '#2a2b2c',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #3a3b3c',
            transition: 'transform 0.2s, border-color 0.2s',
            position: 'relative',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.borderColor = '#f9ab2d';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#3a3b3c';
          }}
        >
          {/* Botão de Excluir */}
          <button
            onClick={(e) => handleDelete(e, student)}
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: '6px',
              transition: 'background-color 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#ff4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Excluir aluno"
          >
            <Trash2 size={20} color="#ff4444" />
          </button>

          {/* Avatar e Nome */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1rem' 
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#f9ab2d',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1a1b1c'
            }}>
              {student.name.charAt(0).toUpperCase()}
            </div>
            <h3 style={{ margin: 0, fontSize: '1.25rem' }}>
              {student.name}
            </h3>
          </div>

          {/* Informações de Contato */}
          {student.email && (
            <p style={{ margin: '0.5rem 0', color: '#999' }}>
              📧 {student.email}
            </p>
          )}
          {student.phone && (
            <p style={{ margin: '0.5rem 0', color: '#999' }}>
              📱 {student.phone}
            </p>
          )}
          
          {/* Indicador de Click */}
          <div style={{
            marginTop: '1rem',
            padding: '0.5rem',
            backgroundColor: '#1a1b1c',
            borderRadius: '6px',
            textAlign: 'center',
            color: '#f9ab2d',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            Clique para ver detalhes →
          </div>
        </div>
      ))}
    </>
  );
};

export default StudentList;