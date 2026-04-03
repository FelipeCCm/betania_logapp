import React, { useEffect, useRef, useState } from 'react';
import { useTimer } from '../contexts/TimerContext';
import './FloatingTimer.css';

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

  return (
    <div
      ref={containerRef}
      className={`floating-timer ${expanded ? 'floating-timer--expanded' : ''}`}
      style={{ left: position.x, top: position.y }}
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
      <div className="floating-timer__header">
        <span className="floating-timer__time">{timeDisplay}</span>
        {isRunning && <span className="floating-timer__badge">Ativo</span>}
      </div>

      {expanded && (
        <div className="floating-timer__panel" onPointerDown={(event) => event.stopPropagation()}>
          <div className="floating-timer__inputs">
            <label className="floating-timer__label">
              Min
              <input
                type="number"
                min={0}
                max={maxMinutes}
                value={minutesInput}
                onChange={handleMinutesChange}
              />
            </label>
            <label className="floating-timer__label">
              Seg
              <input
                type="number"
                min={0}
                max={maxSeconds}
                value={secondsInput}
                onChange={handleSecondsChange}
              />
            </label>
          </div>

          <div className="floating-timer__controls">
            <button
              type="button"
              className="floating-timer__button"
              onClick={(event) => {
                event.stopPropagation();
                start();
              }}
              disabled={isRunning || remainingSeconds === 0}
            >
              Iniciar
            </button>
            <button
              type="button"
              className="floating-timer__button"
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
              className="floating-timer__button floating-timer__button--ghost"
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
  );
};

export default FloatingTimer;
