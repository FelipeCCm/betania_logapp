import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, Check, Timer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTimer } from '../contexts/TimerContext';

const COLORS = {
  primary: 'rgb(249, 171, 45)',
  bg: '#1a1b1c',
  bgDark: '#0f1011',
  card: '#2a2b2c',
  border: '#3a3b3c',
  muted: '#9ca3af',
  danger: '#ef4444'
};

// Tipos de série -> letra exibida, nome completo e cor (mesma semântica do
// ExerciseSetsModal: warmup=verde, preparation=amarelo, valid_*=vermelho)
const SET_META = {
  warmup: { letter: 'A', label: 'Aquecimento', color: '#22c55e' },
  preparation: { letter: 'P', label: 'Preparação', color: 'rgb(249, 171, 45)' },
  valid_1: { letter: 'V1', label: 'Série Válida 1', color: '#ef4444' },
  valid_2: { letter: 'V2', label: 'Série Válida 2', color: '#ef4444' },
  valid_3: { letter: 'V3', label: 'Série Válida 3', color: '#ef4444' }
};

const SET_TYPE_ORDER = ['warmup', 'preparation', 'valid_1', 'valid_2', 'valid_3'];

// Presets de descanso (em segundos) para o seletor rápido
const REST_PRESETS = [30, 60, 90, 120, 180];

// Colunas da linha de série: [letra] [Kg] [Reps] [descanso] [✓]
const GRID_COLS = '34px minmax(0,1fr) minmax(0,1fr) auto 34px';

