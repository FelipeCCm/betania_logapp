import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const TimerContext = createContext(null);

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;
const MAX_TOTAL_SECONDS = MAX_MINUTES * 60 + MAX_SECONDS;

export const TimerProvider = ({ children }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [initialSeconds, setInitialSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  const setTime = (totalSeconds) => {
    const safeSeconds = Math.max(0, Math.min(totalSeconds, MAX_TOTAL_SECONDS));
    setInitialSeconds(safeSeconds);
    setRemainingSeconds(safeSeconds);
  };

  const start = () => {
    if (remainingSeconds > 0) {
      setIsRunning(true);
    }
  };

  const pause = () => {
    setIsRunning(false);
  };

  const reset = () => {
    setIsRunning(false);
    setRemainingSeconds(initialSeconds);
  };

  const value = useMemo(
    () => ({
      remainingSeconds,
      initialSeconds,
      isRunning,
      setTime,
      start,
      pause,
      reset,
      maxMinutes: MAX_MINUTES,
      maxSeconds: MAX_SECONDS
    }),
    [remainingSeconds, initialSeconds, isRunning]
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
};

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};
