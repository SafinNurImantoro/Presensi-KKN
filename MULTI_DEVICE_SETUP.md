# GUIDE: Multi-Device Setup dengan Supabase

## 🌐 Akses Development Server dari Multi-Device

### Di Device Utama (Komputer dengan npm run dev):
```bash
cd "e:\KKN\Presensi KKN"
npm run dev -- --host 0.0.0.0
```

**Output akan tampak seperti:**
```
➜  Local:   http://localhost:5175/
```

### Di Device Lain (Laptop, Tablet, Smartphone):
Akses dengan URL: **`http://192.168.0.103:5175/`**

> **CATATAN:** Pastikan semua device terhubung ke WiFi atau Network yang sama dengan komputer utama.

---

## 🔄 Setup Supabase untuk Real-Time Cloud Sync

### Langkah 1: Buat Supabase Project
1. Buka https://supabase.com/dashboard
2. Sign up dengan GitHub (atau email)
3. Klik **"New Project"**
4. Pilih region terdekat (misal: Singapore atau Jakarta jika ada)
5. Set password yang kuat
6. Tunggu project dibuat (~2 menit)

### Langkah 2: Setup Database Schema
1. Di Supabase Dashboard, buka **SQL Editor**
2. Klik **"New Query"**
3. Copy-paste seluruh isi file `supabase_schema.sql` dari project Anda
4. Klik **"Run"** untuk execute semua tabel dan policies

> **File location:** `e:\KKN\Presensi KKN\supabase_schema.sql`

### Langkah 3: Dapatkan API Credentials
1. Pergi ke **Settings** (roda gigi di kiri bawah)
2. Buka tab **"API"**
3. Copy nilai:
   - **Project URL** (misal: `https://xxxxxxxxxxx.supabase.co`)
   - **Anon Key** (public key untuk frontend)

### Langkah 4: Set Environment Variables

Di project folder `e:\KKN\Presensi KKN\`, buat file `.env`:

```bash
VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx...
```

Replace dengan values dari Step 3.

### Langkah 5: Restart Dev Server
```bash
# Stop current server (Ctrl+C)
npm run dev -- --host 0.0.0.0
```

Sekarang app akan automatically connect ke Supabase!

---

## ✅ Test Multi-Device Sync

### Scenario Test:
1. **Device 1 (PC):** Buka `http://localhost:5175/`
2. **Device 2 (Laptop):** Buka `http://192.168.0.103:5175/`
3. Di Device 1, submit presensi: **"Safin - Hadir di Posko"**
4. Check Device 2 - data harus update otomatis di dashboard!

### Jika data tidak sync:
- Refresh page di Device 2 (Ctrl+R)
- Dashboard ada refresh interval 30 detik otomatis
- Check browser console (F12) untuk error messages

---

## 🚀 Deployment ke Vercel (Optional - untuk akses permanen)

Kalau ingin permanent URL accessible 24/7 tanpa dev server:

1. Push `.env` changes ke GitHub
2. Pergi ke Vercel Dashboard
3. Buka project → Settings → Environment Variables
4. Tambahkan:
   ```
   VITE_SUPABASE_URL = (nilai dari step 3)
   VITE_SUPABASE_ANON_KEY = (nilai dari step 3)
   ```
5. Redeploy akan otomatis
6. Akses di: `https://presensi-kkn.vercel.app`

---

## 📝 Struktur Data di Supabase

### Table: kkn_attendance
```
id              → UUID (auto-generated)
member_name     → TEXT (nama anggota)
date            → DATE (tanggal presensi)
status          → TEXT (Hadir/Bekerja/Izin)
notes           → TEXT (catatan optional)
created_at      → TIMESTAMPTZ (waktu dibuat)
```

### Policies:
- ✅ Semua user bisa lihat presensi hari ini
- ✅ Semua user bisa submit presensi sendiri
- 🔒 Hanya admin bisa lihat riwayat historis

---

## 🎯 Summary: Dari Local → Cloud → Multi-Device

| Tahap | Sebelum | Sesudah |
|-------|---------|---------|
| **Data Storage** | Hanya Local Storage (1 device) | Supabase + Local (semua device sync) |
| **Device Access** | Hanya localhost:5173 | `192.168.0.103:5175` + vercel URL |
| **Real-time Sync** | ❌ Tidak ada | ✅ 30-detik polling otomatis |
| **Offline Mode** | ✅ Berfungsi | ✅ Masih berfungsi (fallback Local Storage) |
| **Persistence** | Data hilang saat cache clear | ✅ Tersimpan permanent di cloud |

---

## 💡 Pro Tips

### Tip 1: Akses dari Network yang Berbeda
Jika ingin akses dari luar WiFi (misal 4G), gunakan Vercel URL daripada IP lokal.

### Tip 2: Debug Real-Time Sync
Buka F12 → Console → check untuk messages dari `db.js` saat submit

### Tip 3: Backup Data
Di Supabase Dashboard → Database → kkn_attendance → Options → Export sebagai CSV/JSON

### Tip 4: Testing dengan Multiple Users
Buka 2-3 browser tab di device berbeda untuk simulate concurrent users

---

## 🔗 Useful Links
- Supabase Docs: https://supabase.com/docs
- Vite Network Config: https://vite.dev/config/server-options.html
- Vercel Environment Vars: https://vercel.com/docs/concepts/projects/environment-variables

