-- ============================================================
-- RENORUMAH — Fasa 2: Sisi Pro/Hero + Money Spine
-- provider_profiles (kontraktor/vendor) + RLS. Idempotent.
-- (Pipeline guna projects.status sedia ada — tiada lajur baru.)
-- ============================================================

create table if not exists public.provider_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  kind          text not null default 'pro',        -- pro | hero
  company_name  text,
  full_name     text,
  ssm_no        text,
  ic_no         text,
  entity_type   text,                                -- enterprise | sdnbhd
  cidb_grade    text,
  pic_name      text,
  pic_phone     text,
  pic_email     text,
  trades        text[],
  service_areas text[],
  bio           text,
  status        text not null default 'pending',     -- pending | approved | rejected
  reviewed_at   timestamptz,
  created_at    timestamptz default now()
);

create index if not exists provider_profiles_status_idx on public.provider_profiles(status);

alter table public.provider_profiles enable row level security;

-- Provider baca/kemas rekod sendiri. (Master guna service-role client — langkau RLS.)
do $$ begin
  create policy provp_own on public.provider_profiles for all
    using (auth.uid() = id) with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
