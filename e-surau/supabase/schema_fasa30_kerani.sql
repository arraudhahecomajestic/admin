-- ============================================================
-- e-Surau · Skema Fasa 30 (Peranan Kerani — semak senarai ahli sahaja)
-- Jalankan di Supabase SQL Editor. Jalankan baris ini SENDIRIAN dahulu
-- (ALTER TYPE ADD VALUE tidak boleh dalam transaksi yang sama dengan
-- penggunaan nilai baharu). Selepas itu, lantik kerani melalui
-- halaman /admin/peranan.
-- ============================================================

alter type peranan_jenis add value if not exists 'kerani';
