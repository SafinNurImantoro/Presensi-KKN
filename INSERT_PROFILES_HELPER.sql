-- ============================================================================
-- HELPER SCRIPT UNTUK INSERT PROFIL ANGGOTA KKN
-- ============================================================================
-- Gunakan script ini SETELAH menjalankan supabase_schema.sql
-- dan SETELAH membuat semua 20 user di Supabase Auth

-- ============================================================================
-- STEP 1: Salin UUID semua user dari Auth
-- ============================================================================
-- Jalankan query ini di Supabase SQL Editor dan COPY hasil UUIDnya

SELECT id AS uuid, email 
FROM auth.users 
ORDER BY created_at;

-- Expected result: 20 baris dengan format UUID seperti:
-- uuid                                  | email
-- 550e8400-e29b-41d4-a716-446655440000 | safin@email.com
-- 550e8400-e29b-41d4-a716-446655440001 | karli@email.com
-- ... dst

-- ============================================================================
-- STEP 2: Mapping UUID ke Nama
-- ============================================================================
-- Dari hasil STEP 1, susun mapping seperti contoh di bawah:
-- 
-- ADMIN:
--   Safin = 550e8400-e29b-41d4-a716-446655440000
--   Febri = 550e8400-e29b-41d4-a716-446655440001
--
-- MEMBER (18 orang):
--   Karli = 550e8400-e29b-41d4-a716-446655440002
--   Zaky  = 550e8400-e29b-41d4-a716-446655440003
--   Tia   = 550e8400-e29b-41d4-a716-446655440004
--   ... dst

-- ============================================================================
-- STEP 3: Template INSERT (GANTI UUID-AKUN-* dengan UUID sebenarnya)
-- ============================================================================
-- Copy template di bawah, ganti UUID sesuai mapping dari STEP 2, 
-- lalu jalankan di Supabase SQL Editor

INSERT INTO public.kkn_profiles (id, member_name, app_role, is_active)
VALUES
  -- ADMIN (2 orang)
  ('550e8400-e29b-41d4-a716-446655440000', 'Safin', 'admin', TRUE),
  ('550e8400-e29b-41d4-a716-446655440001', 'Febri', 'admin', TRUE),
  
  -- MEMBER (18 orang)
  ('550e8400-e29b-41d4-a716-446655440002', 'Karli', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440003', 'Zaky', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440004', 'Tia', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440005', 'Aisyah', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440006', 'Diva', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440007', 'Anggita', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440008', 'Ferry', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440009', 'Azriel', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000a', 'Riyan', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000b', 'Isma', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000c', 'Fauzan', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000d', 'Naiya', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000e', 'Fajrul', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-44665544000f', 'Naomi', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440010', 'Bima', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440011', 'Dian', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440012', 'Sulistiya', 'member', TRUE),
  ('550e8400-e29b-41d4-a716-446655440013', 'Nazwa', 'member', TRUE)
ON CONFLICT (id) DO UPDATE
SET
  member_name = EXCLUDED.member_name,
  app_role = EXCLUDED.app_role,
  is_active = TRUE,
  updated_at = NOW();

-- ============================================================================
-- STEP 4: Verifikasi hasil insert
-- ============================================================================
-- Jalankan query di bawah untuk pastikan semua 20 profil tersimpan dengan benar

SELECT 
  member_name,
  app_role,
  is_active,
  created_at
FROM public.kkn_profiles
ORDER BY member_name;

-- Expected result: 20 baris dengan Safin & Febri memiliki app_role = 'admin'
-- Sisanya memiliki app_role = 'member'

-- ============================================================================
-- OPTIONAL: Reset semua profil (untuk testing)
-- ============================================================================
-- Jalankan HANYA jika ingin menghapus semua profil dan mulai dari awal:
-- DELETE FROM public.kkn_profiles;
