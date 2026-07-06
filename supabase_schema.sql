-- -------------------------------------------------------------
-- SCHEMA SETUP FOR KKN PRESENSI & JADWAL WEB APP
-- Run these DDL statements in your Supabase SQL Editor
-- -------------------------------------------------------------

-- 1. Table for Daily Attendance
CREATE TABLE IF NOT EXISTS kkn_attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure a member has at most one attendance record per day
  UNIQUE (member_name, date)
);

-- 2. Table for Weekly Work Schedules
CREATE TABLE IF NOT EXISTS kkn_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  member_name TEXT NOT NULL,
  period_year SMALLINT NOT NULL
    CONSTRAINT kkn_schedules_period_year_check CHECK (period_year BETWEEN 2020 AND 2100),
  period_month SMALLINT NOT NULL
    CONSTRAINT kkn_schedules_period_month_check CHECK (period_month BETWEEN 1 AND 12),
  week INTEGER NOT NULL
    CONSTRAINT kkn_schedules_week_check CHECK (week BETWEEN 1 AND 5),
  days TEXT[] NOT NULL,
  shift TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  -- Ensure a member has at most one schedule in the same monthly week
  CONSTRAINT kkn_schedules_member_period_week_key
    UNIQUE (member_name, period_year, period_month, week)
);

-- 3. Safely migrate an existing installation that used member_name + week.
-- Existing schedules are assigned to the month in which they were created.
ALTER TABLE kkn_schedules
  ADD COLUMN IF NOT EXISTS period_year SMALLINT,
  ADD COLUMN IF NOT EXISTS period_month SMALLINT;

UPDATE kkn_schedules
SET
  period_year = EXTRACT(YEAR FROM created_at AT TIME ZONE 'Asia/Jakarta')::SMALLINT,
  period_month = EXTRACT(MONTH FROM created_at AT TIME ZONE 'Asia/Jakarta')::SMALLINT
WHERE period_year IS NULL OR period_month IS NULL;

ALTER TABLE kkn_schedules
  ALTER COLUMN period_year SET NOT NULL,
  ALTER COLUMN period_month SET NOT NULL;

ALTER TABLE kkn_schedules
  DROP CONSTRAINT IF EXISTS kkn_schedules_member_name_week_key,
  DROP CONSTRAINT IF EXISTS kkn_schedules_week_check;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kkn_schedules_period_year_check'
      AND conrelid = 'kkn_schedules'::regclass
  ) THEN
    ALTER TABLE kkn_schedules
      ADD CONSTRAINT kkn_schedules_period_year_check
      CHECK (period_year BETWEEN 2020 AND 2100);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kkn_schedules_period_month_check'
      AND conrelid = 'kkn_schedules'::regclass
  ) THEN
    ALTER TABLE kkn_schedules
      ADD CONSTRAINT kkn_schedules_period_month_check
      CHECK (period_month BETWEEN 1 AND 12);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kkn_schedules_week_check'
      AND conrelid = 'kkn_schedules'::regclass
  ) THEN
    ALTER TABLE kkn_schedules
      ADD CONSTRAINT kkn_schedules_week_check
      CHECK (week BETWEEN 1 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kkn_schedules_member_period_week_key'
      AND conrelid = 'kkn_schedules'::regclass
  ) THEN
    ALTER TABLE kkn_schedules
      ADD CONSTRAINT kkn_schedules_member_period_week_key
      UNIQUE (member_name, period_year, period_month, week);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS kkn_attendance_date_idx
  ON kkn_attendance (date);

CREATE INDEX IF NOT EXISTS kkn_schedules_period_idx
  ON kkn_schedules (period_year, period_month, week);

-- 4. Link every Supabase Auth account to exactly one KKN member.
CREATE TABLE IF NOT EXISTS kkn_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  member_name TEXT NOT NULL UNIQUE CHECK (
    member_name IN (
      'Safin', 'Karli', 'Febri', 'Zaky', 'Tia', 'Aisyah',
      'Diva', 'Anggita', 'Ferry', 'Azriel', 'Riyan', 'Isma',
      'Fauzan', 'Naiya', 'Fajrul', 'Naomi', 'Bima', 'Dian',
      'Sulistiya', 'Nazwa'
    )
  ),
  app_role TEXT NOT NULL DEFAULT 'member'
    CHECK (app_role IN ('member', 'admin')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- SECURITY DEFINER avoids recursive profile-policy checks. These functions
-- return data only for the currently authenticated user.
CREATE OR REPLACE FUNCTION public.current_kkn_member_name()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT member_name
  FROM public.kkn_profiles
  WHERE id = auth.uid() AND is_active = TRUE
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_kkn_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.kkn_profiles
    WHERE id = auth.uid()
      AND app_role = 'admin'
      AND is_active = TRUE
  )
$$;

REVOKE ALL ON FUNCTION public.current_kkn_member_name() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_kkn_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_kkn_member_name() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_kkn_admin() TO authenticated;

-- 5. Enable RLS and remove all anonymous table access.
ALTER TABLE kkn_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kkn_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE kkn_schedules ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE kkn_profiles FROM anon;
REVOKE ALL ON TABLE kkn_attendance FROM anon;
REVOKE ALL ON TABLE kkn_schedules FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kkn_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kkn_attendance TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE kkn_schedules TO authenticated;

-- Profiles: members can read their own identity; admins can manage all profiles.
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON kkn_profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON kkn_profiles FOR SELECT TO authenticated
USING (id = auth.uid() OR public.is_kkn_admin());

