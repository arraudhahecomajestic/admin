-- ============================================================
-- e-Surau · Skema Fasa 69 (Program Soft-Delete / Arkib)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- Padam program kini "soft delete": rekod TIDAK dibuang terus, cuma ditanda
-- dibuang_pada = masa dipadam. Program & RSVP masih kekal dalam DB dan boleh
-- dipulihkan (set dibuang_pada = null semula). Ini elak kehilangan kekal bila
-- tersilap tekan Padam.
alter table program add column if not exists dibuang_pada timestamptz;

-- Cara PULIH program yang terpadam (jalankan manual bila perlu):
--   update program set dibuang_pada = null where tajuk ilike '%memanah%';
--
-- Cara lihat program yang telah diarkib:
--   select id, tajuk, tarikh, dibuang_pada from program
--   where dibuang_pada is not null order by dibuang_pada desc;
