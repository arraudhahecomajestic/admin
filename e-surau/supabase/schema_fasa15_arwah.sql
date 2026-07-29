-- ============================================================
-- e-Surau · Skema Fasa 15 (Yaasin & Tahlil — senarai arwah)
-- Jalankan SELEPAS fasa 1-14.
-- ============================================================

create table if not exists arwah (
  id       uuid primary key default gen_random_uuid(),
  nama     text not null,
  jantina  text not null default 'tidak_pasti',   -- lelaki / perempuan / tidak_pasti
  pemohon  text,
  telefon  text,
  minggu   date not null,                          -- tarikh Khamis sesi berkenaan
  dicipta  timestamptz not null default now()
);

-- Paparan awam: senarai arwah (nama sahaja, tanpa maklumat pemohon) untuk sesi akan datang
create or replace view v_arwah_akan as
select id, nama, jantina, minggu
from arwah
where minggu >= current_date - 1
order by minggu asc, jantina asc, nama asc;

grant select on v_arwah_akan to anon, authenticated;
