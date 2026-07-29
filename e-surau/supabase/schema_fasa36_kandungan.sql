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
