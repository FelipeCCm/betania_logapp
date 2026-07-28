import React, { useEffect, useRef, useState } from 'react';
import { useTimer } from '../contexts/TimerContext';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatTime = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const getDefaultPosition = () => {
  if (typeof window === 'undefined') {
    return { x: 24, y: 24 };
  }
  const margin = 24;
  const defaultWidth = 140;
  return { x: Math.max(margin, window.innerWidth - defaultWidth - margin), y: margin };
};

// Estilos inline (padrão do projeto). As propriedades com variações de pseudo-classe
// (:active, input:focus) ou de breakpoint (@media) ficam no bloco <style> abaixo, pois
// estilo inline sempre vence sobre folha de estilo e anularia essas variações.
const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    fontWeight: 600,
    color: '#f9ab2d',
    letterSpacing: '0.04em',
    position: 'relative'
  },
  time: { fontSize: '1rem' },
  badge: {
    background: 'rgba(249, 171, 45, 0.15)',
    color: '#f9ab2d',
    border: '1px solid rgba(249, 171, 45, 0.4)',
    padding: '0.15rem 0.5rem',
    borderRadius: '999px',
    fontSize: '0.7rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em'
  },
  panel: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem'
  },
  inputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '0.75rem'
  },
  label: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    fontSize: '0.75rem',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#cfcfcf'
  },
  input: {
    background: '#1a1b1c',
    color: '#ffffff',
    padding: '0.45rem 0.6rem',
    borderRadius: '8px',
    fontSize: '0.9rem'
  },
  controls: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap'
  },
  buttonBase: {
    background: '#f9ab2d',
    color: '#1a1b1c',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '8px',
    fontWeight: 600,
    fontSize: '0.8rem'
  },
  buttonGhost: {
    background: 'transparent',
    color: '#ffffff',
    border: '1px solid #3a3b3c'
  }
};

const buttonStyle = ({ disabled = false, ghost = false } = {}) => ({
  ...styles.buttonBase,
  ...(ghost ? styles.buttonGhost : {}),
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.55 : 1
});

// Regras que inline não expressa (mesma técnica do <style> injetado em App.jsx).
const scopedStyles = `
  .floating-timer {
    cursor: grab;
    min-width: 120px;
    padding: 0.75rem 0.9rem;
    border-radius: 14px;
  }
  .floating-timer:active {
    cursor: grabbing;
  }
  .floating-timer--expanded {
    min-width: 220px;
  }
  .floating-timer input {
    border: 1px solid #3a3b3c;
  }
  .floating-timer input:focus {
    outline: 2px solid rgba(249, 171, 45, 0.65);
    border-color: #f9ab2d;
  }
  @media (max-width: 640px) {
    .floating-timer {
      padding: 0.6rem 0.75rem;
      border-radius: 12px;
    }
    .floating-timer--expanded {
      min-width: 200px;
    }
    .floating-timer__controls {
      flex-direction: column;
    }
  }
`;

