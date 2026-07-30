-- ============================================================
-- RENORUMAH — Fasa Approval 1: Permit Approval Checker
-- councils · approval_profiles (peraturan) · approval_settings
-- (yuran/timeline/dokumen) · approval_cases (lead). Idempotent.
-- Semua akses app guna service-role (server action) — RLS tutup
-- akses anon; ni defense-in-depth.
-- ============================================================

-- ---------- COUNCILS ----------
create table if not exists public.councils (
  code       text primary key,          -- 'mpkj' | 'sepang'
  name       text not null,
  active     boolean default true,
  created_at timestamptz default now()
);

insert into public.councils (code, name) values
  ('mpkj',   'Majlis Perbandaran Kajang (MPKj)'),
  ('sepang', 'Majlis Perbandaran Sepang (MPSepang)')
on conflict (code) do nothing;

-- ---------- APPROVAL PROFILES (peraturan per majlis × jenis rumah) ----------
-- Nilai NULL = belum diisi drafter → engine anggap "kena semak" (AMBER).
create table if not exists public.approval_profiles (
  id                          bigint generated always as identity primary key,
  council_code                text not null references public.councils(code) on delete cascade,
  house_type                  text not null,        -- teres | semid | banglo
  storeys                     int  not null,        -- 1 | 2
  setback_rear_ft             numeric,
  setback_side_ft             numeric,
  setback_front_ft            numeric,
  max_coverage_pct            numeric,
  needs_pe_double             boolean,              -- double storey perlu jurutera
  neighbour_consent_required  boolean,
  notes                       text,
  updated_at                  timestamptz default now(),
  unique (council_code, house_type, storeys)
);

-- Seed 12 baris kosong (2 majlis × 3 jenis × 2 tingkat) supaya editor ada rangka.
insert into public.approval_profiles (council_code, house_type, storeys)
select c.code, t.house_type, s.storeys
from (values ('mpkj'), ('sepang')) as c(code)
cross join (values ('teres'), ('semid'), ('banglo')) as t(house_type)
cross join (values (1), (2)) as s(storeys)
on conflict (council_code, house_type, storeys) do nothing;

-- ---------- APPROVAL SETTINGS (yuran / timeline / dokumen — boleh edit) ----------
create table if not exists public.approval_settings (
  council_code text not null references public.councils(code) on delete cascade,
  kunci        text not null,          -- 'yuran' | 'timeline' | 'dokumen' | 'nota'
  nilai        jsonb not null,
  updated_at   timestamptz default now(),
  primary key (council_code, kunci)
);

-- ---------- APPROVAL CASES (lead — Level 1 free check) ----------
create table if not exists public.approval_cases (
  id            bigint generated always as identity primary key,
  council_code  text,
  house_type    text,
  storeys       int,
  work_type     text,
  answers       jsonb,                  -- borang penuh
  auto_verdict  text,                   -- green | amber | red
  auto_reasons  jsonb,                  -- [{ level, text }]
  contact       jsonb,                  -- { nama, telefon, email }
  status        text default 'check_done',
    -- check_done | wants_report | paid | docs | review | issued | converted | lost
  created_at    timestamptz default now()
);
create index if not exists approval_cases_status_idx  on public.approval_cases(status);
create index if not exists approval_cases_created_idx  on public.approval_cases(created_at desc);

-- ---------- RLS (semua akses app = service-role; tutup anon) ----------
alter table public.councils           enable row level security;
alter table public.approval_profiles  enable row level security;
alter table public.approval_settings  enable row level security;
alter table public.approval_cases     enable row level security;
-- Tiada policy anon dengan sengaja — hanya service-role client boleh baca/tulis.
