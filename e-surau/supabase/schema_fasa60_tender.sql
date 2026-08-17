-- ============================================================
-- e-Surau · Fasa 60 — Tender / Iklan Surau
--  Papan hebahan tender: kariah/vendor tengok, kongsi, muat turun dokumen,
--  & 'Nyata Minat' (hantar maklumat + sebut harga ringkas) dalam sistem.
--  Fail dokumen disimpan dalam bucket sedia ada `salinan-kp` (private),
--  folder tender/... & dibaca melalui signed URL.
--  Jalankan di Supabase SQL Editor. SQL sahaja.
-- ============================================================

create table if not exists tender (
  id             uuid primary key default gen_random_uuid(),
  no_ruj         text,                          -- no rujukan tender (cth SAR-T-01/2026)
  tajuk          text not null,
  keterangan     text,
  kategori       text,
  tarikh_iklan   date,
  tarikh_tutup   date,
  status         text not null default 'aktif', -- aktif / tutup / batal
  url_dokumen    text,                          -- dokumen tender (PDF) untuk muat turun
  nama_dokumen   text,
  pic_nama       text,
  pic_telefon    text,
  pic_emel       text,
  alamat_hantar  text,
  anggaran_nilai numeric,
  dicipta_oleh   text,
  dicipta        timestamptz not null default now(),
  dikemaskini    timestamptz not null default now()
);
alter table tender enable row level security;
create index if not exists idx_tender_status on tender (status, tarikh_tutup desc);

create table if not exists tender_minat (
  id             uuid primary key default gen_random_uuid(),
  tender_id      uuid references tender(id) on delete cascade,
  nama           text not null,
  syarikat       text,
  telefon        text,
  emel           text,
  harga_tawaran  numeric,
  catatan        text,
  url_dokumen    text,                          -- sebut harga / profil syarikat (pilihan)
  nama_dokumen   text,
  dicipta        timestamptz not null default now()
);
alter table tender_minat enable row level security;
create index if not exists idx_tender_minat on tender_minat (tender_id, dicipta desc);

-- Tiada policy: akses jadual hanya melalui service-role (createAdminClient) di server.
notify pgrst, 'reload schema';