DROP POLICY IF EXISTS "profiles_admin_insert" ON kkn_profiles;
CREATE POLICY "profiles_admin_insert"
ON kkn_profiles FOR INSERT TO authenticated
WITH CHECK (public.is_kkn_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON kkn_profiles;
CREATE POLICY "profiles_admin_update"
ON kkn_profiles FOR UPDATE TO authenticated
USING (public.is_kkn_admin())
WITH CHECK (public.is_kkn_admin());

DROP POLICY IF EXISTS "profiles_admin_delete" ON kkn_profiles;
CREATE POLICY "profiles_admin_delete"
ON kkn_profiles FOR DELETE TO authenticated
USING (public.is_kkn_admin());

-- Attendance: all active members can see today's dashboard. Historical data
-- is limited to the record owner and admins.
DROP POLICY IF EXISTS "attendance_select_authorized" ON kkn_attendance;
CREATE POLICY "attendance_select_authorized"
ON kkn_attendance FOR SELECT TO authenticated
USING (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
  OR date = (NOW() AT TIME ZONE 'Asia/Jakarta')::DATE
);

DROP POLICY IF EXISTS "attendance_insert_own" ON kkn_attendance;
CREATE POLICY "attendance_insert_own"
ON kkn_attendance FOR INSERT TO authenticated
WITH CHECK (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
);

DROP POLICY IF EXISTS "attendance_update_own" ON kkn_attendance;
CREATE POLICY "attendance_update_own"
ON kkn_attendance FOR UPDATE TO authenticated
USING (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
)
WITH CHECK (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
);

DROP POLICY IF EXISTS "attendance_delete_admin" ON kkn_attendance;
CREATE POLICY "attendance_delete_admin"
ON kkn_attendance FOR DELETE TO authenticated
USING (public.is_kkn_admin());

-- Schedules: members can access only their own schedule; admins can access all.
DROP POLICY IF EXISTS "schedules_select_own_or_admin" ON kkn_schedules;
CREATE POLICY "schedules_select_own_or_admin"
ON kkn_schedules FOR SELECT TO authenticated
USING (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
);

DROP POLICY IF EXISTS "schedules_insert_own" ON kkn_schedules;
CREATE POLICY "schedules_insert_own"
ON kkn_schedules FOR INSERT TO authenticated
WITH CHECK (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
);

DROP POLICY IF EXISTS "schedules_update_own" ON kkn_schedules;
CREATE POLICY "schedules_update_own"
ON kkn_schedules FOR UPDATE TO authenticated
USING (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
)
WITH CHECK (
  public.is_kkn_admin()
  OR member_name = public.current_kkn_member_name()
);

DROP POLICY IF EXISTS "schedules_delete_admin" ON kkn_schedules;
CREATE POLICY "schedules_delete_admin"
ON kkn_schedules FOR DELETE TO authenticated
USING (public.is_kkn_admin());

-- =============================================================================
-- 6. INSERT PROFIL ANGGOTA KKN (Jalankan setelah membuat user di Auth)
-- =============================================================================
-- LANGKAH 1: Jalankan query di bawah untuk mendapatkan UUID setiap user
-- SELECT id AS uuid, email FROM auth.users ORDER BY created_at;

-- LANGKAH 2: Ganti UUID-AKUN-NAMA dengan UUID sebenarnya dari LANGKAH 1
-- ADMIN: Safin & Febri | MEMBER: 18 orang lainnya

INSERT INTO public.kkn_profiles (id, member_name, app_role, is_active)
VALUES
  -- ADMIN HANYA (2 ORANG)
  ('UUID-AKUN-SAFIN', 'Safin', 'admin', TRUE),
  ('UUID-AKUN-FEBRI', 'Febri', 'admin', TRUE),
  
  -- MEMBER (18 ORANG)
  ('UUID-AKUN-KARLI', 'Karli', 'member', TRUE),
  ('UUID-AKUN-ZAKY', 'Zaky', 'member', TRUE),
  ('UUID-AKUN-TIA', 'Tia', 'member', TRUE),
  ('UUID-AKUN-AISYAH', 'Aisyah', 'member', TRUE),
  ('UUID-AKUN-DIVA', 'Diva', 'member', TRUE),
  ('UUID-AKUN-ANGGITA', 'Anggita', 'member', TRUE),
  ('UUID-AKUN-FERRY', 'Ferry', 'member', TRUE),
  ('UUID-AKUN-AZRIEL', 'Azriel', 'member', TRUE),
  ('UUID-AKUN-RIYAN', 'Riyan', 'member', TRUE),
  ('UUID-AKUN-ISMA', 'Isma', 'member', TRUE),
  ('UUID-AKUN-FAUZAN', 'Fauzan', 'member', TRUE),
  ('UUID-AKUN-NAIYA', 'Naiya', 'member', TRUE),
  ('UUID-AKUN-FAJRUL', 'Fajrul', 'member', TRUE),
  ('UUID-AKUN-NAOMI', 'Naomi', 'member', TRUE),
  ('UUID-AKUN-BIMA', 'Bima', 'member', TRUE),
  ('UUID-AKUN-DIAN', 'Dian', 'member', TRUE),
  ('UUID-AKUN-SULISTIYA', 'Sulistiya', 'member', TRUE),
  ('UUID-AKUN-NAZWA', 'Nazwa', 'member', TRUE)
ON CONFLICT (id) DO UPDATE
SET
  member_name = EXCLUDED.member_name,
  app_role = EXCLUDED.app_role,
  is_active = TRUE,
  updated_at = NOW();

-- LANGKAH 3: Jalankan query di bawah untuk VERIFIKASI hasil insert
-- SELECT member_name, app_role, is_active FROM public.kkn_profiles ORDER BY member_name;
