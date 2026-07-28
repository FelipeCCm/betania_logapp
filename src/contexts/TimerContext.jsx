import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

const TimerContext = createContext(null);

const MAX_MINUTES = 99;
const MAX_SECONDS = 59;
const MAX_TOTAL_SECONDS = MAX_MINUTES * 60 + MAX_SECONDS;
const STORAGE_KEY = 'gymProgress.restTimer';

const clampSeconds = (totalSeconds) =>
  Math.max(0, Math.min(Math.floor(Number(totalSeconds) || 0), MAX_TOTAL_SECONDS));

const readStored = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

// Reconstrói o estado inicial a partir do que ficou salvo (sobrevive a recargas
// que o navegador mobile costuma fazer ao descartar uma aba em segundo plano).
const computeInitialState = () => {
  const stored = readStored();
  if (!stored) {
    return { remaining: 0, initial: 0, running: false, endsAt: null };
  }

  const initial = clampSeconds(stored.initialSeconds);

  if (stored.isRunning && stored.endsAt) {
    const remainingMs = stored.endsAt - Date.now();
    if (remainingMs > 0) {
      return {
        remaining: Math.min(Math.ceil(remainingMs / 1000), MAX_TOTAL_SECONDS),
        initial,
        running: true,
        endsAt: stored.endsAt
      };
    }
    // O tempo acabou enquanto o app estava fora: já nasce zerado e parado.
    return { remaining: 0, initial, running: false, endsAt: null };
  }

  // Estava pausado: restaura o restante congelado.
  return { remaining: clampSeconds(stored.remainingSeconds), initial, running: false, endsAt: null };
};

export const TimerProvider = ({ children }) => {
  const bootstrapRef = useRef(null);
  if (bootstrapRef.current === null) {
    bootstrapRef.current = computeInitialState();
  }
  const boot = bootstrapRef.current;

  const [remainingSeconds, setRemainingSeconds] = useState(boot.remaining);
  const [initialSeconds, setInitialSeconds] = useState(boot.initial);
  const [isRunning, setIsRunning] = useState(boot.running);

  // Âncora de tempo: timestamp absoluto (ms) em que a contagem chega a zero.
  // Também serve de flag "armado" — quando é null, não há contagem em curso.
  const endsAtRef = useRef(boot.endsAt);
  const audioCtxRef = useRef(null);

  // Cria/retoma o AudioContext sob um gesto do usuário (clique em Iniciar ou ao
  // concluir uma série), evitando o bloqueio de autoplay dos navegadores.
  const ensureAudio = useCallback(() => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    } catch {
      // Áudio indisponível: segue sem som.
    }
  }, []);

  // Alerta de fim: três beeps curtos + vibração (quando suportada).
  const fireAlarm = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (ctx) {
      try {
        const start = ctx.currentTime;
        [0, 0.25, 0.5].forEach((offset) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, start + offset);
          gain.gain.exponentialRampToValueAtTime(0.3, start + offset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(start + offset);
          osc.stop(start + offset + 0.2);
        });
      } catch {
        // Ignora falhas de áudio.
      }
    }

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Vibração indisponível (ex.: iOS): ignora.
      }
    }
  }, []);

  // Recalcula o restante a partir do relógio real. Chamado tanto pelo tick
  // quanto quando o app volta ao primeiro plano — corrige qualquer congelamento
  // que o navegador tenha causado enquanto a aba estava em segundo plano.
  const syncFromEndsAt = useCallback(() => {
    if (endsAtRef.current == null) return;
    const remainingMs = endsAtRef.current - Date.now();
    if (remainingMs <= 0) {
      endsAtRef.current = null;
      setRemainingSeconds(0);
      setIsRunning(false);
      fireAlarm();
      return;
    }
    setRemainingSeconds(Math.min(Math.ceil(remainingMs / 1000), MAX_TOTAL_SECONDS));
  }, [fireAlarm]);

  // Tick suave (~250ms). O valor exibido vem sempre do relógio, então não há
  // drift acumulado como no antigo "prev - 1".
  useEffect(() => {
    if (!isRunning) return undefined;
    const intervalId = setInterval(syncFromEndsAt, 250);
    return () => clearInterval(intervalId);
  }, [isRunning, syncFromEndsAt]);

  // Corrige a exibição imediatamente ao retornar ao app / acender a tela.
  useEffect(() => {
    const handleForeground = () => {
      if (document.visibilityState === 'visible') {
        syncFromEndsAt();
      }
    };
    document.addEventListener('visibilitychange', handleForeground);
    window.addEventListener('focus', handleForeground);
    window.addEventListener('pageshow', handleForeground);
    return () => {
      document.removeEventListener('visibilitychange', handleForeground);
      window.removeEventListener('focus', handleForeground);
      window.removeEventListener('pageshow', handleForeground);
    };
  }, [syncFromEndsAt]);

  // Persiste o estado para sobreviver a recargas em segundo plano.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (!isRunning && remainingSeconds === 0 && initialSeconds === 0) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          isRunning,
          endsAt: endsAtRef.current,
          remainingSeconds,
          initialSeconds
        })
      );
    } catch {
      // Storage indisponível: apenas não persiste.
    }
  }, [isRunning, remainingSeconds, initialSeconds]);

  const setTime = (totalSeconds) => {
    const safeSeconds = clampSeconds(totalSeconds);
    setInitialSeconds(safeSeconds);
    setRemainingSeconds(safeSeconds);
    // Se estiver rodando enquanto o tempo é editado, re-ancora a contagem.
    if (isRunning) {
      if (safeSeconds > 0) {
        endsAtRef.current = Date.now() + safeSeconds * 1000;
      } else {
        endsAtRef.current = null;
        setIsRunning(false);
      }
    }
  };

  const start = () => {
    ensureAudio();
    if (remainingSeconds > 0) {
      endsAtRef.current = Date.now() + remainingSeconds * 1000;
      setIsRunning(true);
    }
  };

  // Define o tempo e inicia em um único passo (evita ler remainingSeconds
  // defasado ao chamar setTime() + start() em sequência).
  const startWith = (totalSeconds) => {
    ensureAudio();
    const safeSeconds = clampSeconds(totalSeconds);
    setInitialSeconds(safeSeconds);
    setRemainingSeconds(safeSeconds);
    if (safeSeconds > 0) {
      endsAtRef.current = Date.now() + safeSeconds * 1000;
      setIsRunning(true);
    } else {
      endsAtRef.current = null;
      setIsRunning(false);
    }
  };

  const pause = () => {
    // Congela o restante exato antes de soltar a âncora.
    syncFromEndsAt();
    endsAtRef.current = null;
    setIsRunning(false);
  };

  const reset = () => {
    endsAtRef.current = null;
    setIsRunning(false);
    setRemainingSeconds(initialSeconds);
  };

  const value = useMemo(
    () => ({
      remainingSeconds,
      initialSeconds,
      isRunning,
      setTime,
      startWith,
      start,
      pause,
      reset,
      maxMinutes: MAX_MINUTES,
      maxSeconds: MAX_SECONDS
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
