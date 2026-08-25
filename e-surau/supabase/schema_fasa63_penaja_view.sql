-- ============================================================
-- e-Surau · Fasa 63 — Tiering paparan penaja
--  Tambah 'pakej' ke view awam supaya laman utama & direktori
--  boleh papar ikut tahap (Emas/Perak/Gangsa vs Direktori).
--  Jalankan di Supabase SQL Editor.
-- ============================================================

create or replace view v_penaja_aktif as
select id, nama, logo_url, pautan, keterangan, kategori, tawaran, kod_promo, telefon, susunan, pakej
from penaja
where aktif and (tarikh_tamat is null or tarikh_tamat >= current_date)
order by susunan asc, nama asc;

grant select on v_penaja_aktif to anon, authenticated;

notify pgrst, 'reload schema';
