import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, X, Edit2, History, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

const StudentProfile = ({ student, onBack, exercises }) => {
  const [studentExercises, setStudentExercises] = useState([]);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudentExercises();
  }, [student.id]);

  const loadStudentExercises = async () => {
    const { data: progressData } = await supabase
      .from('progress_records')
      .select('*')
      .eq('student_id', student.id)
      .order('recorded_at', { ascending: false });

    if (progressData) {
      const exerciseMap = new Map();
      progressData.forEach(record => {
        if (!exerciseMap.has(record.exercise_id)) {
          exerciseMap.set(record.exercise_id, record);
        }
      });
      
      setStudentExercises(Array.from(exerciseMap.values()));
    }
  };

  const handleAddExercise = async (exerciseId) => {
    // Verificar se já existe
    const exists = studentExercises.some(ex => ex.exercise_id === exerciseId);
    if (exists) {
      alert('Este aluno já tem este exercício cadastrado!');
      return;
    }

    // Criar um registro inicial
    const { data, error } = await supabase
      .from('progress_records')
      .insert([{
        student_id: student.id,
        exercise_id: exerciseId,
        weight: 0,
        reps: 0,
        sets: 0,
        notes: ''
      }])
      .select();

    if (!error && data) {
      setStudentExercises([...studentExercises, data[0]]);
      setShowAddExercise(false);
      setSearchTerm('');
      // Iniciar edição imediatamente
      setEditingExercise(data[0].id);
    } else {
      alert('Erro ao adicionar exercício: ' + error.message);
    }
  };

  const handleUpdateExercise = async (exerciseRecord, updatedData) => {
    const { error } = await supabase
      .from('progress_records')
      .update({
        weight: parseFloat(updatedData.weight) || 0,
        reps: parseInt(updatedData.reps) || 0,
        sets: parseInt(updatedData.sets) || 0,
        notes: updatedData.notes || '',
        recorded_at: new Date().toISOString()
      })
      .eq('id', exerciseRecord.id);

    if (!error) {
      loadStudentExercises();
      setEditingExercise(null);
      alert('Exercício atualizado com sucesso!');
    } else {
      alert('Erro ao atualizar: ' + error.message);
    }
  };

  const handleDeleteExercise = async (exerciseRecord) => {
    const exercise = exercises.find(e => e.id === exerciseRecord.exercise_id);
    if (!window.confirm(`Tem certeza que deseja remover ${exercise?.name}? Todos os registros históricos deste exercício serão mantidos.`)) {
      return;
    }

    const { error } = await supabase
      .from('progress_records')
      .delete()
      .eq('id', exerciseRecord.id);

    if (!error) {
      loadStudentExercises();
      alert('Exercício removido!');
    } else {
      alert('Erro ao remover: ' + error.message);
    }
  };

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Desconhecido';
  const getMuscleGroup = (id) => exercises.find(e => e.id === id)?.muscle_group || '';

  // Filtrar exercícios disponíveis (que ainda não foram adicionados)
  const availableExercises = exercises.filter(exercise => 
    !studentExercises.some(se => se.exercise_id === exercise.id)
  );

  // Filtrar por busca
  const filteredExercises = availableExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: 'transparent',
            color: '#f9ab2d',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer',
            marginBottom: '1rem',
            fontSize: '1rem'
          }}
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#f9ab2d',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.5rem',
            fontWeight: 'bold',
            color: '#1a1b1c'
          }}>
            {student.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
              {student.name}
            </h1>
            {student.email && <p style={{ color: '#999', margin: '0.25rem 0' }}>📧 {student.email}</p>}
            {student.phone && <p style={{ color: '#999', margin: '0.25rem 0' }}>📱 {student.phone}</p>}
          </div>
        </div>
      </div>

      {/* Botão Adicionar Exercício */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
          Exercícios e Progresso Atual
        </h2>
        <button
          onClick={() => setShowAddExercise(true)}
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
          Adicionar Exercício
        </button>
      </div>

      {/* Modal Adicionar Exercício - VERSÃO MELHORADA */}
      {showAddExercise && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '2rem'
        }}>
          <div style={{
            backgroundColor: '#2a2b2c',
            padding: '2rem',
            borderRadius: '12px',
            width: '100%',
            maxWidth: '800px',
            maxHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            border: '2px solid #f9ab2d'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ color: '#f9ab2d', margin: 0 }}>
                Adicionar Exercício para {student.name}
              </h3>
              <button
                onClick={() => {
                  setShowAddExercise(false);
                  setSearchTerm('');
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={24} color="#ffffff" />
              </button>
            </div>

            {/* Barra de Busca */}
            <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
              <Search 
                size={20} 
                color="#999" 
                style={{ 
                  position: 'absolute', 
                  left: '1rem', 
                  top: '50%', 
                  transform: 'translateY(-50%)' 
                }} 
              />
              <input
                type="text"
                placeholder="Buscar exercício por nome ou grupo muscular..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 0.75rem 0.75rem 3rem',
                  backgroundColor: '#1a1b1c',
                  border: '1px solid #3a3b3c',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '1rem'
                }}
              />
            </div>

            {/* Lista de Exercícios Disponíveis */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
              gap: '1rem'
            }}>
              {filteredExercises.length === 0 ? (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#999'
                }}>
                  {availableExercises.length === 0 ? (
                    <>
                      <Plus size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
                      <p>Todos os exercícios já foram adicionados!</p>
                    </>
                  ) : (
                    <>
                      <Search size={48} color="#999" style={{ margin: '0 auto 1rem' }} />
                      <p>Nenhum exercício encontrado com "{searchTerm}"</p>
                    </>
                  )}
                </div>
              ) : (
                filteredExercises.map(exercise => (
                  <div
                    key={exercise.id}
                    onClick={() => handleAddExercise(exercise.id)}
                    style={{
                      backgroundColor: '#1a1b1c',
                      padding: '1.5rem',
                      borderRadius: '8px',
                      border: '2px solid #3a3b3c',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#f9ab2d';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#3a3b3c';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      backgroundColor: '#f9ab2d',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      marginBottom: '1rem'
                    }}>
                      💪
                    </div>
                    <h4 style={{ 
                      color: '#f9ab2d', 
                      margin: '0 0 0.5rem 0',
                      fontSize: '1.1rem'
                    }}>
                      {exercise.name}
                    </h4>
                    <p style={{ 
                      color: '#999', 
                      margin: 0,
                      fontSize: '0.875rem'
                    }}>
                      {exercise.muscle_group}
                    </p>
                    <div style={{
                      marginTop: '1rem',
                      padding: '0.5rem',
                      backgroundColor: '#2a2b2c',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#f9ab2d',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      Clique para adicionar
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Histórico */}
      {showHistory && (
        <HistoryModal
          student={student}
          exerciseId={showHistory}
          exerciseName={getExerciseName(showHistory)}
          onClose={() => setShowHistory(null)}
        />
      )}

      {/* Lista de Exercícios do Aluno */}
      {studentExercises.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#2a2b2c',
          borderRadius: '12px',
          border: '2px dashed #3a3b3c'
        }}>
          <Plus size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#999', fontSize: '1.1rem' }}>
            Nenhum exercício cadastrado ainda. Clique em "Adicionar Exercício" para começar!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {studentExercises.map(exerciseRecord => (
            <ExerciseRow
              key={exerciseRecord.id}
              exerciseRecord={exerciseRecord}
              exerciseName={getExerciseName(exerciseRecord.exercise_id)}
              muscleGroup={getMuscleGroup(exerciseRecord.exercise_id)}
              isEditing={editingExercise === exerciseRecord.id}
              onEdit={() => setEditingExercise(exerciseRecord.id)}
              onCancelEdit={() => setEditingExercise(null)}
              onSave={(data) => handleUpdateExercise(exerciseRecord, data)}
              onDelete={() => handleDeleteExercise(exerciseRecord)}
              onShowHistory={() => setShowHistory(exerciseRecord.exercise_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Componente de Linha de Exercício (mantém o mesmo)
const ExerciseRow = ({ 
  exerciseRecord, 
  exerciseName, 
  muscleGroup, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onSave, 
  onDelete,
  onShowHistory 
}) => {
  const [formData, setFormData] = useState({
    weight: exerciseRecord.weight,
    reps: exerciseRecord.reps,
    sets: exerciseRecord.sets,
    notes: exerciseRecord.notes || ''
  });

  const handleSave = () => {
    if (!formData.weight || !formData.reps || !formData.sets) {
      alert('Preencha carga, repetições e séries!');
      return;
    }
    onSave(formData);
  };

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '2px solid #f9ab2d'
      }}>
        <div style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#f9ab2d', margin: '0 0 0.25rem 0' }}>
            {exerciseName}
          </h3>
          <p style={{ color: '#999', margin: 0, fontSize: '0.875rem' }}>
            {muscleGroup}
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr 1fr', 
          gap: '1rem', 
          marginBottom: '1rem' 
        }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#f9ab2d', 
              fontSize: '0.875rem',
              fontWeight: 'bold' 
            }}>
              Carga (kg) *
            </label>
            <input
              type="number"
              step="0.5"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#f9ab2d', 
              fontSize: '0.875rem',
              fontWeight: 'bold' 
            }}>
              Repetições *
            </label>
            <input
              type="number"
              value={formData.reps}
              onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              color: '#f9ab2d', 
              fontSize: '0.875rem',
              fontWeight: 'bold' 
            }}>
              Séries *
            </label>
            <input
              type="number"
              value={formData.sets}
              onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                backgroundColor: '#1a1b1c',
                border: '1px solid #3a3b3c',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '1rem'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#f9ab2d', 
            fontSize: '0.875rem',
            fontWeight: 'bold' 
          }}>
            Observações
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            style={{
              width: '100%',
              padding: '0.75rem',
              backgroundColor: '#1a1b1c',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '1rem',
              resize: 'vertical'
            }}
            placeholder="Ex: Sentiu dificuldade, aumentar carga na próxima..."
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onCancelEdit}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Save size={18} />
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: '#2a2b2c',
      padding: '1.5rem',
      borderRadius: '12px',
      border: '1px solid #3a3b3c',
      display: 'grid',
      gridTemplateColumns: '2fr 1fr 1fr 1fr 2fr auto',
      gap: '1.5rem',
      alignItems: 'center'
    }}>
      <div>
        <h3 style={{ fontSize: '1.25rem', color: '#f9ab2d', margin: '0 0 0.25rem 0' }}>
          {exerciseName}
        </h3>
        <p style={{ color: '#999', margin: 0, fontSize: '0.875rem' }}>
          {muscleGroup}
        </p>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>CARGA</div>
        <div style={{ fontWeight: 'bold', color: '#f9ab2d', fontSize: '1.25rem' }}>
          {exerciseRecord.weight} kg
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>REPS</div>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {exerciseRecord.reps}x
        </div>
      </div>

      <div>
        <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>SÉRIES</div>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
          {exerciseRecord.sets}
        </div>
      </div>

      <div>
        {exerciseRecord.notes && (
          <p style={{ 
            margin: 0, 
            fontSize: '0.875rem', 
            color: '#bbb',
            fontStyle: 'italic',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {exerciseRecord.notes}
          </p>
        )}
        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.75rem', color: '#666' }}>
          Atualizado: {new Date(exerciseRecord.recorded_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onShowHistory}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="Ver histórico"
        >
          <History size={18} color="#f9ab2d" />
        </button>
        <button
          onClick={onEdit}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="Editar"
        >
          <Edit2 size={18} color="#f9ab2d" />
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '0.5rem',
            backgroundColor: 'transparent',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
          title="Excluir"
        >
          <Trash2 size={18} color="#ff4444" />
        </button>
      </div>
    </div>
  );
};

// Modal de Histórico (mantém o mesmo do código anterior)
const HistoryModal = ({ student, exerciseId, exerciseName, onClose }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('progress_records')
      .select('*')
      .eq('student_id', student.id)
      .eq('exercise_id', exerciseId)
      .order('recorded_at', { ascending: false });

    setHistory(data || []);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '2rem'
    }}>
      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '900px',
        maxHeight: '80vh',
        overflow: 'auto',
        border: '2px solid #f9ab2d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ color: '#f9ab2d', margin: '0 0 0.25rem 0' }}>
              Histórico Completo
            </h3>
            <p style={{ color: '#999', margin: 0 }}>
              {student.name} • {exerciseName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {history.map((record, index) => (
            <div
              key={record.id}
              style={{
                backgroundColor: '#1a1b1c',
                padding: '1rem',
                borderRadius: '6px',
                border: index === 0 ? '2px solid #f9ab2d' : '1px solid #3a3b3c',
                display: 'grid',
                gridTemplateColumns: 'auto 1fr 1fr 1fr 2fr',
                gap: '1rem',
                alignItems: 'center'
              }}
            >
              <div style={{
                backgroundColor: index === 0 ? '#f9ab2d' : '#3a3b3c',
                color: index === 0 ? '#1a1b1c' : '#999',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}>
                {index === 0 ? 'ATUAL' : `#${history.length - index}`}
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>CARGA</div>
                <div style={{ fontWeight: 'bold', color: '#f9ab2d' }}>{record.weight} kg</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>REPS</div>
                <div style={{ fontWeight: 'bold' }}>{record.reps}x</div>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#999' }}>SÉRIES</div>
                <div style={{ fontWeight: 'bold' }}>{record.sets}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  📅 {new Date(record.recorded_at).toLocaleDateString('pt-BR')} às {new Date(record.recorded_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                {record.notes && (
                  <div style={{ fontSize: '0.75rem', color: '#bbb', fontStyle: 'italic' }}>
                    "{record.notes}"
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;