-- ============================================================
-- e-Surau · Skema Pangkalan Data (Fasa 1)
-- Jalankan dalam Supabase: SQL Editor > New query > Run
-- ============================================================

-- Extension untuk UUID
create extension if not exists "pgcrypto";

-- ---------- ENUM ----------
do $$ begin
  create type status_ahli as enum ('menunggu', 'lulus', 'tolak');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_khairat as enum ('aktif', 'tertunggak', 'tamat');
exception when duplicate_object then null; end $$;

do $$ begin
  create type hubungan_tanggungan as enum ('pasangan', 'anak', 'ibu', 'bapa', 'lain');
exception when duplicate_object then null; end $$;

-- ============================================================
-- JADUAL: ahli_kariah
-- ============================================================
create table if not exists ahli_kariah (
  id            uuid primary key default gen_random_uuid(),
  no_ahli       text unique,
  nama          text not null,
  no_kp         text not null unique,
  telefon       text not null,
  emel          text,
  alamat        text,
  status_perkahwinan text,
  status        status_ahli not null default 'menunggu',
  aktif         boolean not null default true,
  catatan       text,
  tarikh_daftar timestamptz not null default now()
);

-- ============================================================
-- JADUAL: tanggungan  (isi rumah / orang bawah tanggungan)
-- ============================================================
create table if not exists tanggungan (
  id               uuid primary key default gen_random_uuid(),
  ahli_id          uuid not null references ahli_kariah(id) on delete cascade,
  nama             text not null,
  no_kp            text,
  hubungan         hubungan_tanggungan not null,
  tarikh_lahir     date,
  dilindungi_khairat boolean not null default true
);

-- ============================================================
-- JADUAL: keahlian_khairat  (opt-in; 1 ahli = 1 keahlian)
-- ============================================================
create table if not exists keahlian_khairat (
  id                   uuid primary key default gen_random_uuid(),
  ahli_id              uuid not null unique references ahli_kariah(id) on delete cascade,
  no_khairat           text unique,
  tarikh_sertai        date not null default current_date,
  kadar_yuran_tahunan  numeric(10,2) not null default 60.00,   -- RM60/tahun
  status               status_khairat not null default 'tertunggak'
);

-- ============================================================
-- JADUAL: yuran_khairat  (bayaran tahunan)
-- ============================================================
create table if not exists yuran_khairat (
  id            uuid primary key default gen_random_uuid(),
  keahlian_id   uuid not null references keahlian_khairat(id) on delete cascade,
  tahun         int not null,
  jumlah        numeric(10,2) not null default 60.00,
  tarikh_bayar  date,
  lunas         boolean not null default false,
  unique (keahlian_id, tahun)
);

-- ============================================================
-- JADUAL: pengumuman  (papar di laman awam)
-- ============================================================
create table if not exists pengumuman (
  id          uuid primary key default gen_random_uuid(),
  tajuk       text not null,
  kandungan   text not null,
  penting     boolean not null default false,
  diterbitkan boolean not null default true,
  tarikh      timestamptz not null default now()
);

-- ============================================================
-- Kadar tetap sistem (pampasan khairat RM1400, dsb)
-- ============================================================
create table if not exists tetapan (
  kunci  text primary key,
  nilai  text not null
);
insert into tetapan (kunci, nilai) values
  ('kadar_yuran_khairat', '60'),
  ('jumlah_pampasan_khairat', '1400'),
  ('nama_surau', 'Surau Ar Raudhah, Eco Majestic Semenyih'),
  ('zon_solat', 'SGR01')
on conflict (kunci) do nothing;

-- ============================================================
-- Auto-jana no_ahli (AK0001) & no_khairat (KH0001)
-- ============================================================
create sequence if not exists seq_no_ahli start 1;
create sequence if not exists seq_no_khairat start 1;

