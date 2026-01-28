import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Save, Trash2, X, Edit2, History, Search, List, Folder, FolderOpen, ArrowRight, Move } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ExerciseSetsModal from '../components/ExerciseSetsModal';

const StudentProfile = ({ student, onBack, exercises }) => {
  const [studentExercises, setStudentExercises] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isViewingExercises, setIsViewingExercises] = useState(false);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingExercise, setEditingExercise] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [showSetsModal, setShowSetsModal] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudentData();
    loadCategories();
  }, [student.id]);

  const loadCategories = async () => {
    const { data } = await supabase
      .from('exercise_categories')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: true });

    setCategories(data || []);
  };

  const loadStudentData = async () => {
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

      const exercises = Array.from(exerciseMap.values());
      const recordIds = exercises.map(ex => ex.id);

      // Buscar todas as séries de uma vez (otimizado)
      const { data: allSets } = await supabase
        .from('exercise_sets')
        .select('progress_record_id')
        .in('progress_record_id', recordIds);

      // Contar séries por progress_record_id
      const setsCountMap = {};
      if (allSets) {
        allSets.forEach(set => {
          setsCountMap[set.progress_record_id] = (setsCountMap[set.progress_record_id] || 0) + 1;
        });
      }

      // Atribuir contagem real a cada exercício
      exercises.forEach(exercise => {
        const detailedCount = setsCountMap[exercise.id];
        exercise.actual_sets_count = detailedCount || exercise.sets || 0;
      });

      setStudentExercises(exercises);
    }
  };

  const handleCreateCategory = async (categoryName) => {
    if (!categoryName.trim()) {
      alert('Digite um nome para a categoria!');
      return;
    }

    const { data, error } = await supabase
      .from('exercise_categories')
      .insert([{
        student_id: student.id,
        name: categoryName.trim()
      }])
      .select();

    if (!error && data) {
      await loadCategories();
      setShowCategoryModal(false);
      alert('Categoria criada com sucesso!');
    } else {
      alert('Erro ao criar categoria: ' + error.message);
    }
  };

  const handleUpdateCategory = async (categoryId, newName) => {
    if (!newName.trim()) {
      alert('Digite um nome para a categoria!');
      return;
    }

    const { error } = await supabase
      .from('exercise_categories')
      .update({ name: newName.trim() })
      .eq('id', categoryId);

    if (!error) {
      await loadCategories();
      setEditingCategory(null);
      alert('Categoria atualizada!');
    } else {
      alert('Erro ao atualizar categoria: ' + error.message);
    }
  };

  const handleDeleteCategory = async (categoryId, categoryName) => {
    if (!window.confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Os exercícios não serão deletados, apenas ficarão sem categoria.`)) {
      return;
    }

    const { error } = await supabase
      .from('exercise_categories')
      .delete()
      .eq('id', categoryId);

    if (!error) {
      await loadCategories();
      await loadStudentData();
      setSelectedCategory(null);
      setIsViewingExercises(false);
      alert('Categoria excluída!');
    } else {
      alert('Erro ao excluir categoria: ' + error.message);
    }
  };

  const handleMoveExercise = async (exerciseRecordId, categoryId) => {
    const { error } = await supabase
      .from('progress_records')
      .update({ category_id: categoryId })
      .eq('id', exerciseRecordId);

    if (!error) {
      await loadStudentData();
      setShowMoveModal(null);
      alert('Exercício movido com sucesso!');
    } else {
      alert('Erro ao mover exercício: ' + error.message);
    }
  };

  const handleAddExercise = async (exerciseId) => {
    const exists = studentExercises.some(ex => ex.exercise_id === exerciseId);
    if (exists) {
      alert('Este aluno já tem este exercício cadastrado!');
      return;
    }

    const { data, error } = await supabase
      .from('progress_records')
      .insert([{
        student_id: student.id,
        exercise_id: exerciseId,
        category_id: selectedCategory,
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
      reps: updatedData.reps || '', // ← MUDOU AQUI: não converte para número
      sets: parseInt(updatedData.sets) || 0,
      notes: updatedData.notes || '',
      recorded_at: new Date().toISOString()
    })
    .eq('id', exerciseRecord.id);

  if (!error) {
    loadStudentData();
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
      loadStudentData();
      alert('Exercício removido!');
    } else {
      alert('Erro ao remover: ' + error.message);
    }
  };

  const getExerciseName = (id) => exercises.find(e => e.id === id)?.name || 'Desconhecido';
  const getMuscleGroup = (id) => exercises.find(e => e.id === id)?.muscle_group || '';

  const availableExercises = exercises.filter(exercise => 
    !studentExercises.some(se => se.exercise_id === exercise.id)
  );

  const filteredExercises = availableExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.muscle_group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exercisesInCategory = selectedCategory
    ? studentExercises.filter(ex => ex.category_id === selectedCategory)
    : studentExercises.filter(ex => !ex.category_id);

  const uncategorizedCount = studentExercises.filter(ex => !ex.category_id).length;

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={isViewingExercises ? () => {
            setIsViewingExercises(false);
            setSelectedCategory(null);
          } : onBack}
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
          {isViewingExercises ? 'Voltar para categorias' : 'Voltar'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
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

      {/* Vista de Categorias */}
      {!isViewingExercises && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
              Categorias de Exercícios
            </h2>
            <button
              onClick={() => setShowCategoryModal(true)}
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
              Nova Categoria
            </button>
          </div>

          {/* Grid de Categorias */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Exercícios sem categoria */}
            {uncategorizedCount > 0 && (
              <CategoryCard
                category={{ id: null, name: 'Exercícios sem categoria' }}
                count={uncategorizedCount}
                onSelect={() => {
                  setSelectedCategory(null);
                  setIsViewingExercises(true);
                }}
                isUncategorized={true}
              />
            )}

            {/* Categorias do usuário */}
            {categories.map(category => (
              <CategoryCard
                key={category.id}
                category={category}
                count={studentExercises.filter(ex => ex.category_id === category.id).length}
                onSelect={() => {
                  setSelectedCategory(category.id);
                  setIsViewingExercises(true);
                }}
                onEdit={() => setEditingCategory(category.id)}
                onDelete={() => handleDeleteCategory(category.id, category.name)}
                isEditing={editingCategory === category.id}
                onSaveEdit={(newName) => handleUpdateCategory(category.id, newName)}
                onCancelEdit={() => setEditingCategory(null)}
              />
            ))}

            {categories.length === 0 && uncategorizedCount === 0 && (
              <div style={{
                gridColumn: '1 / -1',
                textAlign: 'center',
                padding: '3rem',
                backgroundColor: '#2a2b2c',
                borderRadius: '12px',
                border: '2px dashed #3a3b3c'
              }}>
                <Folder size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
                <p style={{ color: '#999', fontSize: '1.1rem', marginBottom: '1rem' }}>
                  Nenhuma categoria criada ainda!
                </p>
                <p style={{ color: '#666', fontSize: '0.9rem' }}>
                  Crie categorias para organizar os exercícios do aluno
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Vista de Exercícios dentro de uma categoria */}
      {isViewingExercises && (
        <>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f9ab2d', margin: 0 }}>
              {selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 'Exercícios sem categoria'}
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
        </>
      )}

      {/* Modal Adicionar Exercício */}
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

      {/* Modal de Séries */}
      {showSetsModal && (
        <ExerciseSetsModal
          progressRecord={showSetsModal}
          exerciseName={getExerciseName(showSetsModal.exercise_id)}
          studentName={student.name}
          onClose={() => setShowSetsModal(null)}
          onSave={() => {
            setShowSetsModal(null);
            loadStudentData();
          }}
        />
      )}

      {/* Modal Criar/Editar Categoria */}
      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={handleCreateCategory}
        />
      )}

      {/* Modal Mover Exercício */}
      {showMoveModal && (
        <MoveExerciseModal
          exercise={showMoveModal}
          exerciseName={getExerciseName(showMoveModal.exercise_id)}
          categories={categories}
          currentCategoryId={showMoveModal.category_id}
          onClose={() => setShowMoveModal(null)}
          onMove={handleMoveExercise}
        />
      )}

      {/* Lista de Exercícios do Aluno (quando categoria selecionada) */}
      {isViewingExercises && (
        <>
          {exercisesInCategory.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '3rem',
              backgroundColor: '#2a2b2c',
              borderRadius: '12px',
              border: '2px dashed #3a3b3c'
            }}>
              <Plus size={48} color="#f9ab2d" style={{ margin: '0 auto 1rem' }} />
              <p style={{ color: '#999', fontSize: '1.1rem' }}>
                Nenhum exercício nesta categoria ainda. Clique em "Adicionar Exercício" para começar!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {exercisesInCategory.map(exerciseRecord => (
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
                  onShowSets={() => setShowSetsModal(exerciseRecord)}
                  onMove={() => setShowMoveModal(exerciseRecord)}
                  categories={categories}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Componente de Linha de Exercício
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
};

// Componente de Linha de Exercício
const ExerciseRow = ({
  exerciseRecord,
  exerciseName,
  muscleGroup,
  isEditing,
  onEdit,
  onCancelEdit,
  onSave,
  onDelete,
  onShowHistory,
  onShowSets,
  onMove,
  categories
}) => {
  const isMobile = useIsMobile();
  const [formData, setFormData] = useState({
  weight: exerciseRecord.weight === 0 ? '' : exerciseRecord.weight,
  reps: (!exerciseRecord.reps || exerciseRecord.reps === '0' || exerciseRecord.reps === 0) ? '' : exerciseRecord.reps,
  sets: exerciseRecord.sets === 0 ? '' : exerciseRecord.sets,
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
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
              placeholder="Ex: 20"
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
              type="text"
              value={formData.reps}
              onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
              placeholder="Ex: 12"
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
              placeholder="Ex: 3"
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

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={onCancelEdit}
            style={{
              flex: '1 1 150px',
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
              gap: '0.5rem',
              fontSize: '0.875rem'
            }}
          >
            <X size={18} />
            Cancelar
          </button>
          <button
            onClick={handleSave}
            style={{
              flex: '1 1 150px',
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
              gap: '0.5rem',
              fontSize: '0.875rem'
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
      border: '1px solid #3a3b3c'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        marginBottom: '1rem'
      }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', color: '#f9ab2d', margin: '0 0 0.25rem 0' }}>
            {exerciseName}
          </h3>
          <p style={{ color: '#999', margin: 0, fontSize: '0.875rem' }}>
            {muscleGroup}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>CARGA</div>
            <div style={{ fontWeight: 'bold', color: '#f9ab2d', fontSize: '1.25rem' }}>
              {exerciseRecord.weight && exerciseRecord.weight !== 0 
                ? `${exerciseRecord.weight} kg` 
                : '-'
              }
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>REPS</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
              {exerciseRecord.reps && exerciseRecord.reps !== '0' && exerciseRecord.reps !== 0 
                ? exerciseRecord.reps 
                : '-'
              }
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: '#999', marginBottom: '0.25rem' }}>SÉRIES</div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>
              {exerciseRecord.actual_sets_count && exerciseRecord.actual_sets_count !== 0
                ? exerciseRecord.actual_sets_count
                : '-'
              }
            </div>
          </div>
        </div>

        <div>
          {exerciseRecord.notes && (
            <p style={{ 
              margin: '0 0 0.5rem 0', 
              fontSize: '0.875rem', 
              color: '#bbb',
              fontStyle: 'italic'
            }}>
              {exerciseRecord.notes}
            </p>
          )}
          <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
            Atualizado: {new Date(exerciseRecord.recorded_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : (categories && categories.length > 0 ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)'),
        gap: '0.5rem',
        borderTop: '1px solid #3a3b3c',
        paddingTop: '1rem'
      }}>
        <button
          onClick={onShowSets}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #4a9eff',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#4a9eff',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        >
          <List size={18} />
          {!isMobile && 'Séries'}
        </button>
        <button
          onClick={onShowHistory}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#f9ab2d',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        >
          <History size={18} />
          {!isMobile && 'Histórico'}
        </button>
        {categories && categories.length > 0 && (
          <button
            onClick={onMove}
            style={{
              padding: '0.75rem',
              backgroundColor: 'transparent',
              border: '1px solid #9b59b6',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              color: '#9b59b6',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            <Move size={18} />
            {!isMobile && 'Mover'}
          </button>
        )}
        <button
          onClick={onEdit}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #f9ab2d',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#f9ab2d',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        >
          <Edit2 size={18} />
          {!isMobile && 'Editar'}
        </button>
        <button
          onClick={onDelete}
          style={{
            padding: '0.75rem',
            backgroundColor: 'transparent',
            border: '1px solid #ff4444',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            color: '#ff4444',
            fontWeight: 'bold',
            fontSize: '0.875rem'
          }}
        >
          <Trash2 size={18} />
          {!isMobile && 'Excluir'}
        </button>
      </div>
    </div>
  );
};

// Modal de Histórico
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

// Componente de Card de Categoria
const CategoryCard = ({ category, count, onSelect, onEdit, onDelete, isEditing, onSaveEdit, onCancelEdit, isUncategorized }) => {
  const [editName, setEditName] = useState(category.name);

  if (isEditing) {
    return (
      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '2rem',
        borderRadius: '12px',
        border: '2px solid #f9ab2d',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          autoFocus
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
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => {
              onSaveEdit(editName);
              setEditName('');
            }}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.875rem'
            }}
          >
            Salvar
          </button>
          <button
            onClick={onCancelEdit}
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.875rem'
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: '#2a2b2c',
        padding: '2rem',
        borderRadius: '12px',
        border: isUncategorized ? '2px dashed #666' : '2px solid #3a3b3c',
        cursor: 'pointer',
        transition: 'all 0.2s',
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#f9ab2d';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(249, 171, 45, 0.2)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isUncategorized ? '#666' : '#3a3b3c';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {!isUncategorized && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{
              padding: '0.5rem',
              backgroundColor: '#1a1b1c',
              border: '1px solid #f9ab2d',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Edit2 size={14} color="#f9ab2d" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{
              padding: '0.5rem',
              backgroundColor: '#1a1b1c',
              border: '1px solid #ff4444',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Trash2 size={14} color="#ff4444" />
          </button>
        </div>
      )}

      <div style={{
        width: '60px',
        height: '60px',
        borderRadius: '12px',
        backgroundColor: isUncategorized ? '#666' : '#f9ab2d',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1.5rem'
      }}>
        {isUncategorized ? (
          <List size={32} color="#1a1b1c" />
        ) : (
          <Folder size={32} color="#1a1b1c" />
        )}
      </div>

      <h3 style={{
        fontSize: '1.25rem',
        fontWeight: 'bold',
        color: '#f9ab2d',
        margin: '0 0 0.5rem 0',
        paddingRight: isUncategorized ? '0' : '5rem'
      }}>
        {category.name}
      </h3>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#999',
        fontSize: '0.875rem'
      }}>
        <span style={{
          backgroundColor: '#1a1b1c',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontWeight: 'bold',
          color: '#f9ab2d'
        }}>
          {count} {count === 1 ? 'exercício' : 'exercícios'}
        </span>
      </div>

      <div style={{
        marginTop: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        color: '#f9ab2d',
        fontSize: '0.875rem',
        fontWeight: 'bold'
      }}>
        Abrir <ArrowRight size={16} />
      </div>
    </div>
  );
};

// Componente Modal de Criar Categoria
const CategoryModal = ({ onClose, onSave }) => {
  const [categoryName, setCategoryName] = useState('');

  const handleSubmit = () => {
    onSave(categoryName);
    setCategoryName('');
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
        maxWidth: '500px',
        border: '2px solid #f9ab2d'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#f9ab2d', margin: 0 }}>
            Nova Categoria de Exercícios
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '0.5rem',
            color: '#f9ab2d',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            Nome da Categoria
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
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
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Criar Categoria
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente Modal de Mover Exercício
const MoveExerciseModal = ({ exercise, exerciseName, categories, currentCategoryId, onClose, onMove }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(currentCategoryId);

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
        maxWidth: '500px',
        border: '2px solid #9b59b6'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ color: '#9b59b6', margin: '0 0 0.5rem 0' }}>
              Mover Exercício
            </h3>
            <p style={{ color: '#999', margin: 0, fontSize: '0.875rem' }}>
              {exerciseName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} color="#ffffff" />
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            marginBottom: '1rem',
            color: '#f9ab2d',
            fontSize: '0.875rem',
            fontWeight: 'bold'
          }}>
            Selecione a categoria de destino:
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Opção sem categoria */}
            <div
              onClick={() => setSelectedCategoryId(null)}
              style={{
                padding: '1rem',
                backgroundColor: selectedCategoryId === null ? '#9b59b6' : '#1a1b1c',
                border: `2px solid ${selectedCategoryId === null ? '#9b59b6' : '#3a3b3c'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}
              onMouseEnter={(e) => {
                if (selectedCategoryId !== null) {
                  e.currentTarget.style.borderColor = '#666';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategoryId !== null) {
                  e.currentTarget.style.borderColor = '#3a3b3c';
                }
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: selectedCategoryId === null ? '#ffffff' : '#666',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <List size={20} color="#1a1b1c" />
              </div>
              <div>
                <div style={{
                  fontWeight: 'bold',
                  color: selectedCategoryId === null ? '#ffffff' : '#f9ab2d'
                }}>
                  Sem categoria
                </div>
                <div style={{ fontSize: '0.75rem', color: selectedCategoryId === null ? '#e0e0e0' : '#999' }}>
                  Exercícios não organizados
                </div>
              </div>
            </div>

            {/* Categorias disponíveis */}
            {categories.map(category => (
              <div
                key={category.id}
                onClick={() => setSelectedCategoryId(category.id)}
                style={{
                  padding: '1rem',
                  backgroundColor: selectedCategoryId === category.id ? '#9b59b6' : '#1a1b1c',
                  border: `2px solid ${selectedCategoryId === category.id ? '#9b59b6' : '#3a3b3c'}`,
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
                onMouseEnter={(e) => {
                  if (selectedCategoryId !== category.id) {
                    e.currentTarget.style.borderColor = '#f9ab2d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCategoryId !== category.id) {
                    e.currentTarget.style.borderColor = '#3a3b3c';
                  }
                }}
              >
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  backgroundColor: selectedCategoryId === category.id ? '#ffffff' : '#f9ab2d',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Folder size={20} color="#1a1b1c" />
                </div>
                <div style={{
                  fontWeight: 'bold',
                  color: selectedCategoryId === category.id ? '#ffffff' : '#f9ab2d'
                }}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: 'transparent',
              color: '#999',
              border: '1px solid #3a3b3c',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onMove(exercise.id, selectedCategoryId)}
            disabled={selectedCategoryId === currentCategoryId}
            style={{
              flex: 1,
              padding: '0.75rem',
              backgroundColor: selectedCategoryId === currentCategoryId ? '#3a3b3c' : '#9b59b6',
              color: selectedCategoryId === currentCategoryId ? '#666' : '#ffffff',
              border: 'none',
              borderRadius: '6px',
              cursor: selectedCategoryId === currentCategoryId ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            Mover Exercício
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;