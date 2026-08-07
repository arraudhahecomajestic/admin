-- ============================================================
-- e-Surau · Skema Fasa 34 (Modul Gaji — Penolong Pengurus Surau)
-- Gaji dikira automatik dari attendance (staf_kehadiran).
-- Jalankan di Supabase SQL Editor SELEPAS fasa33.
-- ============================================================

-- 1) KONFIGURASI GAJI (kadar per staf — set sekali)
create table if not exists staf_gaji_config (
  profil_id             uuid primary key references profil(id) on delete cascade,
  nama                  text,
  no_kp                 text,
  jawatan               text default 'Penolong Pengurus Surau',
  tarikh_mula           date,
  bank                  text,
  no_akaun              text,
  gaji_pokok            numeric not null default 2000,
  elaun_telefon         numeric not null default 50,
  elaun_perjalanan      numeric not null default 50,
  elaun_perkhidmatan    numeric not null default 270,
  elaun_perkhidmatan_aktif boolean not null default false, -- on selepas probation
  kadar_ot              numeric not null default 9,
  elaun_hadir_sehari    numeric not null default 5,
  maks_elaun_hadir      numeric not null default 130,
  potong_lewat          numeric not null default 10,   -- setiap hari lewat >15min
  potong_cuti_sehari    numeric not null default 50,   -- cuti tanpa kebenaran
  hari_kerja_sebulan    int not null default 26,       -- untuk prorate
  dikemaskini           timestamptz not null default now()
);

-- 2) REKOD SLIP GAJI BULANAN (satu baris setiap staf setiap bulan)
create table if not exists staf_gaji (
  id                    uuid primary key default gen_random_uuid(),
  profil_id             uuid references profil(id) on delete set null,
  bulan                 text not null,                 -- 'YYYY-MM'
  -- snapshot maklumat pekerja
  nama                  text,
  no_kp                 text,
  jawatan               text,
  bank                  text,
  no_akaun              text,
  -- angka dari attendance (auto)
  hari_hadir            int not null default 0,
  hari_tepat            int not null default 0,
  hari_lewat            int not null default 0,
  jam_ot                numeric not null default 0,
  hari_cuti_tanpa_izin  int not null default 0,
  -- pendapatan
  gaji_pokok            numeric not null default 0,
  elaun_telefon         numeric not null default 0,
  elaun_perjalanan      numeric not null default 0,
  elaun_perkhidmatan    numeric not null default 0,
  elaun_kehadiran       numeric not null default 0,
  amaun_ot              numeric not null default 0,
  -- potongan
  potong_lewat          numeric not null default 0,
  potong_cuti           numeric not null default 0,
  potongan_lain         numeric not null default 0,
  potongan_lain_nota    text,
  -- jumlah
  gross                 numeric not null default 0,
  jumlah_potongan       numeric not null default 0,
  net                   numeric not null default 0,
  nota                  text,
  status                text not null default 'draf',  -- 'draf' / 'sah'
  dijana_oleh           text,
  disah_oleh            text,
  dicipta               timestamptz not null default now(),
  disahkan_pada         timestamptz,
  unique (profil_id, bulan)
);
create index if not exists idx_gaji_bulan on staf_gaji(bulan);

alter table staf_gaji_config enable row level security;
alter table staf_gaji        enable row level security;

-- Seed config Khairul (padankan dengan profil sedia ada ikut emel jika ada)
insert into staf_gaji_config (profil_id, nama, no_kp, jawatan, tarikh_mula, bank, no_akaun,
  gaji_pokok, elaun_telefon, elaun_perjalanan, elaun_perkhidmatan, elaun_perkhidmatan_aktif,
  kadar_ot, elaun_hadir_sehari, maks_elaun_hadir, potong_lewat, potong_cuti_sehari)
select p.id, 'MOHD KHAIRUL ASYRAF BIN MOHD AMIR', '881120015913', 'Penolong Pengurus Surau',
  '2026-02-17', 'Maybank', '155015086593',
  2000, 50, 50, 270, true, 9, 5, 130, 10, 50
from profil p
where p.peranan = 'kerani'
on conflict (profil_id) do nothing;
