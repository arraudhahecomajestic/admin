-- ============================================================
-- e-Surau · Fasa 44 — Slip bayaran pada baucer perbelanjaan
--  Jalankan di Supabase SQL Editor.
-- ============================================================

-- Slip bayaran (bukti pindahan) dimuat naik oleh Bendahari selepas bayaran dibuat.
alter table perbelanjaan add column if not exists url_slip text;
