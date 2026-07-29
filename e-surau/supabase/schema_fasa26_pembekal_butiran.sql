-- ============================================================
-- e-Surau · Skema Fasa 26 (Butiran tambahan pembekal — individu vs syarikat)
-- Jalankan SELEPAS fasa 25.
-- ============================================================

alter table pembekal add column if not exists jenis_entiti text not null default 'individu'; -- individu | syarikat
alter table pembekal add column if not exists no_ssm text;
alter table pembekal add column if not exists url_profil_syarikat text;   -- company profile
alter table pembekal add column if not exists url_kp_depan text;          -- IC depan (individu)
alter table pembekal add column if not exists url_kp_belakang text;       -- IC belakang (individu)
alter table pembekal add column if not exists url_katalog text;           -- katalog produk / menu makanan
