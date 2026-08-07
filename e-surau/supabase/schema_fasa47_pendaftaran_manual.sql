-- ============================================================
-- e-Surau · Fasa 47 — Pendaftaran program: bayaran MANUAL + upload resit
-- (untuk digunakan sementara CHIP belum go live)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table program_pendaftaran add column if not exists url_resit    text;      -- bukti bayaran (private)
alter table program_pendaftaran add column if not exists bilangan     int not null default 1;  -- bilangan anak didaftarkan
alter table program_pendaftaran add column if not exists senarai_anak text;      -- senarai nama anak (ringkas)
alter table program_pendaftaran add column if not exists sebab_tolak  text;      -- jika bayaran ditolak

-- status_bayar sekarang menyokong: menunggu (CHIP) | menunggu_sah (manual, tunggu sahkan)
--                                   | dibayar (disahkan) | tolak | percuma
