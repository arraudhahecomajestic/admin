-- ============================================================
-- e-Surau · Skema Fasa 21 (Punca rekod: import vs pendaftaran baru)
-- Membolehkan admin bezakan pemohon BARU vs ahli SEDIA ADA (import).
-- Jalankan SEKALI di Supabase SQL Editor (selepas data 539 sedia ada).
-- ============================================================

-- 'import' = ahli sedia ada / dipindah masuk;  'baru' = pendaftaran melalui borang
alter table ahli_kariah add column if not exists sumber text not null default 'baru';

-- Tandakan SEMUA rekod yang wujud sekarang sebagai 'import'
update ahli_kariah set sumber = 'import';

-- Pendaftaran baharu selepas ini akan guna default 'baru' secara automatik.

select sumber, count(*) from ahli_kariah group by sumber;
