-- ============================================================
-- RENORUMAH — Fasa Approval: Library future-proof + editor
-- Self-contained & idempotent. Selamat run walau 003 belum/dah run.
-- Tambah: building_types (kategori kediaman/komersial), submission_types,
--         ruang `extra` fleksibel, dimensi submission_type pada
--         settings & cases. Tiada FK keras pada dimensi (max fleksibiliti).
-- ============================================================

-- ---------- Pastikan asas wujud (dari 003) ----------
create table if not exists public.councils (
  code text primary key, name text not null, active boolean default true, created_at timestamptz default now()
);
insert into public.councils (code, name) values
  ('mpkj',   'Majlis Perbandaran Kajang (MPKj)'),
  ('sepang', 'Majlis Perbandaran Sepang (MPSepang)')
on conflict (code) do nothing;

create table if not exists public.approval_profiles (
  id bigint generated always as identity primary key,
  council_code text not null,
  house_type text not null,
  storeys int not null,
  setback_rear_ft numeric, setback_side_ft numeric, setback_front_ft numeric,
  max_coverage_pct numeric, needs_pe_double boolean, neighbour_consent_required boolean,
  notes text, updated_at timestamptz default now(),
  unique (council_code, house_type, storeys)
);

create table if not exists public.approval_settings (
  council_code text not null, kunci text not null, nilai jsonb not null, updated_at timestamptz default now()
);

create table if not exists public.approval_cases (
  id bigint generated always as identity primary key,
  council_code text, house_type text, storeys int, work_type text,
  answers jsonb, auto_verdict text, auto_reasons jsonb, contact jsonb,
  status text default 'check_done', created_at timestamptz default now()
);
create index if not exists approval_cases_status_idx  on public.approval_cases(status);
create index if not exists approval_cases_created_idx  on public.approval_cases(created_at desc);

-- ---------- JENIS BANGUNAN (data — boleh tambah dari admin) ----------
create table if not exists public.building_types (
  code     text primary key,
  label    text not null,
  category text not null default 'kediaman',   -- kediaman | komersial
  sort     int  default 0,
  active   boolean default true
);
insert into public.building_types (code, label, category, sort) values
  ('teres',  'Teres',  'kediaman', 1),
  ('semid',  'Semi-D', 'kediaman', 2),
  ('banglo', 'Banglo', 'kediaman', 3)
on conflict (code) do nothing;

-- ---------- JENIS PERMOHONAN (submission types) ----------
create table if not exists public.submission_types (
  code   text primary key,
  label  text not null,
  sort   int  default 0,
  active boolean default true,
  notes  text
);
insert into public.submission_types (code, label, sort, notes) values
  ('ubahsuai', 'Ubah Suai / Tambahan', 1, 'Extension / renovation — satu pelan, drafter-led')
on conflict (code) do nothing;
-- FUTURE (isi bila ready): ('rebuild','Roboh & Bina Baru', 2,
--   'Kebenaran Merancang + Pelan Bangunan (Arkitek) + C&S + M&E')

-- ---------- Ruang fleksibel + dimensi baru (additive) ----------
alter table public.approval_profiles add column if not exists extra jsonb;

alter table public.approval_settings add column if not exists submission_type text not null default 'ubahsuai';
alter table public.approval_settings drop constraint if exists approval_settings_pkey;
create unique index if not exists approval_settings_uidx
  on public.approval_settings(council_code, submission_type, kunci);

alter table public.approval_cases add column if not exists submission_type   text default 'ubahsuai';
alter table public.approval_cases add column if not exists building_category text default 'kediaman';

-- ---------- Isi 12 baris profil kosong (2 majlis × 3 jenis × 2 tingkat) ----------
insert into public.approval_profiles (council_code, house_type, storeys)
select c.code, t.code, s.storeys
from public.councils c
cross join public.building_types t
cross join (values (1), (2)) as s(storeys)
where c.active and t.active
on conflict (council_code, house_type, storeys) do nothing;

-- ---------- RLS (semua akses app = service-role; tutup anon) ----------
alter table public.councils          enable row level security;
alter table public.approval_profiles enable row level security;
alter table public.approval_settings enable row level security;
alter table public.approval_cases    enable row level security;
alter table public.building_types    enable row level security;
alter table public.submission_types  enable row level security;