// Formata segundos como "m:ss" (ex.: 90 -> "1:30")
const formatRest = (totalSeconds) => {
  const s = Number(totalSeconds) || 0;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const emptySet = () => ({ set_type: 'valid_1', weight: '', reps: '', notes: '', rest_seconds: 0 });

const InlineSetsEditor = ({ progressRecord, onSaved, showAlert, showConfirm }) => {
  const { startWith } = useTimer();

  // weeks: [{ weekNumber, sets: [...] }] ordenado por weekNumber asc
  const [weeks, setWeeks] = useState([]);
  const [currentWeekIdx, setCurrentWeekIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // índice (na semana atual) da série com o seletor de tipo / de descanso aberto
  const [openTypePickerFor, setOpenTypePickerFor] = useState(null);
  const [openRestPickerFor, setOpenRestPickerFor] = useState(null);
  // Conclusão das séries: efêmera (por sessão). Chave: `${weekNumber}-${index}`
  const [completedKeys, setCompletedKeys] = useState(() => new Set());

  const touchRef = useRef(null);
  const rootRef = useRef(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progressRecord.id]);

  // Fecha os seletores (tipo / descanso) ao clicar fora
  useEffect(() => {
    if (openTypePickerFor === null && openRestPickerFor === null) return;
    const handler = () => {
      setOpenTypePickerFor(null);
      setOpenRestPickerFor(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openTypePickerFor, openRestPickerFor]);

  // Carrega séries (somente leitura). Não sintetiza dados legados:
  // se não houver séries cadastradas, weeks fica vazio.
  const load = async (preferredWeekNumber) => {
    setLoading(true);
    const { data } = await supabase
      .from('exercise_sets')
      .select('*')
      .eq('progress_record_id', progressRecord.id)
      .order('week_number')
      .order('set_number');

    const map = new Map();
    (data || []).forEach((s) => {
      const wk = s.week_number || 1;
      if (!map.has(wk)) map.set(wk, []);
      map.get(wk).push(s);
    });
    let grouped = Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([weekNumber, sets]) => ({ weekNumber, sets }));

    // Sem séries detalhadas em exercise_sets: exibe os dados legados do
    // progress_record (carga/reps/séries) como Semana 1, igual ao modal antigo.
    // É apenas exibição — só vira registro se o aluno clicar em Salvar.
    if (grouped.length === 0) {
      const legacyCount = Number(progressRecord.sets) || 0;
      if (legacyCount > 0) {
        const legacySets = Array.from({ length: legacyCount }).map(() => ({
          set_type: 'valid_1',
          weight: progressRecord.weight ? String(progressRecord.weight) : '',
          reps: (progressRecord.reps && progressRecord.reps !== '0') ? String(progressRecord.reps) : '',
          notes: '',
          rest_seconds: 0
        }));
        grouped = [{ weekNumber: 1, sets: legacySets }];
      }
    }

    setWeeks(grouped);
    // Seleciona a semana preferida (se existir) ou a mais recente
    if (grouped.length) {
      const idx = preferredWeekNumber
        ? grouped.findIndex((w) => w.weekNumber === preferredWeekNumber)
        : -1;
      setCurrentWeekIdx(idx >= 0 ? idx : grouped.length - 1);
    } else {
      setCurrentWeekIdx(0);
    }
    setOpenTypePickerFor(null);
    setLoading(false);
  };

  const currentWeek = weeks[currentWeekIdx];

  // --- Edição local (persiste só ao Salvar) ---
  const updateSet = (setIdx, field, value) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== currentWeekIdx
          ? w
          : { ...w, sets: w.sets.map((s, si) => (si !== setIdx ? s : { ...s, [field]: value })) }
      )
    );
  };

  const addSet = () => {
    setWeeks((prev) =>
      prev.map((w, wi) => {
        if (wi !== currentWeekIdx) return w;
        // Herda tipo e descanso da série anterior para não redigitar
        const last = w.sets[w.sets.length - 1];
        const novo = last
          ? { ...emptySet(), set_type: last.set_type, rest_seconds: Number(last.rest_seconds) || 0 }
          : emptySet();
        return { ...w, sets: [...w.sets, novo] };
      })
    );
  };

  const deleteSet = (setIdx) => {
    setWeeks((prev) =>
      prev.map((w, wi) =>
        wi !== currentWeekIdx ? w : { ...w, sets: w.sets.filter((_, si) => si !== setIdx) }
      )
    );
  };

  // Conclusão efêmera de uma série: ao marcar, inicia o timer com o descanso
  // configurado daquela série (se houver). Desmarcar apenas remove a marca.
  const toggleComplete = (setIdx) => {
    if (!currentWeek) return;
    const key = `${currentWeek.weekNumber}-${setIdx}`;
    setCompletedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
        const rest = Number(currentWeek.sets[setIdx]?.rest_seconds) || 0;
        if (rest > 0) startWith(rest);
      }
      return next;
    });
  };

  // --- Navegação / criação de semanas ---
  const goPrev = () => setCurrentWeekIdx((i) => Math.max(0, i - 1));
  const goNext = () => setCurrentWeekIdx((i) => Math.min(weeks.length - 1, i + 1));

  const createFirstWeek = () => {
    setWeeks([{ weekNumber: 1, sets: [emptySet()] }]);
    setCurrentWeekIdx(0);
  };

  const addNextWeek = () => {
    setWeeks((prev) => {
      const nextNumber = prev.length ? Math.max(...prev.map((w) => w.weekNumber)) + 1 : 1;
      // Herda a estrutura da última semana: mesmos tipos e descansos,
      // carga/reps em branco para os valores novos da semana.
      const template = prev.length ? prev[prev.length - 1].sets : [];
      const sets = template.length
        ? template.map((s) => ({
            ...emptySet(),
            set_type: s.set_type,
            rest_seconds: Number(s.rest_seconds) || 0
          }))
        : [emptySet()];
      const next = [...prev, { weekNumber: nextNumber, sets }];
      setCurrentWeekIdx(next.length - 1);
      return next;
    });
  };

  // Excluir semana: ação destrutiva imediata no banco (pois o Salvar é escopado
  // à semana atual e não conseguiria remover uma semana já navegada).
  const deleteWeek = async () => {
    if (!currentWeek) return;
    const confirmed = showConfirm
      ? await showConfirm(`Excluir a Semana ${currentWeek.weekNumber} inteira?`, {
          title: 'Excluir Semana',
          confirmText: 'Excluir',
          cancelText: 'Cancelar',
          isDanger: true
        })
      : true;
    if (!confirmed) return;

    await supabase
      .from('exercise_sets')
      .delete()
      .eq('progress_record_id', progressRecord.id)
      .eq('week_number', currentWeek.weekNumber);

    if (onSaved) onSaved();
    await load();
  };

  // Salvar: escopado à semana atual (não toca em outras semanas nem em
  // progress_records). Preserva notes de séries já existentes.
  const handleSave = async () => {
    if (!currentWeek) return;
    setSaving(true);

    await supabase
      .from('exercise_sets')
      .delete()
      .eq('progress_record_id', progressRecord.id)
      .eq('week_number', currentWeek.weekNumber);

    const payload = currentWeek.sets.map((s, i) => ({
      progress_record_id: progressRecord.id,
      set_number: i,
      set_type: s.set_type,
      weight: Number(s.weight) || 0,
      reps: Number(s.reps) || 0,
      notes: s.notes || '',
      week_number: currentWeek.weekNumber,
      rest_seconds: Number(s.rest_seconds) || 0
    }));

    if (payload.length) {
      await supabase.from('exercise_sets').insert(payload);
    }

    setSaving(false);
    if (onSaved) onSaved();
    if (showAlert) await showAlert('Séries salvas!', 'success');
    await load(currentWeek.weekNumber);
  };

  // --- Swipe horizontal para alternar semanas ---
  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY };
  };
  const onTouchEnd = (e) => {
    if (!touchRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchRef.current.x;
    const dy = t.clientY - touchRef.current.y;
    touchRef.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) goNext();
      else goPrev();
    }
  };

  // Durante o carregamento não exibimos indicador: a animação de altura do
  // contêiner (no card) cuida da transição suave até o conteúdo aparecer.
  if (loading) {
    return null;
  }

  // Estado vazio: nenhuma semana cadastrada
  if (weeks.length === 0) {
    return (
      <div style={{ padding: '1.5rem', textAlign: 'center' }}>
        <p style={{ color: COLORS.muted, margin: '0 0 1rem 0', fontSize: '0.9rem' }}>
          Nenhuma semana cadastrada ainda.
        </p>
        <button onClick={createFirstWeek} style={primaryBtn}>
          <Plus size={16} /> Criar primeira semana
        </button>
      </div>
    );
  }

  const isLastWeek = currentWeekIdx >= weeks.length - 1;

  return (
    <div ref={rootRef} style={{ paddingTop: '0.5rem' }}>
      {/* Navegação de semanas */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '0.75rem'
        }}
      >
        <button
          onClick={goPrev}
          disabled={currentWeekIdx === 0}
          aria-label="Semana anterior"
          style={{ ...navBtn, opacity: currentWeekIdx === 0 ? 0.3 : 1, cursor: currentWeekIdx === 0 ? 'default' : 'pointer' }}
        >
          <ChevronLeft size={20} color={COLORS.primary} />
        </button>

        <span style={{ color: COLORS.primary, fontWeight: 700, fontSize: '0.95rem', minWidth: '90px', textAlign: 'center' }}>
          Semana {currentWeek.weekNumber}
        </span>

        {isLastWeek ? (
          <button onClick={addNextWeek} aria-label="Criar próxima semana" title="Criar próxima semana" style={navBtn}>
            <Plus size={20} color={COLORS.primary} />
          </button>
        ) : (
          <button onClick={goNext} aria-label="Próxima semana" style={navBtn}>
            <ChevronRight size={20} color={COLORS.primary} />
          </button>
        )}
      </div>

      {/* Cabeçalho de colunas */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID_COLS,
          gap: '0.5rem',
          padding: '0 0.25rem',
          marginBottom: '0.4rem',
          fontSize: '0.7rem',
          color: COLORS.muted,
          fontWeight: 600,
          letterSpacing: '0.03em'
        }}
      >
        <span>SÉRIE</span>
        <span style={{ textAlign: 'center' }}>KG</span>
        <span style={{ textAlign: 'center' }}>REPS</span>
        <span style={{ textAlign: 'center' }}>DESC</span>
        <span />
      </div>

      {/* Linhas de séries (semana atual) */}
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}
      >
        {currentWeek.sets.length === 0 ? (
          <p style={{ color: COLORS.muted, fontSize: '0.85rem', textAlign: 'center', padding: '0.75rem 0' }}>
            Nenhuma série nesta semana.
          </p>
        ) : (
          currentWeek.sets.map((set, index) => {
            const meta = SET_META[set.set_type] || SET_META.valid_1;
            const isCompleted = completedKeys.has(`${currentWeek.weekNumber}-${index}`);
            const rest = Number(set.rest_seconds) || 0;
            return (
              <div
                key={index}
                style={{
                  display: 'grid',
                  gridTemplateColumns: GRID_COLS,
                  gap: '0.5rem',
                  alignItems: 'center',
                  opacity: isCompleted ? 0.6 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {/* Botão da letra + dropup */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenRestPickerFor(null);
                      setOpenTypePickerFor((cur) => (cur === index ? null : index));
                    }}
                    title={meta.label}
                    style={{
                      width: '34px',
                      height: '40px',
                      borderRadius: '8px',
                      border: `1px solid ${meta.color}`,
                      backgroundColor: 'transparent',
                      color: meta.color,
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 0
                    }}
                  >
                    {meta.letter}
                  </button>

                  {openTypePickerFor === index && (
                    <div
                      onMouseDown={(e) => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: 0,
                        zIndex: 30,
                        backgroundColor: COLORS.card,
                        border: `1px solid ${COLORS.border}`,
                        borderRadius: '10px',
                        padding: '0.35rem',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                        minWidth: '180px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem'
                      }}
                    >
                      {SET_TYPE_ORDER.map((key) => {
                        const m = SET_META[key];
                        const active = key === set.set_type;
                        return (
                          <button
                            key={key}
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSet(index, 'set_type', key);
                              setOpenTypePickerFor(null);
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.6rem',
                              padding: '0.5rem 0.6rem',
                              borderRadius: '6px',
                              border: 'none',
                              backgroundColor: active ? 'rgba(255,255,255,0.06)' : 'transparent',
                              cursor: 'pointer',
                              textAlign: 'left',
                              width: '100%'
                            }}
                          >
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '6px',
                                border: `1px solid ${m.color}`,
                                color: m.color,
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {m.letter}
                            </span>
                            <span style={{ color: '#fff', fontSize: '0.85rem' }}>{m.label}</span>
                          </button>
                        );
                      })}

                      <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '0.25rem 0' }} />

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenTypePickerFor(null);
                          deleteSet(index);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.6rem',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          color: COLORS.danger
                        }}
                      >
                        <Trash2 size={16} color={COLORS.danger} />
                        <span style={{ fontSize: '0.85rem' }}>Remover série</span>
                      </button>
                    </div>
                  )}
                </div>

                <input
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder="-"
                  value={set.weight}
                  onChange={(e) => updateSet(index, 'weight', e.target.value)}
                  style={cellInput}
                />

                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="-"
                  value={set.reps}
                  onChange={(e) => updateSet(index, 'reps', e.target.value)}
                  style={cellInput}
                />

                {/* Descanso (chip + dropup presets/personalizar) */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenTypePickerFor(null);
                      setOpenRestPickerFor((cur) => (cur === index ? null : index));
                    }}
                    title="Tempo de descanso"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.2rem',
                      minWidth: '40px',
                      height: '40px',
                      padding: '0 0.5rem',
                      borderRadius: '8px',
                      border: `1px solid ${rest > 0 ? COLORS.primary : COLORS.border}`,
                      backgroundColor: COLORS.bg,
                      color: rest > 0 ? COLORS.primary : COLORS.muted,
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.8rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Timer size={14} />
                    {rest > 0 && <span>{formatRest(rest)}</span>}
                  </button>

                  {openRestPickerFor === index && (
                    <RestPicker
                      value={rest}
                      onSelect={(secs) => {
                        updateSet(index, 'rest_seconds', secs);
                        setOpenRestPickerFor(null);
                      }}
                      onChangeCustom={(secs) => updateSet(index, 'rest_seconds', secs)}
                    />
                  )}
                </div>

                {/* Checkbox de conclusão (efêmero) — dispara o timer */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleComplete(index);
                  }}
                  aria-label={isCompleted ? 'Desmarcar série' : 'Marcar série como concluída'}
                  title={isCompleted ? 'Concluída' : 'Marcar como concluída'}
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    border: `1px solid ${isCompleted ? COLORS.primary : COLORS.border}`,
                    backgroundColor: isCompleted ? COLORS.primary : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    justifySelf: 'center'
                  }}
                >
                  {isCompleted && <Check size={18} color={COLORS.bgDark} strokeWidth={3} />}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Ações */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.85rem' }}>
        <button onClick={addSet} style={ghostBtn}>
          <Plus size={16} /> Adicionar Série
        </button>
        <button onClick={deleteWeek} style={{ ...ghostBtn, color: COLORS.danger, borderColor: 'rgba(239,68,68,0.5)' }}>
          <Trash2 size={16} /> Excluir Semana
        </button>
        <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.7 : 1 }}>
          <Save size={16} /> {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  );
};

