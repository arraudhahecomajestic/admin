-- ============================================================
-- e-Surau · Skema Fasa 32 (Direktori & Tawaran Rakan Surau)
-- Tambah medan tawaran/kod promo/telefon pada penaja + kemas kini view awam.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table penaja add column if not exists tawaran   text;  -- cth: "10% diskaun untuk ahli kariah"
alter table penaja add column if not exists kod_promo  text;  -- cth: "SURAU10"
alter table penaja add column if not exists telefon    text;  -- no. telefon / WhatsApp

create or replace view v_penaja_aktif as
select id, nama, logo_url, pautan, keterangan, kategori, tawaran, kod_promo, telefon, susunan
from penaja
where aktif and (tarikh_tamat is null or tarikh_tamat >= current_date)
order by susunan asc, nama asc;

grant select on v_penaja_aktif to anon, authenticated;
