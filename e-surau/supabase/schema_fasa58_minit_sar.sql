-- ============================================================
-- e-Surau · Fasa 58 — Format Minit Mesyuarat rasmi SAR
--  Tambah medan Bilangan mesyuarat (cth 1/2025) & senarai Tidak Hadir Bersebab
--  supaya minit boleh dipapar/cetak mengikut format rasmi Surau Ar-Raudhah.
--  Jalankan di Supabase SQL Editor. SQL sahaja.
-- ============================================================

alter table mesyuarat add column if not exists bil         text;   -- cth "1/2025"
alter table mesyuarat add column if not exists tidak_hadir  text;   -- satu nama satu baris (Nama (Jawatan))

notify pgrst, 'reload schema';
