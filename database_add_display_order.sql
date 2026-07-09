-- ============================================================================
-- Betânia Log App — Ordem de exibição dos exercícios (drag-and-drop)
-- Adiciona a coluna display_order em progress_records: posição do exercício
-- dentro da categoria. NULL = sem posição definida (vai para o fim da lista).
-- Execute no SQL Editor do Supabase. Re-executável.
-- ============================================================================

ALTER TABLE public.progress_records
  ADD COLUMN IF NOT EXISTS display_order INT;
