-- ============================================================
-- e-Surau · UPDATE TERKINI (GABUNGAN)
-- Fasa 34 (Gaji) + 35 (Kawasan) + 36 (Kandungan) + 37 (Setiausaha)
-- + polisi storan. Jalankan SEKALI di Supabase SQL Editor.
-- Selamat re-run (idempotent) — boleh run walau sebahagian dah dibuat.
-- ============================================================

-- >>>> FASA 34 — GAJI >>>>
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

-- >>>> FASA 35 — KAWASAN >>>>
-- ============================================================
-- e-Surau · Skema Fasa 35 (Kawasan / Fasa Ahli Kariah)
-- Tambah medan kawasan pada ahli_kariah (untuk kumpul ikut jalan/fasa).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table ahli_kariah add column if not exists kawasan text;
comment on column ahli_kariah.kawasan is 'Kod fasa/kawasan: cradleton, tenderfield, stoneridge, mellowood, merrydale, cheerywood, karisma, harmoni, simfoni, lain';

-- >>>> FASA 36 — KANDUNGAN SURAU >>>>
-- ============================================================
-- e-Surau · Skema Fasa 36 (Kandungan Surau — Visi/Misi, Carta, Buletin)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1) VISI / MISI (key-value)
create table if not exists kandungan_surau (
  kunci        text primary key,
  nilai        text,
  dikemaskini  timestamptz not null default now()
);
insert into kandungan_surau (kunci, nilai) values
  ('visi', ''), ('misi', '')
on conflict (kunci) do nothing;

-- 2) CARTA ORGANISASI (jawatan + nama + gambar)
create table if not exists carta_organisasi (
  id       uuid primary key default gen_random_uuid(),
  jawatan  text not null,
  nama     text,
  gambar_url text,
  susunan  int not null default 100,
  aktif    boolean not null default true,
  dicipta  timestamptz not null default now()
);

-- 3) BULETIN (senarai berkala + lampiran)
create table if not exists buletin (
  id           uuid primary key default gen_random_uuid(),
  tajuk        text not null,
  keterangan   text,
  url_fail     text,
  jenis_fail   text,          -- 'pdf' / 'imej'
  tarikh       date not null default current_date,
  diterbitkan  boolean not null default true,
  dicipta      timestamptz not null default now()
);
create index if not exists idx_buletin_tarikh on buletin(tarikh desc);

alter table kandungan_surau   enable row level security;
alter table carta_organisasi  enable row level security;
alter table buletin           enable row level security;

-- Baldi awam untuk gambar carta & fail buletin
insert into storage.buckets (id, name, public) values ('kandungan', 'kandungan', true)
on conflict (id) do nothing;

-- Benarkan staf/admin (login) muat naik ke bucket kandungan
do $$ begin
  create policy "muat naik kandungan" on storage.objects
    for insert to authenticated with check (bucket_id = 'kandungan');
exception when duplicate_object then null; end $$;

-- >>>> FASA 37 — PANEL SETIAUSAHA >>>>
-- ============================================================
-- e-Surau · Skema Fasa 37 (Panel Setiausaha — Mesyuarat & Surat)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- ---- MODUL A: MINIT MESYUARAT ----
create table if not exists mesyuarat (
  id          uuid primary key default gen_random_uuid(),
  tajuk       text not null,
  jenis       text not null default 'AJK',      -- AJK / Agung / Khas / Jawatankuasa Kecil
  tarikh      date,
  masa        text,
  tempat      text,
  pengerusi   text,
  pencatat    text,
  kehadiran   text,                              -- senarai hadir (satu nama satu baris)
  agenda      text,
  minit       text,
  status      text not null default 'draf',      -- draf / selesai
  dicipta     timestamptz not null default now()
);
create index if not exists idx_mesyuarat_tarikh on mesyuarat(tarikh desc);

create table if not exists mesyuarat_tindakan (
  id            uuid primary key default gen_random_uuid(),
  mesyuarat_id  uuid references mesyuarat(id) on delete cascade,
  perkara       text not null,
  tanggungjawab text,                            -- siapa bertanggungjawab
  tarikh_sasar  date,
  status        text not null default 'baru',    -- baru / dalam_tindakan / selesai
  dicipta       timestamptz not null default now()
);

-- ---- MODUL B: SURAT RASMI + DAFTAR ----
create table if not exists surat (
  id          uuid primary key default gen_random_uuid(),
  jenis       text not null default 'keluar',    -- masuk / keluar
  no_rujukan  text,
  tarikh      date not null default current_date,
  pihak       text,                              -- kepada (keluar) / daripada (masuk)
  perkara     text not null,
  kandungan   text,                              -- badan surat (untuk surat keluar)
  url_fail    text,                              -- lampiran/imbasan (untuk surat masuk)
  catatan     text,
  status      text not null default 'draf',      -- draf / dihantar / diterima / diarkib
  dicipta     timestamptz not null default now()
);
create index if not exists idx_surat_tarikh on surat(tarikh desc);

alter table mesyuarat           enable row level security;
alter table mesyuarat_tindakan  enable row level security;
alter table surat               enable row level security;

-- Baldi untuk imbasan surat masuk (private — hal dalaman AJK)
insert into storage.buckets (id, name, public) values ('surat', 'surat', false)
on conflict (id) do nothing;

do $$ begin
  create policy "surat_upload" on storage.objects
    for insert to authenticated with check (bucket_id = 'surat');
exception when duplicate_object then null; end $$;

-- >>>> POLISI STORAN TAMBAHAN (bucket staf — gambar laporan) >>>>
do $$ begin
  create policy "muat naik staf" on storage.objects
    for insert to authenticated with check (bucket_id = 'staf');
exception when duplicate_object then null; end $$;
