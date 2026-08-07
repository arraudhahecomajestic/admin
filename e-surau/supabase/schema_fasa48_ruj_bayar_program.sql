-- ============================================================
-- e-Surau · Fasa 48 — Rujukan bayaran untuk program berbayar (bayar manual)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- Rujukan pindahan yang parent perlu tulis semasa bayar (cth "Program Memanah SAR2026").
alter table program add column if not exists ruj_bayar text;
