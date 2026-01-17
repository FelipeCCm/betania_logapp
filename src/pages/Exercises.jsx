import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, Dumbbell } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ExercisesPage = () => {
  const [exercises, setExercises] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('muscle_group')
      .order('name');
    
    setExercises(data || []);
  };

  const handleAddExercise = async (exerciseData) => {
    setLoading(true);
    const { error } = await supabase
      .from('exercises')
      .insert([exerciseData]);

    setLoading(false);

    if (!error) {
      loadExercises();
      setShowAddForm(false);
      alert('Exercício adicionado com sucesso!');
    } else {
      alert('Erro ao adicionar exercício: ' + error.message);
    }
  };

  const handleUpdateExercise = async (id, exerciseData) => {
    setLoading(true);
    const { error } = await supabase
      .from('exercises')
      .update(exerciseData)
      .eq('id', id);

    setLoading(false);

    if (!error) {
      loadExercises();
      setEditingExercise(null);
      alert('Exercício atualizado com sucesso!');
    } else {
      alert('Erro ao atualizar exercício: ' + error.message);
    }
  };

  const handleDeleteExercise = async (exercise) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${exercise.name}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from('exercises')
      .delete()
      .eq('id', exercise.id);

    setLoading(false);

    if (!error) {
      loadExercises();
      alert('Exercício excluído com sucesso!');
    } else {
      alert('Erro ao excluir exercício: ' + error.message);
    }
  };

  // Agrupar exercícios por grupo muscular
  const groupedExercises = exercises.reduce((acc, exercise) => {
    const group = exercise.muscle_group || 'Sem Grupo';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(exercise);
    return acc;
  }, {});

  return (
    <div>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
          Gerenciar Exercícios
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
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
          Novo Exercício
        </button>
      </div>

      {/* Modal Adicionar Exercício */}
      {showAddForm && (
        <ExerciseFormModal
          onClose={() => setShowAddForm(false)}
          onSave={handleAddExercise}
          loading={loading}
        />
      )}

      {/* Lista de Exercícios Agrupados */}
      {exercises.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          backgroundColor: '#2a2b2c',
          borderRadius: '12px',
          border: '2px dashed #3a3b3c'
        }}>
          <Dumbbell size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#999', fontSize: '1.1rem' }}>
            Nenhum exercício cadastrado ainda. Clique em "Novo Exercício" para começar!
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {Object.entries(groupedExercises).map(([muscleGroup, groupExercises]) => (
            <div key={muscleGroup}>
              <h3 style={{ 
                fontSize: '1.5rem', 
                color: '#f9ab2d', 
                marginBottom: '1rem',
                borderBottom: '2px solid #3a3b3c',
                paddingBottom: '0.5rem'
              }}>
                {muscleGroup} ({groupExercises.length})
              </h3>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 300px), 1fr))',
                gap: '1rem'
              }}>
                {groupExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isEditing={editingExercise === exercise.id}
                    onEdit={() => setEditingExercise(exercise.id)}
                    onCancelEdit={() => setEditingExercise(null)}
                    onSave={(data) => handleUpdateExercise(exercise.id, data)}
                    onDelete={() => handleDeleteExercise(exercise)}
                    loading={loading}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Modal de Formulário para Adicionar
const ExerciseFormModal = ({ onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    muscle_group: ''
  });

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.muscle_group.trim()) {
      alert('Preencha o nome e o grupo muscular!');
      return;
    }
    onSave(formData);
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
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '2rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '500px',
        border: '2px solid #f9ab2d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#f9ab2d', margin: 0 }}>Adicionar Novo Exercício</h3>
          <button
            onClick={onClose}
            disabled={loading}
            style={{ background: 'none', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
            Nome do Exercício *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Supino Reto"
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
            Grupo Muscular *
          </label>
          <input
            type="text"
            value={formData.muscle_group}
            onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
            placeholder="Ex: Peito"
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

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#f9ab2d',
              border: '1px solid #f9ab2d',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: loading ? '#999' : '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Card de Exercício
const ExerciseCard = ({ 
  exercise, 
  isEditing, 
  onEdit, 
  onCancelEdit, 
  onSave, 
  onDelete,
  loading 
}) => {
  const [formData, setFormData] = useState({
    name: exercise.name,
    muscle_group: exercise.muscle_group
  });

  const handleSave = () => {
    if (!formData.name.trim() || !formData.muscle_group.trim()) {
      alert('Preencha o nome e o grupo muscular!');
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
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#f9ab2d', 
            fontSize: '0.875rem',
            fontWeight: 'bold' 
          }}>
            Nome do Exercício *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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

        <div style={{ marginBottom: '1rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            color: '#f9ab2d', 
            fontSize: '0.875rem',
            fontWeight: 'bold' 
          }}>
            Grupo Muscular *
          </label>
          <input
            type="text"
            value={formData.muscle_group}
            onChange={(e) => setFormData({ ...formData, muscle_group: e.target.value })}
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

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onCancelEdit}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <X size={16} />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: loading ? '#999' : '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '6px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <Save size={16} />
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
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{ 
          fontSize: '1.25rem', 
          color: '#ffffff', 
          margin: '0 0 0.5rem 0',
          wordBreak: 'break-word'
        }}>
          {exercise.name}
        </h4>
        <p style={{ 
          color: '#f9ab2d', 
          margin: 0,
          fontSize: '0.875rem',
          fontWeight: 'bold'
        }}>
          {exercise.muscle_group}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#f9ab2d',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Edit2 size={16} />
          Editar
        </button>
        <button
          onClick={onDelete}
          style={{
            flex: 1,
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            cursor: 'pointer',
            color: '#ff4444',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}
        >
          <Trash2 size={16} />
          Excluir
        </button>
      </div>
    </div>
  );
};

export default ExercisesPage;