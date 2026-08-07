-- ============================================================
-- e-Surau · Skema Fasa 28 (Penaja / Ruang Iklan)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists penaja (
  id           uuid primary key default gen_random_uuid(),
  nama         text not null,
  logo_url     text,
  pautan       text,
  keterangan   text,
  kategori     text,
  susunan      int not null default 100,
  aktif        boolean not null default true,
  tarikh_mula  date,
  tarikh_tamat date,
  dicipta      timestamptz not null default now()
);

alter table penaja enable row level security;
-- Akses tulis melalui server (service_role) sahaja.

-- Paparan awam: penaja aktif & masih dalam tempoh langganan
create or replace view v_penaja_aktif as
select id, nama, logo_url, pautan, keterangan, kategori, susunan
from penaja
where aktif and (tarikh_tamat is null or tarikh_tamat >= current_date)
order by susunan asc, nama asc;

grant select on v_penaja_aktif to anon, authenticated;

-- Baldi storan awam untuk logo penaja
insert into storage.buckets (id, name, public)
values ('penaja', 'penaja', true)
on conflict (id) do nothing;
