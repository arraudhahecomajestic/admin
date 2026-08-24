-- ============================================================
-- e-Surau · Fasa 62 — Tajaan Penaja bayar sendiri (CHIP, upfront 3/6/9/12 bulan)
--  Penaja pilih pakej + tempoh, bayar online, logo auto-papar ikut tarikh
--  mula/tamat (view v_penaja_aktif sedia tapis ikut tarikh_tamat).
--  Jalankan di Supabase SQL Editor.
-- ============================================================

alter table penaja add column if not exists pakej         text;   -- gangsa / perak / emas / direktori
alter table penaja add column if not exists emel          text;   -- e-mel penaja (resit)
alter table penaja add column if not exists tempoh_bulan  int;    -- tempoh langganan (bulan)

-- Kategori kewangan khas untuk dana penajaan (telus dalam modul Kewangan)
insert into kategori_kutipan (nama, jenis_khairat, papar_awam)
select 'Penajaan e-Surau', false, true
where not exists (select 1 from kategori_kutipan where nama = 'Penajaan e-Surau');

notify pgrst, 'reload schema';
