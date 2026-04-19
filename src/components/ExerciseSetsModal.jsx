import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, GripVertical, Calendar } from 'lucide-react';
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
  warmup: { label: 'Aquecimento', color: '#22c55e' },
  preparation: { label: 'Preparação', color: 'rgb(249, 171, 45)' },
  valid_1: { label: 'Série Válida 1', color: '#ef4444' },
  valid_2: { label: 'Série Válida 2', color: '#ef4444' },
  valid_3: { label: 'Série Válida 3', color: '#ef4444' }
};

const emptySet = () => ({
  set_type: 'warmup',
  weight: '',
  reps: '',
  notes: ''
});

const ExerciseSetsModal = ({
  progressRecord,
  exerciseName,
  studentName,
  onClose,
  onSave
}) => {
  // weeks: [{ weekNumber: 1, sets: [...] }, ...] ordenado por weekNumber asc
  const [weeks, setWeeks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAllWeeks, setShowAllWeeks] = useState(false);

  useEffect(() => {
    loadSets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRecord.id]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const loadSets = async () => {
    setLoading(true);

    const { data } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('progress_record_id', progressRecord.id)
      .order('week_number')
      .order('set_number');

    if (data?.length) {
      const map = new Map();
      data.forEach((s) => {
        const wk = s.week_number || 1;
        if (!map.has(wk)) map.set(wk, []);
        map.get(wk).push(s);
      });
      const grouped = Array.from(map.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([weekNumber, sets]) => ({ weekNumber, sets }));
      setWeeks(grouped);
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
      setWeeks([{ weekNumber: 1, sets: legacy.length ? legacy : [emptySet()] }]);
    }

    setLoading(false);
  };

  const lastWeekIndex = weeks.length - 1;

  const updateSet = (weekIdx, setIdx, field, value) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== weekIdx
          ? w
          : {
              ...w,
              sets: w.sets.map((s, si) =>
                si !== setIdx ? s : { ...s, [field]: value }
              )
            }
      )
    );
  };

  const addSet = (weekIdx) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== weekIdx ? w : { ...w, sets: [...w.sets, emptySet()] }
      )
    );
  };

  const deleteSet = (weekIdx, setIdx) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== weekIdx
          ? w
          : { ...w, sets: w.sets.filter((_, si) => si !== setIdx) }
      )
    );
  };

  const addWeek = () => {
    setWeeks((prev) => {
      const nextNumber = prev.length
        ? Math.max(...prev.map((w) => w.weekNumber)) + 1
        : 1;
      return [...prev, { weekNumber: nextNumber, sets: [emptySet()] }];
    });
  };

  const deleteWeek = (weekIdx) => {
    setWeeks((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((_, i) => i !== weekIdx);
    });
  };

  const handleSave = async () => {
    setSaving(true);

    await supabase
      .from('exercise_sets')
      .delete()
      .eq('progress_record_id', progressRecord.id);

    const payload = weeks.flatMap((w) =>
      w.sets.map((s, i) => ({
        progress_record_id: progressRecord.id,
        set_number: i,
        set_type: s.set_type,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        notes: s.notes || '',
        week_number: w.weekNumber
      }))
    );

    if (payload.length) {
      await supabase.from('exercise_sets').insert(payload);
    }

    if (onSave) onSave();
    setSaving(false);
    onClose();
  };

  const isMobile = window.innerWidth <= 640;
  const visibleWeeks = showAllWeeks
    ? weeks
    : weeks.length
    ? [weeks[lastWeekIndex]]
    : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem'
      }}
    >
      <div
        className="no-scrollbar"
        style={{
          width: '100%',
          maxWidth: showAllWeeks ? '1100px' : '900px',
          backgroundColor: COLORS.bg,
          borderRadius: '16px',
          border: `1px solid ${COLORS.border}`,
          padding: '1.5rem',
          maxHeight: '90vh',
          overflow: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          transition: 'max-width 0.2s ease'
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem',
            marginBottom: '1.5rem'
          }}
        >
          <div>
            <h3
              style={{
                color: COLORS.primary,
                margin: 0,
                fontSize: '1.4rem',
                fontWeight: 700
              }}
            >
              Gerenciar Séries
            </h3>
            <p
              style={{
                margin: 0,
                marginTop: '0.25rem',
                color: COLORS.muted,
                fontSize: '0.85rem'
              }}
            >
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

        {/* CONTEÚDO */}
        {loading ? (
          <p style={{ color: COLORS.muted, textAlign: 'center' }}>
            Carregando séries...
          </p>
        ) : (
          <div
            style={{
              display: showAllWeeks ? 'grid' : 'block',
              gridTemplateColumns: showAllWeeks
                ? isMobile
                  ? '1fr'
                  : 'repeat(2, minmax(0, 1fr))'
                : undefined,
              gap: '1rem'
            }}
          >
            {visibleWeeks.map((week) => {
              const weekIdx = weeks.findIndex(
                (w) => w.weekNumber === week.weekNumber
              );
              return (
                <WeekColumn
                  key={week.weekNumber}
                  week={week}
                  isMobile={isMobile}
                  compact={showAllWeeks}
                  canDelete={showAllWeeks && weeks.length > 1}
                  onUpdateSet={(setIdx, field, value) =>
                    updateSet(weekIdx, setIdx, field, value)
                  }
                  onAddSet={() => addSet(weekIdx)}
                  onDeleteSet={(setIdx) => deleteSet(weekIdx, setIdx)}
                  onDeleteWeek={() => deleteWeek(weekIdx)}
                />
              );
            })}
          </div>
        )}

        {/* AÇÕES */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            marginTop: '1.5rem'
          }}
        >
          {!showAllWeeks && weeks.length > 0 && (
            <button onClick={() => addSet(lastWeekIndex)} style={actionBtn}>
              <Plus size={16} /> Adicionar Série
            </button>
          )}

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

          <button
            onClick={() => setShowAllWeeks((v) => !v)}
            style={actionBtn}
          >
            <Calendar size={16} />
            {showAllWeeks ? 'Voltar à última semana' : 'Gerenciar Semanas'}
          </button>

          {showAllWeeks && (
            <button onClick={addWeek} style={actionBtn}>
              <Plus size={16} /> Nova Semana
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const WeekColumn = ({
  week,
  isMobile,
  compact,
  canDelete,
  onUpdateSet,
  onAddSet,
  onDeleteSet,
  onDeleteWeek
}) => {
  const stackInputs = isMobile || compact;
  return (
    <div
      style={{
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '1rem',
        backgroundColor: 'rgba(255,255,255,0.02)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        minWidth: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.5rem'
        }}
      >
        <h4
          style={{
            color: COLORS.primary,
            margin: 0,
            fontSize: '1rem',
            fontWeight: 700
          }}
        >
          Semana {week.weekNumber}
        </h4>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={onAddSet}
            title="Adicionar série nesta semana"
            style={iconBtn}
          >
            <Plus size={16} color={COLORS.primary} />
          </button>
          {canDelete && (
            <button
              onClick={onDeleteWeek}
              title="Remover esta semana"
              style={iconBtn}
            >
              <Trash2 size={16} color={COLORS.danger} />
            </button>
          )}
        </div>
      </div>

      {week.sets.length === 0 ? (
        <p
          style={{
            color: COLORS.muted,
            fontSize: '0.85rem',
            textAlign: 'center',
            padding: '0.75rem 0'
          }}
        >
          Nenhuma série nesta semana.
        </p>
      ) : (
        week.sets.map((set, index) => (
          <div
            key={index}
            style={{
              backgroundColor: COLORS.bgDark,
              borderRadius: '12px',
              padding: '1rem',
              border: `1px solid ${COLORS.border}`
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'auto minmax(0, 1fr) auto',
                gap: '0.75rem',
                alignItems: 'start'
              }}
            >
              <GripVertical size={18} color="#6b7280" />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: stackInputs ? '1fr' : '1.2fr 1fr 1fr',
                  gap: '0.75rem',
                  minWidth: 0
                }}
              >
                <select
                  value={set.set_type}
                  onChange={(e) =>
                    onUpdateSet(index, 'set_type', e.target.value)
                  }
                  style={{
                    ...selectStyle,
                    color: SET_TYPES[set.set_type]?.color || COLORS.primary
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
                  onChange={(e) =>
                    onUpdateSet(index, 'weight', e.target.value)
                  }
                  style={inputStyle}
                />

                <input
                  type="number"
                  placeholder="Reps"
                  value={set.reps}
                  onChange={(e) =>
                    onUpdateSet(index, 'reps', e.target.value)
                  }
                  style={inputStyle}
                />

                <input
                  placeholder="Observações"
                  value={set.notes}
                  onChange={(e) =>
                    onUpdateSet(index, 'notes', e.target.value)
                  }
                  style={{ ...inputStyle, gridColumn: '1 / -1' }}
                />
              </div>

              <button
                onClick={() => onDeleteSet(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Trash2 size={18} color={COLORS.danger} />
              </button>
            </div>

            <div
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: COLORS.muted
              }}
            >
              Série #{index + 1}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const inputStyle = {
  backgroundColor: COLORS.bg,
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem',
  color: '#fff',
  fontSize: '0.85rem',
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box'
};

const selectStyle = {
  backgroundColor: COLORS.bg,
  border: 'none',
  borderRadius: '8px',
  padding: '0.6rem',
  fontWeight: 700,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box'
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

const iconBtn = {
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  padding: '0.4rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

export default ExerciseSetsModal;
