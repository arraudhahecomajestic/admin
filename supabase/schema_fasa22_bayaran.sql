-- ============================================================
-- e-Surau · Skema Fasa 22 (Rekod pembayaran CHIP — generik)
-- Menjejak bayaran online (CHIP Collect) untuk pelbagai modul.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists bayaran (
  id            uuid primary key default gen_random_uuid(),
  chip_id       text unique,                    -- ID Purchase dari CHIP
  jenis         text not null default 'sewaan', -- 'sewaan' | 'sumbangan' | 'khairat' | 'jamuan'
  rujukan_id    uuid,                           -- id rekod berkaitan (cth: sewaan.id)
  no_rujukan    text,                           -- paparan (cth: SAR-SEWAAN-2026-0001)
  nama          text,
  emel          text,
  jumlah        numeric(10,2) not null,         -- dalam RM
  status        text not null default 'menunggu', -- menunggu | dibayar | gagal
  checkout_url  text,
  tarikh_bayar  timestamptz,
  dicipta       timestamptz not null default now()
);

create index if not exists idx_bayaran_rujukan on bayaran (rujukan_id);
create index if not exists idx_bayaran_chip on bayaran (chip_id);

alter table bayaran enable row level security;
-- Tiada policy awam: hanya service_role (server) boleh akses.
