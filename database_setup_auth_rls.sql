-- ============================================================================
-- Betânia Log App — Endurecimento de autenticação e RLS
-- Execute no SQL Editor do Supabase (pode ser reexecutado — é idempotente).
-- Escopo: constraints em user_profiles, funções helper (SECURITY DEFINER),
--         trigger de criação automática de perfil, RLS por role em todas
--         as tabelas do app.
-- Perfis: 'admin' (acesso total) e 'student' (acesso escopado ao próprio
--         student_id vinculado em user_profiles.student_id).
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. Constraints em user_profiles
-- ----------------------------------------------------------------------------

-- id = auth.users.id (cascade no delete do auth user)
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_id_fkey;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_id_fkey
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- student_id → students (SET NULL se o aluno for apagado, mas mantém o login)
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_student_id_fkey;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE SET NULL;

-- role ∈ {'admin','student'}
ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;
ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('admin', 'student'));

-- 1 aluno → no máximo 1 login
DROP INDEX IF EXISTS public.idx_user_profiles_student_id_unique;
CREATE UNIQUE INDEX idx_user_profiles_student_id_unique
  ON public.user_profiles(student_id)
  WHERE student_id IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 2. Funções helper (SECURITY DEFINER para evitar recursão em políticas RLS)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT student_id FROM public.user_profiles WHERE id = auth.uid()
$$;

REVOKE EXECUTE ON FUNCTION public.current_user_role()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_admin()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_student_id() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.current_user_role()  TO authenticated;
GRANT  EXECUTE ON FUNCTION public.is_admin()           TO authenticated;
GRANT  EXECUTE ON FUNCTION public.current_student_id() TO authenticated;

-- ----------------------------------------------------------------------------
-- 3. Trigger: criar user_profile automaticamente ao criar auth.users
--    (default: role='student', student_id=NULL — admin deve vincular depois)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ----------------------------------------------------------------------------
-- 4. Habilitar RLS em todas as tabelas do app
-- ----------------------------------------------------------------------------

ALTER TABLE public.user_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercise_sets       ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 5. Remover políticas antigas (inclusive as permissivas "USING (true)")
-- ----------------------------------------------------------------------------

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'user_profiles','students','exercises',
        'exercise_categories','progress_records','exercise_sets'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  END LOOP;
END$$;

-- ----------------------------------------------------------------------------
-- 6. Políticas: user_profiles
--    - student lê só a própria linha
--    - admin tem acesso total
-- ----------------------------------------------------------------------------

CREATE POLICY "profiles_self_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_admin_select" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY "profiles_admin_insert" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_update" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "profiles_admin_delete" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. Políticas: students
--    - admin: CRUD total
--    - student: lê apenas o próprio cadastro
-- ----------------------------------------------------------------------------

CREATE POLICY "students_admin_all" ON public.students
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "students_self_select" ON public.students
  FOR SELECT TO authenticated
  USING (id = public.current_student_id());

-- ----------------------------------------------------------------------------
-- 8. Políticas: exercises (catálogo global)
--    - qualquer autenticado lê
--    - somente admin escreve
-- ----------------------------------------------------------------------------

CREATE POLICY "exercises_read_all" ON public.exercises
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "exercises_admin_insert" ON public.exercises
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "exercises_admin_update" ON public.exercises
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "exercises_admin_delete" ON public.exercises
  FOR DELETE TO authenticated
  USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 9. Políticas: exercise_categories (escopo por student_id)
-- ----------------------------------------------------------------------------

CREATE POLICY "categories_admin_all" ON public.exercise_categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "categories_self_select" ON public.exercise_categories
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "categories_self_insert" ON public.exercise_categories
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "categories_self_update" ON public.exercise_categories
  FOR UPDATE TO authenticated
  USING (student_id = public.current_student_id())
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "categories_self_delete" ON public.exercise_categories
  FOR DELETE TO authenticated
  USING (student_id = public.current_student_id());

-- ----------------------------------------------------------------------------
-- 10. Políticas: progress_records (escopo por student_id)
-- ----------------------------------------------------------------------------

CREATE POLICY "progress_admin_all" ON public.progress_records
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "progress_self_select" ON public.progress_records
  FOR SELECT TO authenticated
  USING (student_id = public.current_student_id());

CREATE POLICY "progress_self_insert" ON public.progress_records
  FOR INSERT TO authenticated
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "progress_self_update" ON public.progress_records
  FOR UPDATE TO authenticated
  USING (student_id = public.current_student_id())
  WITH CHECK (student_id = public.current_student_id());

CREATE POLICY "progress_self_delete" ON public.progress_records
  FOR DELETE TO authenticated
  USING (student_id = public.current_student_id());

-- ----------------------------------------------------------------------------
-- 11. Políticas: exercise_sets (escopo via progress_records.student_id)
-- ----------------------------------------------------------------------------

CREATE POLICY "sets_admin_all" ON public.exercise_sets
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "sets_self_select" ON public.exercise_sets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_records pr
      WHERE pr.id = exercise_sets.progress_record_id
        AND pr.student_id = public.current_student_id()
    )
  );

CREATE POLICY "sets_self_insert" ON public.exercise_sets
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.progress_records pr
      WHERE pr.id = progress_record_id
        AND pr.student_id = public.current_student_id()
    )
  );

CREATE POLICY "sets_self_update" ON public.exercise_sets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_records pr
      WHERE pr.id = exercise_sets.progress_record_id
        AND pr.student_id = public.current_student_id()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.progress_records pr
      WHERE pr.id = progress_record_id
        AND pr.student_id = public.current_student_id()
    )
  );

CREATE POLICY "sets_self_delete" ON public.exercise_sets
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_records pr
      WHERE pr.id = exercise_sets.progress_record_id
        AND pr.student_id = public.current_student_id()
    )
  );

-- ----------------------------------------------------------------------------
-- 12. Índices de apoio
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_progress_records_student_id
  ON public.progress_records(student_id);
CREATE INDEX IF NOT EXISTS idx_exercise_categories_student_id
  ON public.exercise_categories(student_id);
CREATE INDEX IF NOT EXISTS idx_exercise_sets_progress_record_id
  ON public.exercise_sets(progress_record_id);

COMMIT;

-- ============================================================================
-- PÓS-MIGRAÇÃO — Passos manuais do admin (rode com cuidado)
-- ============================================================================
-- 1) Promover o usuário administrador (substitua o e-mail):
--
--   UPDATE public.user_profiles
--      SET role = 'admin', student_id = NULL
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@exemplo.com');
--
-- 2) Criar aluno + vincular ao login (usuário já criado no Supabase Auth):
--
--   -- a) crie (ou recupere) a linha em students
--   INSERT INTO public.students (name, email, phone)
--   VALUES ('Nome do Aluno', 'aluno@exemplo.com', '(00) 00000-0000')
--   RETURNING id;
--
--   -- b) vincule ao user_profile do login correspondente
--   UPDATE public.user_profiles
--      SET role = 'student',
--          student_id = '<uuid-students>'
--    WHERE id = (SELECT id FROM auth.users WHERE email = 'aluno@exemplo.com');
--
-- 3) Conferir quem é admin:
--
--   SELECT up.id, u.email, up.role, up.student_id
--     FROM public.user_profiles up
--     JOIN auth.users u ON u.id = up.id
--    ORDER BY up.role, u.email;
-- ============================================================================
