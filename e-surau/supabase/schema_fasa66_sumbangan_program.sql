-- ============================================================
-- e-Surau · Skema Fasa 66 (Sumbangan Khas Program — CHIP)
-- Jalankan di Supabase SQL Editor (selepas fasa 13 program).
-- ============================================================

-- Suis buka/tutup borang sumbangan khas bagi setiap program (untuk program percuma
-- yang ingin menerima sumbangan khusus, cth kos jamuan/hadiah program).
alter table program add column if not exists sumbangan_dibuka boolean not null default false;

-- Nota ringkas (pilihan) dipapar pada borang sumbangan program, cth tujuan sumbangan.
alter table program add column if not exists sumbangan_nota text;

-- Nota: rekod sumbangan disimpan dalam jadual 'bayaran' (jenis = 'program_sumbangan',
-- rujukan_id = program.id) & dimasukkan ke 'kutipan' (kategori "Sumbangan Program")
-- oleh webhook CHIP. Tiada jadual baru diperlukan.
