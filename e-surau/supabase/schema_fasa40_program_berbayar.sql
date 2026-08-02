-- ============================================================
-- e-Surau · Skema Fasa 40
--  Pendaftaran Program Berbayar + Consent + Kesihatan (CHIP)
--  Jalankan di Supabase SQL Editor.
-- ============================================================

-- (1) Program boleh jadi berbayar
alter table program add column if not exists berbayar boolean not null default false;
alter table program add column if not exists yuran numeric(10,2) not null default 0;

-- (2) Jadual pendaftaran peserta program (kem/kelas dsb.)
create table if not exists program_pendaftaran (
  id                 uuid primary key default gen_random_uuid(),
  program_id         uuid not null references program(id) on delete cascade,
  nama_peserta       text not null,
  umur               int,
  sekolah            text,
  jantina            text,
  nama_penjaga       text not null,
  telefon_penjaga    text not null,
  emel               text,
  kontak_kecemasan   text,
  no_kecemasan       text,
  maklumat_kesihatan text,               -- alahan / penyakit / ubat
  kebenaran_ibubapa  boolean not null default false,
  kebenaran_foto     boolean not null default false,
  kumpulan           text,               -- diisi admin kemudian
  hadir_h1           boolean not null default false,
  hadir_h2           boolean not null default false,
  status_bayar       text not null default 'menunggu',  -- menunggu | dibayar | percuma
  chip_id            text,
  jumlah             numeric(10,2) not null default 0,
  dicipta            timestamptz not null default now()
);

create index if not exists idx_prog_pend_program on program_pendaftaran(program_id);

alter table program_pendaftaran enable row level security;
-- Akses hanya melalui service-role (server actions). Tiada polisi anon/authenticated.

-- (3) Kategori kutipan untuk yuran program (rekod kewangan; tidak papar awam)
insert into kategori_kutipan (nama, jenis_khairat, papar_awam)
values ('Yuran Program', false, false)
on conflict (nama) do nothing;
