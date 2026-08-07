-- ============================================================
-- e-Surau · Fasa 42 — Buletin: banyak gambar
--  Jalankan di Supabase SQL Editor.
-- ============================================================

-- Simpan senarai URL gambar tambahan (selain url_fail sedia ada)
alter table buletin add column if not exists gambar text[] not null default '{}';
