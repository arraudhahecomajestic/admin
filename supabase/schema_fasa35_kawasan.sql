-- ============================================================
-- e-Surau · Skema Fasa 35 (Kawasan / Fasa Ahli Kariah)
-- Tambah medan kawasan pada ahli_kariah (untuk kumpul ikut jalan/fasa).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table ahli_kariah add column if not exists kawasan text;
comment on column ahli_kariah.kawasan is 'Kod fasa/kawasan: cradleton, tenderfield, stoneridge, mellowood, merrydale, cheerywood, karisma, harmoni, simfoni, lain';