const FloatingTimer = () => {
  const {
    remainingSeconds,
    isRunning,
    setTime,
    start,
    pause,
    reset,
    maxMinutes,
    maxSeconds
  } = useTimer();

  const [expanded, setExpanded] = useState(false);
  const [minutesInput, setMinutesInput] = useState('0');
  const [secondsInput, setSecondsInput] = useState('0');
  const [position, setPosition] = useState(getDefaultPosition);
  const containerRef = useRef(null);
  const dragStateRef = useRef({
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    moved: false
  });

  useEffect(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    setMinutesInput(String(minutes));
    setSecondsInput(String(seconds));
  }, [remainingSeconds]);

  useEffect(() => {
    if (!expanded) return;

    const handleOutsideClick = (event) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target)) {
        setExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [expanded]);

  const updatePosition = (clientX, clientY) => {
    if (!containerRef.current) return;
    const { offsetX, offsetY } = dragStateRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const nextX = clamp(clientX - offsetX, 8, viewportWidth - rect.width - 8);
    const nextY = clamp(clientY - offsetY, 8, viewportHeight - rect.height - 8);

    setPosition({ x: nextX, y: nextY });
  };

  const handlePointerDown = (event) => {
    if (!containerRef.current) return;

    dragStateRef.current.isDragging = true;
    dragStateRef.current.moved = false;
    dragStateRef.current.startX = event.clientX;
    dragStateRef.current.startY = event.clientY;

    const rect = containerRef.current.getBoundingClientRect();
    dragStateRef.current.offsetX = event.clientX - rect.left;
    dragStateRef.current.offsetY = event.clientY - rect.top;

    containerRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    if (!dragStateRef.current.isDragging) return;
    const deltaX = Math.abs(event.clientX - dragStateRef.current.startX);
    const deltaY = Math.abs(event.clientY - dragStateRef.current.startY);

    if (deltaX > 4 || deltaY > 4) {
      dragStateRef.current.moved = true;
    }

    updatePosition(event.clientX, event.clientY);
  };

  const handlePointerUp = (event) => {
    if (!dragStateRef.current.isDragging) return;
    dragStateRef.current.isDragging = false;
    containerRef.current?.releasePointerCapture(event.pointerId);

    if (!dragStateRef.current.moved) {
      setExpanded((prev) => !prev);
    }
  };

  const handleMinutesChange = (event) => {
    const nextValue = event.target.value;
    const numeric = Number.parseInt(nextValue, 10);
    const safeMinutes = clamp(Number.isNaN(numeric) ? 0 : numeric, 0, maxMinutes);
    const safeSeconds = clamp(Number.parseInt(secondsInput, 10) || 0, 0, maxSeconds);

    setMinutesInput(String(safeMinutes));
    setTime(safeMinutes * 60 + safeSeconds);
  };

  const handleSecondsChange = (event) => {
    const nextValue = event.target.value;
    const numeric = Number.parseInt(nextValue, 10);
    const safeSeconds = clamp(Number.isNaN(numeric) ? 0 : numeric, 0, maxSeconds);
    const safeMinutes = clamp(Number.parseInt(minutesInput, 10) || 0, 0, maxMinutes);

    setSecondsInput(String(safeSeconds));
    setTime(safeMinutes * 60 + safeSeconds);
  };

  const timeDisplay = formatTime(remainingSeconds);
  const startDisabled = isRunning || remainingSeconds === 0;

  return (
    <>
      <style>{scopedStyles}</style>
      <div
        ref={containerRef}
        className={`floating-timer ${expanded ? 'floating-timer--expanded' : ''}`}
        style={{
          position: 'fixed',
          zIndex: 1000,
          left: position.x,
          top: position.y,
          background: '#0f1011',
          color: '#ffffff',
          border: '1px solid #3a3b3c',
          boxShadow: '0 12px 24px rgba(0, 0, 0, 0.35)',
          touchAction: 'none',
          userSelect: 'none'
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setExpanded((prev) => !prev);
          }
        }}
      >
        <div style={{ ...styles.header, justifyContent: expanded ? 'space-between' : 'center' }}>
          <span style={styles.time}>{timeDisplay}</span>
          {isRunning && expanded && <span style={styles.badge}>Ativo</span>}
        </div>

        {expanded && (
          <div style={styles.panel} onPointerDown={(event) => event.stopPropagation()}>
            <div style={styles.inputs}>
              <label style={styles.label}>
                Min
                <input
                  type="number"
                  min={0}
                  max={maxMinutes}
                  value={minutesInput}
                  onChange={handleMinutesChange}
                  style={styles.input}
                />
              </label>
              <label style={styles.label}>
                Seg
                <input
                  type="number"
                  min={0}
                  max={maxSeconds}
                  value={secondsInput}
                  onChange={handleSecondsChange}
                  style={styles.input}
                />
              </label>
            </div>

            <div className="floating-timer__controls" style={styles.controls}>
              <button
                type="button"
                style={buttonStyle({ disabled: startDisabled })}
                onClick={(event) => {
                  event.stopPropagation();
                  start();
                }}
                disabled={startDisabled}
              >
                Iniciar
              </button>
              <button
                type="button"
                style={buttonStyle({ disabled: !isRunning })}
                onClick={(event) => {
                  event.stopPropagation();
                  pause();
                }}
                disabled={!isRunning}
              >
                Pausar
              </button>
              <button
                type="button"
                style={buttonStyle({ ghost: true })}
                onClick={(event) => {
                  event.stopPropagation();
                  reset();
                }}
              >
                Resetar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default FloatingTimer;