create or replace function set_no_ahli() returns trigger as $$
begin
  if new.no_ahli is null then
    new.no_ahli := 'AK' || lpad(nextval('seq_no_ahli')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_no_ahli on ahli_kariah;
create trigger trg_no_ahli before insert on ahli_kariah
  for each row execute function set_no_ahli();

create or replace function set_no_khairat() returns trigger as $$
begin
  if new.no_khairat is null then
    new.no_khairat := 'KH' || lpad(nextval('seq_no_khairat')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_no_khairat on keahlian_khairat;
create trigger trg_no_khairat before insert on keahlian_khairat
  for each row execute function set_no_khairat();

-- ============================================================
-- RPC: daftar_ahli
-- Pendaftaran awam (anon) — masukkan ahli + tanggungan + opt-in khairat
-- dalam satu transaksi. Ahli sentiasa masuk status 'menunggu'.
-- ============================================================
create or replace function daftar_ahli(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahli_id uuid;
  v_keahlian_id uuid;
  v_tgg jsonb;
begin
  insert into ahli_kariah (nama, no_kp, telefon, emel, alamat, status_perkahwinan, status)
  values (
    payload->>'nama',
    payload->>'no_kp',
    payload->>'telefon',
    nullif(payload->>'emel',''),
    nullif(payload->>'alamat',''),
    nullif(payload->>'status_perkahwinan',''),
    'menunggu'
  )
  returning id into v_ahli_id;

  -- Tanggungan (jika ada)
  if payload ? 'tanggungan' then
    for v_tgg in select * from jsonb_array_elements(payload->'tanggungan')
    loop
      insert into tanggungan (ahli_id, nama, no_kp, hubungan, tarikh_lahir, dilindungi_khairat)
      values (
        v_ahli_id,
        v_tgg->>'nama',
        nullif(v_tgg->>'no_kp',''),
        (coalesce(nullif(v_tgg->>'hubungan',''),'lain'))::hubungan_tanggungan,
        nullif(v_tgg->>'tarikh_lahir','')::date,
        coalesce((v_tgg->>'dilindungi_khairat')::boolean, true)
      );
    end loop;
  end if;

  -- Opt-in khairat
  if coalesce((payload->>'sertai_khairat')::boolean, false) then
    insert into keahlian_khairat (ahli_id, status)
    values (v_ahli_id, 'tertunggak')
    returning id into v_keahlian_id;
  end if;

  return jsonb_build_object('ok', true, 'ahli_id', v_ahli_id, 'keahlian_id', v_keahlian_id);
end;
$$;

-- Benarkan anon panggil RPC pendaftaran
grant execute on function daftar_ahli(jsonb) to anon, authenticated;

-- ============================================================
-- Keselamatan Peringkat Baris (RLS)
-- ============================================================
alter table ahli_kariah      enable row level security;
alter table tanggungan       enable row level security;
alter table keahlian_khairat enable row level security;
alter table yuran_khairat    enable row level security;
alter table pengumuman       enable row level security;
alter table tetapan          enable row level security;

-- Pengumuman & tetapan: sesiapa boleh baca (untuk laman awam)
drop policy if exists "baca pengumuman awam" on pengumuman;
create policy "baca pengumuman awam" on pengumuman
  for select using (diterbitkan = true);

drop policy if exists "baca tetapan awam" on tetapan;
create policy "baca tetapan awam" on tetapan
  for select using (true);

-- Data ahli: TIADA akses langsung untuk anon/authenticated biasa.
-- Operasi admin dibuat guna service_role key (bypass RLS) dari server.
-- Pendaftaran awam dibuat melalui RPC daftar_ahli (security definer) sahaja.

-- ============================================================
-- Contoh data pengumuman
-- ============================================================
insert into pengumuman (tajuk, kandungan, penting) values
  ('Kelas Fardhu Ain', 'Setiap malam Isnin selepas Maghrib di ruang utama surau.', false),
  ('Gotong-royong Perdana', 'Ahad ini jam 8 pagi. Semua ahli kariah dijemput hadir.', true)
on conflict do nothing;
