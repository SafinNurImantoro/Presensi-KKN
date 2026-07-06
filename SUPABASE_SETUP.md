# Setup autentikasi dan authorization Supabase

## 1. Terapkan schema

Buka **Supabase Dashboard → SQL Editor**, kemudian jalankan seluruh isi
`supabase_schema.sql`. Script ini:

- membuat atau memigrasikan tabel presensi dan jadwal;
- membuat tabel `kkn_profiles`;
- mengaktifkan RLS;
- mencabut akses tabel dari role `anon`;
- membuat policy anggota dan admin.

## 2. Buat akun anggota

Buka **Authentication → Users → Add user**. Buat satu akun email/password
untuk setiap anggota. Untuk akun yang dibuat manual, tandai email sebagai
terkonfirmasi agar anggota dapat langsung login.

Self-signup tidak digunakan oleh aplikasi. Sebaiknya nonaktifkan opsi
**Allow new users to sign up** pada pengaturan Auth.

## 3. Hubungkan akun dengan profil KKN

UUID pengguna dapat dilihat dari halaman Authentication atau melalui SQL:

```sql
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at;
```

Masukkan satu profil untuk setiap UUID. Nama harus sama persis dengan daftar
anggota di aplikasi.

```sql
INSERT INTO public.kkn_profiles (id, member_name, app_role)
VALUES
  ('UUID-AKUN-SAFIN', 'Safin', 'admin'),
  ('UUID-AKUN-KARLI', 'Karli', 'member'),
  ('UUID-AKUN-FEBRI', 'Febri', 'admin'),
  ('UUID-AKUN-ZAKY', 'Zaky', 'admin')
ON CONFLICT (id) DO UPDATE
SET
  member_name = EXCLUDED.member_name,
  app_role = EXCLUDED.app_role,
  is_active = TRUE,
  updated_at = NOW();
```

Tambahkan 16 anggota lainnya dengan pola yang sama. Minimal satu akun harus
memiliki `app_role = 'admin'`. Ketua dan sekretaris dapat dijadikan admin.

Bootstrap admin pertama harus dilakukan melalui SQL Editor. Setelah admin
pertama tersedia, policy mengizinkan admin mengelola profil, walaupun aplikasi
saat ini belum menyediakan UI manajemen akun.

## 4. Atur environment Vercel

Tambahkan variabel berikut pada **Vercel → Project Settings → Environment
Variables**:

```env
VITE_SUPABASE_URL=https://PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=ANON-PUBLISHABLE-KEY
```

Lakukan redeploy setelah variabel berubah. Anon key boleh berada di frontend
karena keamanan data ditegakkan oleh RLS. Jangan menggunakan `service_role`
key di aplikasi Vite.

## Hak akses

- Anggota aktif wajib login.
- Anggota hanya dapat membuat dan memperbarui presensi miliknya.
- Anggota hanya dapat mengakses jadwal miliknya.
- Semua anggota dapat melihat status presensi hari ini untuk dashboard.
- Riwayat presensi lengkap dan seluruh jadwal hanya dapat dibaca admin.
- Admin Panel hanya muncul untuk profil dengan `app_role = 'admin'`.
- Pengguna tanpa profil aktif ditolak setelah login.
