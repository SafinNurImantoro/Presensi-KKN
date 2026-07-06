# Presensi dan Jadwal KKN

Aplikasi React + Vite untuk presensi harian, jadwal kerja bulanan, dashboard,
rekap admin, dan ekspor laporan.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Salin `.env.example` menjadi `.env`, lalu isi URL dan anon key Supabase.
Jika variabel tersebut tidak tersedia, aplikasi berjalan sebagai demo
LocalStorage tanpa autentikasi dan tanpa sinkronisasi antarperangkat.

## Supabase

1. Jalankan `supabase_schema.sql` melalui Supabase SQL Editor.
2. Buat akun Auth dan profil untuk setiap anggota.
3. Atur `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.

Petunjuk akun dan pemberian peran admin tersedia di
[`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

Jangan pernah memasukkan Supabase `service_role` key ke variabel frontend.

## Pemeriksaan

```bash
npm run lint
npm run build
```
