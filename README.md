# e-Surau — Sistem Pengurusan Surau (Fasa 1)

Sistem web untuk **pendaftaran ahli kariah**, **khairat kematian** (opt-in), dan
**laman awam** (waktu solat + pengumuman). Dibina dengan Next.js + Supabase,
sedia untuk deploy ke Netlify.

## Apa yang ada

### Fasa 1
- **Laman awam** (`/`) — waktu solat automatik (JAKIM e-Solat) + pengumuman.
- **Borang pendaftaran ahli** (`/daftar`) — maklumat diri, tanggungan, dan
  pilihan sertai khairat (RM60/tahun, pampasan tetap RM1,400).
- **Panel admin** (`/admin`) — senarai pendaftaran, luluskan/tolak ahli.

### Fasa 2 (baharu)
- **Kewangan** (`/admin/kewangan`) — rekod kutipan & perbelanjaan, papan pemuka
  baki tabung am vs tabung khairat (diasingkan), kutipan/belanja bulan semasa.
- **Resit PDF automatik** — setiap kutipan ada butang "Resit PDF" (no. resit
  auto RS000001).
- **Khairat penuh** (`/admin/khairat`) — kutip yuran tahunan RM60 (status ahli
  auto jadi *aktif*), rekod tuntutan kematian dengan **semakan kelayakan**
  (keahlian tertunggak yuran tak boleh menuntut), pampasan tetap RM1,400,
  proses lulus → dibayar, dan baki tabung khairat dikira automatik.

> Fasa seterusnya: modul Program/Aktiviti, modul Aset & Inventori, naik taraf
> auth ke Supabase Auth dengan peranan penuh (admin/bendahari/AJK).

---

## Langkah Setup

### 1. Sediakan projek Supabase
1. Daftar/log masuk di [supabase.com](https://supabase.com) → **New Project**.
2. Buka **SQL Editor** → **New query** → tampal isi fail `supabase/schema.sql` →
   **Run** (Fasa 1). Kemudian jalankan pula `supabase/schema_fasa2.sql` untuk
   modul kewangan & khairat. Jalankan mengikut urutan ini.
3. Pergi **Project Settings → API**, salin:
   - `Project URL`
   - `anon public` key
   - `service_role` key (RAHSIA)

### 2. Konfigurasi environment
Salin `.env.example` kepada `.env.local` dan isi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_ZON_SOLAT=SGR01        # tukar ikut zon surau (cth WLY01, JHR01)
NEXT_PUBLIC_NAMA_SURAU=Surau Al-Hidayah
ADMIN_PASSWORD=katalaluan-anda     # kata laluan panel admin
```

### 3. Jalankan secara lokal
```bash
npm install
npm run dev
```
Buka http://localhost:3000

### 4. Deploy ke Netlify
1. Push projek ini ke GitHub.
2. Di Netlify: **Add new site → Import from Git** → pilih repo.
3. Netlify auto-kesan Next.js (fail `netlify.toml` sudah disediakan).
4. **Site settings → Environment variables** — masukkan semua kunci dari `.env.local`.
5. **Deploy**. Siap!

---

## Nota Penting

- **Zon waktu solat:** tukar `NEXT_PUBLIC_ZON_SOLAT` ikut zon JAKIM surau anda.
  Senarai kod zon: SGR01 (Selangor), WLY01 (KL), JHR01–04 (Johor), PNG01, dll.
- **Keselamatan admin:** Fasa 1 guna kata laluan tunggal (`ADMIN_PASSWORD`).
  Fasa 2 akan naik taraf ke Supabase Auth dengan peranan (admin/bendahari/AJK).
- **Data peribadi:** jadual ahli tidak boleh diakses terus oleh orang awam (RLS).
  Pendaftaran hanya melalui fungsi `daftar_ahli`, dan operasi admin guna
  `service_role` di server sahaja.
- **Peraturan khairat** (sudah dikodkan): yuran RM60/tahun, pampasan tetap
  RM1,400/tuntutan, liputan ahli + tanggungan berdaftar, dan **yuran mesti
  dijelaskan untuk kekal layak menuntut**.

## Struktur Projek

```
e-surau/
├── supabase/schema.sql        # skema pangkalan data — jalankan di Supabase
├── src/app/page.tsx           # laman awam (waktu solat + pengumuman)
├── src/app/daftar/            # borang pendaftaran ahli + khairat
├── src/app/admin/             # panel admin (senarai + kelulusan)
├── src/app/api/waktu-solat/   # proxy API waktu solat JAKIM
├── src/components/             # komponen UI
└── src/lib/                    # klien Supabase (awam & admin)
```
