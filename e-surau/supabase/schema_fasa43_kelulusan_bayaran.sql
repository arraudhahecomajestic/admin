-- ============================================================
-- e-Surau · Fasa 43 — Aliran Kelulusan Baucer Bayaran
--  Baucer disedia dahulu (menunggu) → Pengerusi luluskan → Bendahari tanda dibayar.
--  Jalankan di Supabase SQL Editor.
-- ============================================================

-- status: 'menunggu' | 'lulus' | 'dibayar' | 'tolak'
-- Default 'dibayar' supaya rekod SEDIA ADA & import penyata bank (yang memang
-- sudah dibayar) tidak terjejas. Baucer baharu yang disedia manual akan
-- ditetapkan 'menunggu' oleh sistem.
alter table perbelanjaan add column if not exists status text not null default 'dibayar';
alter table perbelanjaan add column if not exists diluluskan_oleh text;
alter table perbelanjaan add column if not exists tarikh_lulus timestamptz;
alter table perbelanjaan add column if not exists dibayar_oleh text;
alter table perbelanjaan add column if not exists tarikh_bayar date;
alter table perbelanjaan add column if not exists sebab_tolak text;

create index if not exists idx_perbelanjaan_status on perbelanjaan(status);
