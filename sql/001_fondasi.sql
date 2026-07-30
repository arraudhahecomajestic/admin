-- ============================================================
-- RENORUMAH — Fasa 1: Fondasi
-- profiles (peranan) + trigger · tetapan_sistem · projects
-- catalog_items (rate library) · project_bq · RLS
-- Idempotent — selamat run berulang.
-- ============================================================

-- ---------- PROFILES (peranan pengguna) ----------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  peranan    text not null default 'homeowner',   -- homeowner | pro | hero
  nama       text,
  telefon    text,
  created_at timestamptz default now()
);

-- Auto-cipta profil bila user baru daftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- TETAPAN SISTEM (kunci-nilai) ----------
create table if not exists public.tetapan_sistem (
  kunci      text primary key,
  nilai      jsonb not null,
  label      text,
  updated_at timestamptz default now()
);

insert into public.tetapan_sistem (kunci, nilai, label) values
  ('margin_pct',     '12',              'Margin platform RR (%)'),
  ('reserve_pct',    '1',               'Reserve waranti (%)'),
  ('kos_frontend',   '3000',            'Kos front-end (site visit + BQ + design), RM'),
  ('jadual_deposit', '[50,45,5]',       'Jadual bayaran berperingkat (%)'),
  ('skop_waranti',   '"waterproofing"', 'Skop waranti 10 tahun')
on conflict (kunci) do nothing;

-- ---------- PROJECTS ----------
create table if not exists public.projects (
  id            bigint generated always as identity primary key,
  owner_id      uuid references auth.users(id) on delete set null,
  title         text,
  property_type text,
  built_up      numeric,
  scope_detail  jsonb,
  status        text default 'new',
  created_at    timestamptz default now()
);
create index if not exists projects_owner_idx on public.projects(owner_id);

-- ---------- CATALOG ITEMS (rate library) ----------
create table if not exists public.catalog_items (
  scope_code   text primary key,
  description  text,
  unit         text,
  default_rate numeric,
  kategori     text
);

insert into public.catalog_items (scope_code, description, unit, default_rate, kategori) values
  ('elektrik.rewire',        'Full rewiring + tukar DB box',  'sqft',  3.50,  'Elektrik'),
  ('plumbing.full',          'Tukar paip (seluruh rumah)',    'sqft',  3.00,  'Plumbing'),
  ('cat.penuh',              'Cat dalam & luar',              'sqft',  2.00,  'Cat'),
  ('lantai.tukar',           'Tukar lantai (jubin/vinyl)',    'sqft',  8.00,  'Lantai'),
  ('siling.plaster',         'Plaster ceiling + cornice',     'sqft',  9.00,  'Siling'),
  ('bilikair.ubahsuai',      'Ubah suai bilik air penuh',     'bilik', 8000,  'Bilik air'),
  ('waterproofing.bilikair', 'Waterproofing bilik air',       'bilik', 1500,  'Waterproofing'),
  ('dapur.kabinet',          'Kabinet dapur (atas & bawah)',  'set',   12000, 'Dapur'),
  ('grille.pintu',           'Grille tingkap / pintu',        'unit',  3500,  'Kelengkapan')
on conflict (scope_code) do nothing;

-- ---------- PROJECT BQ ----------
create table if not exists public.project_bq (
  project_id bigint primary key references public.projects(id) on delete cascade,
  bq         jsonb,
  subtotal   numeric,
  updated_at timestamptz default now()
);

-- ---------- RLS (app guna service-role; ni defense-in-depth) ----------
alter table public.profiles       enable row level security;
alter table public.projects       enable row level security;
alter table public.project_bq     enable row level security;
alter table public.catalog_items  enable row level security;
alter table public.tetapan_sistem enable row level security;

do $$ begin create policy prof_own on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;

do $$ begin create policy proj_own on public.projects for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
exception when duplicate_object then null; end $$;

do $$ begin create policy bq_own_read on public.project_bq for select
  using (exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin create policy cat_read on public.catalog_items for select using (true);
exception when duplicate_object then null; end $$;

do $$ begin create policy tet_read on public.tetapan_sistem for select using (true);
exception when duplicate_object then null; end $$;
