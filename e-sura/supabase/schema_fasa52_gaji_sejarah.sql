-- ============================================================
-- e-Surau · Fasa 52 — Sejarah Kenaikan Gaji Staf (Modul HR Staf 2/…)
--  Setiap kenaikan gaji direkod & mesti merujuk penilaian yang LULUS & DISAHKAN.
--  Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists staf_gaji_sejarah (
  id                       uuid primary key default gen_random_uuid(),
  profil_id                uuid references profil(id) on delete set null,
  nama                     text,
  gaji_pokok_lama          numeric,
  gaji_pokok_baru          numeric,
  elaun_perkhidmatan_lama  numeric,
  elaun_perkhidmatan_baru  numeric,
  perkhidmatan_aktif_lama  boolean,
  perkhidmatan_aktif_baru  boolean,
  jumlah_lama              numeric,      -- anggaran pakej bulanan sebelum
  jumlah_baru              numeric,      -- anggaran pakej bulanan selepas
  berkuatkuasa             date,
  penilaian_id             uuid references staf_penilaian(id) on delete set null,
  penilaian_markah         numeric,      -- snapshot markah penilaian rujukan
  penilaian_gred           text,
  diluluskan_oleh          text,
  catatan                  text,
  dicipta                  timestamptz not null default now()
);
create index if not exists idx_gaji_sejarah_profil on staf_gaji_sejarah(profil_id);

alter table staf_gaji_sejarah enable row level security;
