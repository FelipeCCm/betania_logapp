import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

const COLORS = {
  primary: 'rgb(249, 171, 45)',
  bg: 'rgb(26, 27, 28)',
  bgDark: 'rgb(15, 16, 17)',
  border: 'rgba(249, 171, 45, 0.25)',
  muted: '#9ca3af',
  danger: '#ef4444'
};

const SET_TYPES = {
  warmup: {
    label: 'Aquecimento',
    color: '#22c55e' // verde elegante
  },
  preparation: {
    label: 'Preparação',
    color: 'rgb(249, 171, 45)' // mantém o primário
  },
  valid_1: {
    label: 'Série Válida 1',
    color: '#ef4444'
  },
  valid_2: {
    label: 'Série Válida 2',
    color: '#ef4444'
  },
  valid_3: {
    label: 'Série Válida 3',
    color: '#ef4444'
  }
};

const ExerciseSetsModal = ({
  progressRecord,
  exerciseName,
  studentName,
  onClose,
  onSave
}) => {
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    loadSets();
  }, [progressRecord.id]);

  const loadSets = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('progress_record_id', progressRecord.id)
      .order('set_number');

    if (data?.length) {
      setSets(data);
    } else {
      const legacy = Array.from({ length: progressRecord.sets || 0 }).map(
        (_, i) => ({
          set_number: i,
          set_type: 'valid_1',
          weight: progressRecord.weight,
          reps: progressRecord.reps,
          notes: ''
        })
      );
      setSets(legacy);
    }

    setLoading(false);
  };

  const updateSet = (index, field, value) => {
    const copy = [...sets];
    copy[index] = { ...copy[index], [field]: value };
    setSets(copy);
  };

  const addSet = () =>
  setSets([
    ...sets,
    { set_type: 'warmup', weight: '', reps: '', notes: '' }
  ]);

  const deleteSet = (index) =>
    setSets(sets.filter((_, i) => i !== index));

  const handleSave = async () => {
    setSaving(true);

    await supabase
      .from('exercise_sets')
      .delete()
      .eq('progress_record_id', progressRecord.id);

    await supabase.from('exercise_sets').insert(
      sets.map((s, i) => ({
        progress_record_id: progressRecord.id,
        set_number: i,
        set_type: s.set_type,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        notes: s.notes || ''
      }))
    );

    if (onSave) onSave();
    setSaving(false);
    onClose();
  };

  const isMobile = window.innerWidth <= 640;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: COLORS.bg,
        borderRadius: '16px',
        border: `1px solid ${COLORS.border}`,
        padding: '1.5rem',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>

        {/* HEADER */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div>
            <h3 style={{
              color: COLORS.primary,
              margin: 0,
              fontSize: '1.4rem',
              fontWeight: 700
            }}>
              Gerenciar Séries
            </h3>
            <p style={{
              margin: 0,
              marginTop: '0.25rem',
              color: COLORS.muted,
              fontSize: '0.85rem'
            }}>
              {studentName} • {exerciseName}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: COLORS.bgDark,
              border: 'none',
              borderRadius: '8px',
              padding: '0.5rem',
              cursor: 'pointer'
            }}
          >
            <X size={20} color="#fff" />
          </button>
        </div>

        {/* LISTA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <p style={{ color: COLORS.muted, textAlign: 'center' }}>
              Carregando séries...
            </p>
          ) : (
            sets.map((set, index) => (
              <div
                key={index}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                style={{
                  backgroundColor: COLORS.bgDark,
                  borderRadius: '12px',
                  padding: '1rem',
                  border: `1px solid ${COLORS.border}`
                }}
              >
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: '0.75rem'
                }}>
                  <GripVertical size={18} color="#6b7280" />

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile
                      ? '1fr'
                      : '1.2fr 1fr 1fr',
                    gap: '0.75rem'
                  }}>
                    <select
                      value={set.set_type}
                      onChange={(e) => updateSet(index, 'set_type', e.target.value)}
                      style={{
                        backgroundColor: COLORS.bg,
                        color: SET_TYPES[set.set_type]?.color || COLORS.primary,
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.6rem',
                        fontWeight: 700
                      }}
                    >
                      {Object.entries(SET_TYPES).map(([k, v]) => (
                        <option key={k} value={k} style={{ color: v.color }}>
                          {v.label}
                        </option>
                      ))}
                    </select>

                    <input
                      type="number"
                      placeholder="Carga (kg)"
                      value={set.weight}
                      onChange={(e) => updateSet(index, 'weight', e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      type="number"
                      placeholder="Reps"
                      value={set.reps}
                      onChange={(e) => updateSet(index, 'reps', e.target.value)}
                      style={inputStyle}
                    />

                    <input
                      placeholder="Observações"
                      value={set.notes}
                      onChange={(e) => updateSet(index, 'notes', e.target.value)}
                      style={{ ...inputStyle, gridColumn: '1 / -1' }}
                    />
                  </div>

                  <button
                    onClick={() => deleteSet(index)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={18} color={COLORS.danger} />
                  </button>
                </div>

                <div style={{
                  marginTop: '0.5rem',
                  fontSize: '0.75rem',
                  color: COLORS.muted
                }}>
                  Série #{index + 1}
                </div>
              </div>
            ))
          )}
        </div>

        {/* AÇÕES */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginTop: '1.5rem'
        }}>
          <button onClick={addSet} style={actionBtn}>
            <Plus size={16} /> Adicionar Série
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              ...actionBtn,
              backgroundColor: COLORS.primary,
              color: COLORS.bgDark
            }}
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  backgroundColor: COLORS.bg,
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem',
  color: '#fff',
  fontSize: '0.85rem'
};

const actionBtn = {
  flex: '1 1 180px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.5rem',
  padding: '0.75rem',
  borderRadius: '10px',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.bgDark,
  color: COLORS.primary,
  fontWeight: 700,
  cursor: 'pointer'
};

export default ExerciseSetsModal;
