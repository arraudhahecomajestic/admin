-- ============================================================
-- RENORUMAH — Fasa Approval: Report Generator (post site-visit)
-- approval_reports (satu per kes) + approval_report_areas (per area).
-- Foto disimpan di Storage bucket 'assets' (public). Idempotent.
-- ============================================================

create table if not exists public.approval_reports (
  id           bigint generated always as identity primary key,
  case_id      bigint unique references public.approval_cases(id) on delete cascade,
  verdict      text,                         -- green | amber | red (boleh override)
  ringkasan    text,                         -- intro / ringkasan
  isu_kritikal jsonb default '[]'::jsonb,     -- [{ text }]
  token        text unique,                  -- pautan awam
  status       text default 'draft',          -- draft | issued
  issued_at    timestamptz,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create table if not exists public.approval_report_areas (
  id         bigint generated always as identity primary key,
  report_id  bigint references public.approval_reports(id) on delete cascade,
  sort       int  default 0,
  title      text,
  note_raw   text,
  finding    text,
  action     text,
  photos     jsonb default '[]'::jsonb,        -- [ url, ... ]
  created_at timestamptz default now()
);
create index if not exists arep_areas_report_idx on public.approval_report_areas(report_id, sort);

alter table public.approval_reports      enable row level security;
alter table public.approval_report_areas enable row level security;
-- Akses app = service-role (admin). Page /r/[token] baca via admin ikut token.
