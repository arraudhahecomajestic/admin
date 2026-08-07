-- ============================================================
-- e-Surau · Fasa 46 — Jawatan rasmi pengguna + Pengesahan terima bayaran
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1) Jawatan rasmi per-pengguna (untuk TTD baucer, cth "Penolong Bendahari").
alter table profil add column if not exists jawatan text;

-- 2) Jawatan yang direkod pada baucer — ikut siapa buat setiap langkah.
alter table perbelanjaan add column if not exists direkod_jawatan text;
alter table perbelanjaan add column if not exists diluluskan_jawatan text;
alter table perbelanjaan add column if not exists dibayar_jawatan text;

-- 3) Pengesahan penerimaan bayaran oleh penuntut (bahagian "Diterima Oleh").
alter table tuntutan_bayaran add column if not exists diterima_disah boolean not null default false;
alter table tuntutan_bayaran add column if not exists tarikh_terima timestamptz;

-- 4) (Pilihan) Set jawatan rasmi kakitangan sedia ada.
--    Tukar emel di bawah kepada emel sebenar mereka, kemudian nyahkomen (buang "-- ").
-- update profil set jawatan = 'Penolong Bendahari' where lower(emel) = 'farid@contoh.com';
-- update profil set jawatan = 'Setiausaha'        where lower(emel) = 'lovaffmy@gmail.com';
