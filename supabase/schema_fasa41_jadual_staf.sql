-- ============================================================
-- e-Surau · Skema Fasa 41 — Jadual Kerja Staf (ikut tarikh)
--  Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists staf_jadual (
  id         uuid primary key default gen_random_uuid(),
  profil_id  uuid references profil(id) on delete set null,
  nama       text,
  tarikh     date not null,
  shift      text not null,            -- 'pagi' | 'petang' | 'rehat' | 'cuti'
  catatan    text,
  dicipta    timestamptz not null default now(),
  unique (tarikh)                      -- satu entri jadual setiap tarikh (staf tunggal)
);
create index if not exists idx_jadual_tarikh on staf_jadual(tarikh);

alter table staf_jadual enable row level security;
-- Akses melalui service-role (server actions) sahaja.
