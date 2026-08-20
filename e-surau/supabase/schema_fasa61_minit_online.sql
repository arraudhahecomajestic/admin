-- ============================================================
-- e-Surau · Fasa 61 — Minit Mesyuarat ikut format Pengerusi (SAR)
--  Tambah medan Kehadiran Dalam Talian (online) supaya minit boleh
--  dipisahkan kepada tiga kategori: Bersemuka / Dalam Talian / Tidak Hadir.
--  Jalankan di Supabase SQL Editor. SQL sahaja.
-- ============================================================

alter table mesyuarat add column if not exists kehadiran_online text;  -- satu nama satu baris (Nama (Jawatan))

notify pgrst, 'reload schema';
