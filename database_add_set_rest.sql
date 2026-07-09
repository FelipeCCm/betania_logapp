-- =========================================================
-- Migration: Tempo de descanso por série em exercise_sets
-- Adiciona o tempo de descanso (em segundos) configurável por série.
-- Idempotente: pode ser executado múltiplas vezes.
-- =========================================================

ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS rest_seconds INT NOT NULL DEFAULT 0;

-- Garante que rest_seconds seja sempre >= 0
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercise_sets_rest_seconds_check'
  ) THEN
    ALTER TABLE public.exercise_sets
      ADD CONSTRAINT exercise_sets_rest_seconds_check
      CHECK (rest_seconds >= 0);
  END IF;
END $$;
