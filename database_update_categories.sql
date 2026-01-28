-- Script para adicionar sistema de categorias de exercícios
-- Execute este script no SQL Editor do Supabase

-- 1. Criar tabela de categorias de exercícios
CREATE TABLE IF NOT EXISTS exercise_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Adicionar campo category_id na tabela progress_records
ALTER TABLE progress_records
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES exercise_categories(id) ON DELETE SET NULL;

-- 3. Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_exercise_categories_student_id ON exercise_categories(student_id);
CREATE INDEX IF NOT EXISTS idx_progress_records_category_id ON progress_records(category_id);

-- 4. Habilitar RLS (Row Level Security) para exercise_categories
ALTER TABLE exercise_categories ENABLE ROW LEVEL SECURITY;

-- 5. Criar política de acesso (ajuste conforme suas regras de segurança)
CREATE POLICY "Enable all access for authenticated users" ON exercise_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_exercise_categories_updated_at
  BEFORE UPDATE ON exercise_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
