import React, { useState } from 'react';
import { History as HistoryIcon, Calendar } from 'lucide-react';

const HistoryPage = ({ students, exercises, progressRecords }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');

  const filteredRecords = progressRecords.filter(record => {
    if (selectedStudent && record.student_id !== selectedStudent) return false;
    if (selectedExercise && record.exercise_id !== selectedExercise) return false;
    return true;
  });

  const getStudentName = (id) => students.find(s => s.id === id)?.name || 'Desconhecido';
  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Desconhecido';

  return (
    <div>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f9ab2d', marginBottom: '2rem' }}>
        Histórico de Progressão
      </h2>

      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #3a3b3c'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
              Filtrar por Aluno
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            >
              <option value="">Todos os alunos</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
              Filtrar por Exercício
            </label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            >
              <option value="">Todos os exercícios</option>
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredRecords.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#2a2b2c',
          borderRadius: '12px',
          border: '2px dashed #3a3b3c'
        }}>
          <HistoryIcon size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#999', fontSize: '1.1rem' }}>
            Nenhum registro encontrado. Comece registrando progressos!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRecords.map(record => (
            <div
              key={record.id}
              style={{
                backgroundColor: '#2a2b2c',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #3a3b3c',
                display: 'grid',
                gridTemplateColumns: '2fr 2fr 1fr 1fr 1fr 3fr',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>ALUNO</div>
                <div style={{ fontWeight: 'bold', color: '#f9ab2d' }}>
                  {getStudentName(record.student_id)}
                </div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>EXERCÍCIO</div>
                <div style={{ fontWeight: 'bold' }}>{getExerciseName(record.exercise_id)}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>CARGA</div>
                <div style={{ fontWeight: 'bold', color: '#f9ab2d' }}>{record.weight} kg</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>REPS</div>
                <div style={{ fontWeight: 'bold' }}>{record.reps}x</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>SÉRIES</div>
                <div style={{ fontWeight: 'bold' }}>{record.sets}</div>
              </div>
              
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>DATA</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={16} color="#f9ab2d" />
                  {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
                </div>
                {record.notes && (
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.875rem', 
                    color: '#bbb',
                    fontStyle: 'italic' 
                  }}>
                    {record.notes}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;