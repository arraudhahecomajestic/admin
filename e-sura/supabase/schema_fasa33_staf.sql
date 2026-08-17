-- ============================================================
-- e-Surau · Skema Fasa 33 (Portal Staf — Penolong Pengurus Surau)
-- Kehadiran/shift, checklist harian, tugasan, laporan, log aktiviti.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1) KEHADIRAN (clock in/out ikut shift)
create table if not exists staf_kehadiran (
  id         uuid primary key default gen_random_uuid(),
  profil_id  uuid references profil(id) on delete set null,
  nama       text,
  tarikh     date not null default current_date,
  shift      text not null,               -- 'pagi' (8-5) / 'petang' (2-10)
  masuk      timestamptz,
  keluar     timestamptz,
  catatan    text,
  dicipta    timestamptz not null default now()
);
create index if not exists idx_kehadiran_tarikh on staf_kehadiran(tarikh);

-- 2) CHECKLIST — templat tugas harian (diurus admin)
create table if not exists staf_checklist_item (
  id       serial primary key,
  tajuk    text not null,
  shift    text not null default 'semua', -- 'pagi' / 'petang' / 'semua'
  susunan  int not null default 100,
  aktif    boolean not null default true
);

-- 2b) CHECKLIST — rekod siap (satu baris setiap item setiap hari)
create table if not exists staf_checklist_log (
  id       uuid primary key default gen_random_uuid(),
  item_id  int not null references staf_checklist_item(id) on delete cascade,
  tarikh   date not null default current_date,
  siap     boolean not null default true,
  oleh     text,
  masa     timestamptz not null default now(),
  unique (item_id, tarikh)
);

-- 3) TUGASAN KHAS (arahan ad-hoc)
create table if not exists staf_tugasan (
  id           uuid primary key default gen_random_uuid(),
  tajuk        text not null,
  keterangan   text,
  status       text not null default 'baru',  -- 'baru' / 'siap' / 'batal'
  oleh_tugas   text,
  tarikh_tugas timestamptz not null default now(),
  tarikh_siap  timestamptz,
  nota_siap    text
);

-- 4) LAPORAN & ADUAN (kerosakan dll)
create table if not exists staf_laporan (
  id          uuid primary key default gen_random_uuid(),
  tajuk       text not null,
  keterangan  text,
  url_gambar  text,
  status      text not null default 'baru',   -- 'baru' / 'dalam_tindakan' / 'selesai'
  oleh        text,
  tindakan    text,
  tarikh      timestamptz not null default now()
);

-- 5) LOG AKTIVITI HARIAN
create table if not exists staf_log (
  id        uuid primary key default gen_random_uuid(),
  profil_id uuid references profil(id) on delete set null,
  nama      text,
  tarikh    date not null default current_date,
  shift     text,
  catatan   text not null,
  dicipta   timestamptz not null default now()
);

-- RLS: akses melalui server (service_role) sahaja
alter table staf_kehadiran     enable row level security;
alter table staf_checklist_item enable row level security;
alter table staf_checklist_log enable row level security;
alter table staf_tugasan       enable row level security;
alter table staf_laporan       enable row level security;
alter table staf_log           enable row level security;

-- Baldi awam untuk gambar laporan
insert into storage.buckets (id, name, public) values ('staf', 'staf', true)
on conflict (id) do nothing;

-- Seed checklist templat asas (boleh ubah di /admin/staf)
insert into staf_checklist_item (tajuk, shift, susunan) values
  ('Buka pintu & lampu surau', 'pagi', 10),
  ('Hidupkan kipas / penyaman udara', 'pagi', 20),
  ('Semak & bersih ruang solat + karpet', 'pagi', 30),
  ('Semak kebersihan tandas & tempat wuduk', 'semua', 40),
  ('Semak sistem PA / mikrofon', 'semua', 50),
  ('Sedia keperluan solat Jumaat / program', 'semua', 60),
  ('Kutip & rekod tabung (jika ada)', 'petang', 70),
  ('Tutup tingkap, kipas, lampu & kunci surau', 'petang', 80)
on conflict do nothing;
