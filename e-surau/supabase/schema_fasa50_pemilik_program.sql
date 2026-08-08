-- ============================================================
-- e-Surau · Fasa 50 — Pemilik program (hanya pencipta boleh edit)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table program add column if not exists dicipta_oleh uuid references profil(id) on delete set null;
alter table program add column if not exists dicipta_oleh_nama text;
