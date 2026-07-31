-- ============================================================
-- e-Surau · Skema Fasa 39 (Maklum Balas — komplen & cadangan)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists maklum_balas (
  id        uuid primary key default gen_random_uuid(),
  jenis     text not null default 'cadangan',  -- komplen / cadangan / pertanyaan / lain
  nama      text,        -- pilihan (boleh tanpa nama)
  hubungan  text,        -- telefon / emel (pilihan)
  mesej     text not null,
  status    text not null default 'baru',      -- baru / dibaca / selesai
  tindakan  text,
  dicipta   timestamptz not null default now()
);
create index if not exists idx_maklum_balas_tarikh on maklum_balas(dicipta desc);

alter table maklum_balas enable row level security;
-- Tulis melalui server (service_role) sahaja — borang awam guna server action.
