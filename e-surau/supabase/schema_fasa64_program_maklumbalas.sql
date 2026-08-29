-- ============================================================
-- e-Surau · Skema Fasa 64 (Maklum Balas Program / Aktiviti)
-- Jalankan di Supabase SQL Editor (selepas fasa 13 program).
-- ============================================================

-- Suis buka/tutup borang maklum balas bagi setiap program.
alter table program add column if not exists maklumbalas_dibuka boolean not null default false;

-- Satu respons maklum balas bagi satu program.
create table if not exists program_maklumbalas (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references program(id) on delete cascade,
  rating      int  not null check (rating between 1 and 5),
  apa_baik    text,          -- "Apa yang baik?"
  cadangan    text,          -- "Cadangan penambahbaikan?"
  nama        text,          -- pilihan (boleh tanpa nama)
  dicipta     timestamptz not null default now()
);
create index if not exists idx_prog_mb_program on program_maklumbalas(program_id, dicipta desc);

alter table program_maklumbalas enable row level security;
-- Tulis & baca melalui server (service_role) sahaja — borang awam & panel admin
-- guna server action; tiada akses langsung anon/authenticated.
