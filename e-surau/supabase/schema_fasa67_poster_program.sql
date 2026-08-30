-- ============================================================
-- e-Surau · Skema Fasa 67 (Poster / Iklan Program)
-- Jalankan di Supabase SQL Editor (selepas fasa 13 program).
-- ============================================================

-- URL poster (gambar iklan) program — dipapar di atas halaman program.
alter table program add column if not exists poster_url text;

-- Nota: fail poster dimuat naik ke baldi storage awam sedia ada "kandungan"
-- (path: poster-program/<id>-<ts>.<ext>) melalui server action kemasProgram.
-- Tiada baldi baharu diperlukan.
