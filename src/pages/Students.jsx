import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import StudentList from '../components/StudentList';
import StudentForm from '../components/StudentForm';
import StudentProfile from './StudentProfile';
import { supabase } from '../lib/supabase';

const StudentsPage = ({ students, onUpdate, exercises }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  console.log('StudentsPage - students:', students);
  console.log('StudentsPage - exercises:', exercises);
  console.log('StudentsPage - selectedStudent:', selectedStudent);

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
    console.log('handleSelectStudent chamado com:', student);
    setSelectedStudent(student);
  };

  // Se um aluno foi selecionado, mostra o perfil
  if (selectedStudent) {
    console.log('Renderizando StudentProfile');
    
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
          console.log('Voltando para lista');
          setSelectedStudent(null);
          onUpdate();
        }}
      />
    );
  }

  // Caso contrário, mostra a lista de alunos
  console.log('Renderizando lista de alunos');
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
          Gerenciar Alunos
        </h2>
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
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

      {showForm && (
        <StudentForm 
          onClose={() => setShowForm(false)}
          onSuccess={onUpdate}
        />
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '1.5rem'
      }}>
        <StudentList 
          students={students} 
          onDelete={handleDelete}
          onSelectStudent={handleSelectStudent}
        />
      </div>
    </div>
  );
};

export default StudentsPage;