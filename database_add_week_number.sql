-- =========================================================
-- Migration: Semanas em exercise_sets
-- Adiciona agrupamento por semana dentro de um progress_record.
-- Idempotente: pode ser executado múltiplas vezes.
-- =========================================================

ALTER TABLE public.exercise_sets
  ADD COLUMN IF NOT EXISTS week_number INT NOT NULL DEFAULT 1;

-- Garante que week_number seja sempre >= 1
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'exercise_sets_week_number_check'
  ) THEN
    ALTER TABLE public.exercise_sets
      ADD CONSTRAINT exercise_sets_week_number_check
      CHECK (week_number >= 1);
  END IF;
END $$;

-- Índice para acelerar a busca "última semana de um progress_record"
CREATE INDEX IF NOT EXISTS idx_exercise_sets_record_week
  ON public.exercise_sets(progress_record_id, week_number);
