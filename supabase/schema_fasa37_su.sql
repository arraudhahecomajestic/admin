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
