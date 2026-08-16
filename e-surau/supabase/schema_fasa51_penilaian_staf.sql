-- ============================================================
-- e-Surau · Fasa 51 — Penilaian Prestasi Staf (KPI) — Modul HR Staf (1/…)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists staf_penilaian (
  id                uuid primary key default gen_random_uuid(),
  profil_id         uuid references profil(id) on delete set null,
  nama              text,               -- snapshot staf dinilai
  no_kp             text,
  jawatan           text,
  tempoh            text,               -- cth "Percubaan 17 Feb–16 Mei 2026" / "Tahunan 2026"
  tarikh_penilaian  date,
  penyelia_nama     text,
  penyelia_jawatan  text,
  markah            jsonb not null default '{}'::jsonb,  -- {"1":20,"2":22,...,"15":18}
  markah_akhir      numeric,            -- % berwajaran (0–100)
  gred              text,               -- Lemah | Sederhana | Baik | Cemerlang
  keputusan         text,              -- lulus | lanjut | tamat
  gaji_semasa       numeric,
  gaji_cadangan     numeric,
  kekuatan          text,
  penambahbaikan    text,
  ulasan_am         text,
  status            text not null default 'dihantar',  -- draf | dihantar | disahkan
  disahkan_oleh     text,
  tarikh_sah        timestamptz,
  dicipta_oleh      text,
  dicipta           timestamptz not null default now()
);
create index if not exists idx_staf_penilaian_profil on staf_penilaian(profil_id);
create index if not exists idx_staf_penilaian_status on staf_penilaian(status);

alter table staf_penilaian enable row level security;
-- Akses melalui server (service_role) sahaja.
