import React, { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import StudentList from '../components/StudentList';
import StudentForm from '../components/StudentForm';
import StudentProfile from './StudentProfile';
import { supabase } from '../lib/supabase';

const StudentsPage = ({ students, onUpdate, exercises }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const handleDelete = async (studentId) => {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', studentId);

    if (!error) {
      onUpdate();
      alert('Aluno excluído com sucesso!');
    } else {
      alert('Erro ao excluir aluno: ' + error.message);
    }
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
  };

  // Filtrar alunos por nome, email ou telefone
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.phone && student.phone.includes(searchTerm))
  );

  // Se um aluno foi selecionado, mostra o perfil
  if (selectedStudent) {
    if (!exercises || exercises.length === 0) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#f9ab2d' }}>Carregando exercícios...</p>
        </div>
      );
    }
    
    return (
      <StudentProfile
        student={selectedStudent}
        exercises={exercises}
        onBack={() => {
          setSelectedStudent(null);
          onUpdate();
        }}
      />
    );
  }

  // Caso contrário, mostra a lista de alunos
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
          Gerenciar Alunos
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1.5rem',
            backgroundColor: '#f9ab2d',
            color: '#1a1b1c',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '1rem'
          }}
        >
          <Plus size={20} />
          Novo Aluno
        </button>
      </div>

      {/* Barra de Busca */}
      <div style={{ marginBottom: '2rem', position: 'relative' }}>
        <Search 
          size={20} 
          color="#999" 
          style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            pointerEvents: 'none'
          }} 
        />
        <input
          type="text"
          placeholder="Buscar aluno por nome, email ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 0.75rem 0.75rem 3rem',
            backgroundColor: '#2a2b2c',
            border: '2px solid #3a3b3c',
            borderRadius: '8px',
            color: '#ffffff',
            fontSize: '1rem',
            transition: 'border-color 0.3s'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#f9ab2d';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#3a3b3c';
          }}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: '#999',
              cursor: 'pointer',
              fontSize: '1.5rem',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Limpar busca"
          >
            ×
          </button>
        )}
      </div>

      {/* Contador de Resultados */}
      {searchTerm && (
        <div style={{ 
          marginBottom: '1rem', 
          color: '#999',
          fontSize: '0.875rem'
        }}>
          {filteredStudents.length === 0 
            ? `Nenhum aluno encontrado para "${searchTerm}"`
            : filteredStudents.length === 1
            ? `1 aluno encontrado`
            : `${filteredStudents.length} alunos encontrados`
          }
        </div>
      )}

      {showForm && (
        <StudentForm 
          onClose={() => setShowForm(false)}
          onSuccess={onUpdate}
        />
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
        gap: '1.5rem'
      }}>
        <StudentList 
          students={filteredStudents} 
          onDelete={handleDelete}
          onSelectStudent={handleSelectStudent}
        />
      </div>
    </div>
  );
};

export default StudentsPage;