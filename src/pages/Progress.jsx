import React, { useState, useEffect } from 'react';
import { TrendingUp, Folder } from 'lucide-react';
import { supabase } from '../lib/supabase';

const ProgressPage = ({ students, exercises, onUpdate }) => {
  const [formData, setFormData] = useState({
    student_id: '',
    exercise_id: '',
    category_id: '',
    weight: '',
    reps: '',
    sets: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  // Carregar categorias quando o aluno for selecionado
  useEffect(() => {
    const loadCategories = async () => {
      if (!formData.student_id) {
        setCategories([]);
        return;
      }

      const { data } = await supabase
        .from('exercise_categories')
        .select('*')
        .eq('student_id', formData.student_id)
        .order('created_at', { ascending: true });

      setCategories(data || []);
    };

    loadCategories();
  }, [formData.student_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('progress_records')
      .insert([{
        student_id: formData.student_id,
        exercise_id: formData.exercise_id,
        category_id: formData.category_id || null,
        weight: parseFloat(formData.weight),
        reps: parseInt(formData.reps),
        sets: parseInt(formData.sets),
        notes: formData.notes || ''
      }]);

    setLoading(false);

    if (!error) {
      setFormData({
        student_id: '',
        exercise_id: '',
        category_id: '',
        weight: '',
        reps: '',
        sets: '',
        notes: ''
      });
      setCategories([]);
      onUpdate();
      alert('Progresso registrado com sucesso!');
    } else {
      alert('Erro ao registrar progresso: ' + error.message);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f9ab2d', marginBottom: '2rem' }}>
        Registrar Progresso
      </h2>

      <div style={{
        backgroundColor: '#2a2b2c',
        padding: '2rem',
        borderRadius: '12px',
        border: '2px solid #f9ab2d'
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
              Aluno *
            </label>
            <select
              required
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value, category_id: '' })}
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
              <option value="">Selecione um aluno</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.name}</option>
              ))}
            </select>
          </div>

          {formData.student_id && categories.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#f9ab2d',
                fontWeight: 'bold'
              }}>
                <Folder size={18} />
                Categoria (Opcional)
              </label>
              <select
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
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
                <option value="">Sem categoria</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.75rem',
                color: '#999',
                fontStyle: 'italic'
              }}>
                Se nenhuma categoria for selecionada, o exercício aparecerá em "Exercícios sem categoria"
              </p>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
              Exercício *
            </label>
            <select
              required
              value={formData.exercise_id}
              onChange={(e) => setFormData({ ...formData, exercise_id: e.target.value })}
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
              <option value="">Selecione um exercício</option>
              {exercises.map(exercise => (
                <option key={exercise.id} value={exercise.id}>
                  {exercise.name} ({exercise.muscle_group})
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
              alignItems: 'stretch'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '24px',
                    marginBottom: '0.5rem',
                    color: '#f9ab2d',
                    fontWeight: 'bold'
                  }}
                >
                  Carga (kg)*
                </label>


                <input
                  type="number"
                  step="0.5"
                  required
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    height: '24px',
                    marginBottom: '0.5rem',
                    color: '#f9ab2d',
                    fontWeight: 'bold'
                  }}
                >
                  Repetições*
                </label>

                <input
                  type="number"
                  required
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

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '24px',
                  marginBottom: '0.5rem',
                  color: '#f9ab2d',
                  fontWeight: 'bold'
                }}
              >
                Séries*
              </label>

              <input
                type="number"
                required
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

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#f9ab2d', fontWeight: 'bold' }}>
              Observações
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
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
              placeholder="Ex: Executou com boa forma, sentiu dificuldade na última série..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '1rem',
              backgroundColor: loading ? '#999' : '#f9ab2d',
              color: '#1a1b1c',
              border: 'none',
              borderRadius: '8px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              fontSize: '1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={20} />
            {loading ? 'Registrando...' : 'Registrar Progresso'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProgressPage;