import React, { useState, useEffect } from 'react';
import { History as HistoryIcon, Calendar } from 'lucide-react';

const HistoryPage = ({ students, exercises, progressRecords }) => {
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedExercise, setSelectedExercise] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filteredRecords = progressRecords.filter(record => {
    if (selectedStudent && record.student_id !== selectedStudent) return false;
    if (selectedExercise && record.exercise_id !== selectedExercise) return false;
    return true;
  });

  const getStudentName = (id) => students.find(s => s.id === id)?.name || 'Desconhecido';
  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Desconhecido';

  return (
    <div>
      <h2 style={{
        fontSize: isMobile ? '1.5rem' : '2rem',
        fontWeight: 'bold',
        color: '#f9ab2d',
        marginBottom: '1.5rem'
      }}>
        Histórico de Progressão
      </h2>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '1.25rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        border: '1px solid #3a3b3c'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: '1rem'
        }}>
          <div>
            <label style={{ color: '#f9ab2d', fontWeight: 'bold' }}>
              Filtrar por Aluno
            </label>
            <select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="">Todos</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ color: '#f9ab2d', fontWeight: 'bold' }}>
              Filtrar por Exercício
            </label>
            <select
              value={selectedExercise}
              onChange={(e) => setSelectedExercise(e.target.value)}
              style={{
                width: '100%',
                marginTop: '0.5rem',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#fff'
              }}
            >
              <option value="">Todos</option>
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id}>{exercise.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {filteredRecords.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '2.5rem',
          backgroundColor: '#2a2b2c',
          borderRadius: '12px',
          border: '2px dashed #3a3b3c'
        }}>
          <HistoryIcon size={48} color="#f9ab2d" />
          <p style={{ color: '#999', marginTop: '1rem' }}>
            Nenhum registro encontrado
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredRecords.map(record => (
            <div
              key={record.id}
              style={{
                backgroundColor: '#2a2b2c',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid #3a3b3c',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <strong style={{ color: '#f9ab2d' }}>
                {getStudentName(record.student_id)}
              </strong>

              <span>{getExerciseName(record.exercise_id)}</span>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.9rem'
              }}>
                <span><strong>Carga:</strong> {record.weight} kg</span>
                <span><strong>Reps:</strong> {record.reps}x</span>
                <span><strong>Séries:</strong> {record.sets}</span>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                color: '#ccc'
              }}>
                <Calendar size={14} color="#f9ab2d" />
                {new Date(record.recorded_at).toLocaleDateString('pt-BR')}
              </div>

              {record.notes && (
                <div style={{
                  fontSize: '0.85rem',
                  color: '#bbb',
                  fontStyle: 'italic'
                }}>
                  {record.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