const cellInput = {
  width: '100%',
  backgroundColor: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  padding: '0.55rem',
  color: '#fff',
  fontSize: '0.95rem',
  fontWeight: 600,
  textAlign: 'center',
  boxSizing: 'border-box',
  minWidth: 0
};

const navBtn = {
  background: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '8px',
  padding: '0.35rem',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
};

const ghostBtn = {
  flex: '1 1 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  padding: '0.6rem 0.75rem',
  borderRadius: '10px',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.bg,
  color: COLORS.primary,
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer'
};

const primaryBtn = {
  flex: '1 1 auto',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '0.4rem',
  padding: '0.6rem 0.75rem',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: COLORS.primary,
  color: COLORS.bgDark,
  fontWeight: 700,
  fontSize: '0.85rem',
  cursor: 'pointer'
};

// Seletor de tempo de descanso (dropup): presets + personalizar (min:seg)
const RestPicker = ({ value, onSelect, onChangeCustom }) => {
  const total = Number(value) || 0;
  const [min, setMin] = useState(String(Math.floor(total / 60)));
  const [sec, setSec] = useState(String(total % 60));

  const applyCustom = (mStr, sStr) => {
    const m = Math.max(0, parseInt(mStr, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(sStr, 10) || 0));
    onChangeCustom(m * 60 + s);
  };

  return (
    <div
      onMouseDown={(e) => e.stopPropagation()}
      style={{ ...dropup, left: 'auto', right: 0, minWidth: '190px', padding: '0.5rem' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.3rem' }}>
        {REST_PRESETS.map((secs) => {
          const active = secs === total;
          return (
            <button
              key={secs}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(secs);
              }}
              style={{ ...presetBtn, ...(active ? presetBtnActive : null) }}
            >
              {formatRest(secs)}
            </button>
          );
        })}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(0);
          }}
          style={{ ...presetBtn, ...(total === 0 ? presetBtnActive : null) }}
        >
          Sem
        </button>
      </div>

      <div style={{ height: '1px', backgroundColor: COLORS.border, margin: '0.5rem 0' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={min}
          onChange={(e) => {
            setMin(e.target.value);
            applyCustom(e.target.value, sec);
          }}
          aria-label="Minutos"
          style={restInput}
        />
        <span style={{ color: COLORS.muted, fontWeight: 700 }}>:</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={59}
          value={sec}
          onChange={(e) => {
            setSec(e.target.value);
            applyCustom(min, e.target.value);
          }}
          aria-label="Segundos"
          style={restInput}
        />
        <span style={{ color: COLORS.muted, fontSize: '0.7rem', marginLeft: '0.15rem' }}>min:seg</span>
      </div>
    </div>
  );
};

const dropup = {
  position: 'absolute',
  bottom: 'calc(100% + 6px)',
  left: 0,
  zIndex: 30,
  backgroundColor: COLORS.card,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '10px',
  padding: '0.35rem',
  boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.15rem'
};

const presetBtn = {
  padding: '0.4rem 0.2rem',
  borderRadius: '6px',
  border: `1px solid ${COLORS.border}`,
  backgroundColor: COLORS.bg,
  color: '#fff',
  fontWeight: 600,
  fontSize: '0.8rem',
  cursor: 'pointer'
};

const presetBtnActive = {
  borderColor: COLORS.primary,
  color: COLORS.primary
};

const restInput = {
  width: '46px',
  backgroundColor: COLORS.bg,
  border: `1px solid ${COLORS.border}`,
  borderRadius: '6px',
  padding: '0.35rem',
  color: '#fff',
  fontSize: '0.85rem',
  textAlign: 'center',
  boxSizing: 'border-box'
};

export default InlineSetsEditor;
