-- ============================================================
-- e-Surau · Fasa 56 — Panel Penilaian (purata) untuk Kenaikan Gaji
--  Bila ramai penilai (AJK/Pengerusi/Bendahari) menilai staf yang sama
--  dalam tempoh sama, sistem purata markah -> satu markah PANEL.
--  Kenaikan gaji dirujuk kepada purata panel (min 60%), bukan satu penilaian.
--  Fail ini cuma tambah 2 kolum info panel pada rekod sejarah kenaikan.
--  Jalankan di Supabase SQL Editor. SQL sahaja - tiada perubahan bucket.
-- ============================================================

alter table staf_gaji_sejarah add column if not exists bilangan_penilai int;
alter table staf_gaji_sejarah add column if not exists penilaian_tempoh text;

-- Refresh cache API PostgREST (elak "schema cache" error selepas alter).
notify pgrst, 'reload schema';
