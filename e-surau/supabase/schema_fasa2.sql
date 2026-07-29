-- ============================================================
-- e-Surau · Skema Fasa 2 (Kewangan + Khairat penuh)
-- Jalankan SELEPAS schema.sql (Fasa 1) di Supabase SQL Editor.
-- ============================================================

do $$ begin
  create type kaedah_bayar as enum ('tunai', 'online', 'cek');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_tuntutan as enum ('menunggu', 'lulus', 'dibayar', 'tolak');
exception when duplicate_object then null; end $$;

-- ---------- Kategori kutipan ----------
create table if not exists kategori_kutipan (
  id    serial primary key,
  nama  text not null unique,
  jenis_khairat boolean not null default false  -- true = masuk tabung khairat
);
insert into kategori_kutipan (nama, jenis_khairat) values
  ('Infaq / Derma', false),
  ('Yuran Bulanan', false),
  ('Wakaf', false),
  ('Tabung Khas', false),
  ('Yuran Khairat', true)
on conflict (nama) do nothing;

-- ---------- Kutipan (pendapatan) ----------
create table if not exists kutipan (
  id            uuid primary key default gen_random_uuid(),
  no_resit      text unique,
  ahli_id       uuid references ahli_kariah(id) on delete set null,
  kategori_id   int not null references kategori_kutipan(id),
  jumlah        numeric(10,2) not null check (jumlah > 0),
  kaedah        kaedah_bayar not null default 'tunai',
  catatan       text,
  tarikh        date not null default current_date,
  direkod_oleh  text,
  dicipta       timestamptz not null default now()
);

-- ---------- Kategori perbelanjaan ----------
create table if not exists kategori_belanja (
  id    serial primary key,
  nama  text not null unique
);
insert into kategori_belanja (nama) values
  ('Utiliti (air/elektrik)'), ('Penyelenggaraan'), ('Program / Aktiviti'),
  ('Elaun / Upah'), ('Peralatan'), ('Lain-lain')
on conflict (nama) do nothing;

-- ---------- Perbelanjaan ----------
create table if not exists perbelanjaan (
  id            uuid primary key default gen_random_uuid(),
  kategori_id   int not null references kategori_belanja(id),
  jumlah        numeric(10,2) not null check (jumlah > 0),
  keterangan    text not null,
  dari_khairat  boolean not null default false,  -- true = keluar dari tabung khairat
  tarikh        date not null default current_date,
  direkod_oleh  text,
  dicipta       timestamptz not null default now()
);

-- ---------- Tuntutan khairat kematian ----------
create table if not exists tuntutan_khairat (
  id              uuid primary key default gen_random_uuid(),
  no_tuntutan     text unique,
  keahlian_id     uuid not null references keahlian_khairat(id) on delete cascade,
  jenis_si_mati   text not null,             -- 'ahli' atau 'tanggungan'
  tanggungan_id   uuid references tanggungan(id) on delete set null,
  nama_si_mati    text not null,
  tarikh_kematian date not null,
  jumlah_pampasan numeric(10,2) not null default 1400,
  nama_waris      text,
  telefon_waris   text,
  status          status_tuntutan not null default 'menunggu',
  catatan         text,
  tarikh_bayar    date,
  dicipta         timestamptz not null default now()
);

-- ---------- Auto no_resit (RS000001) & no_tuntutan (TK0001) ----------
create sequence if not exists seq_no_resit start 1;
create sequence if not exists seq_no_tuntutan start 1;

create or replace function set_no_resit() returns trigger as $$
begin
  if new.no_resit is null then
    new.no_resit := 'RS' || lpad(nextval('seq_no_resit')::text, 6, '0');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_no_resit on kutipan;
create trigger trg_no_resit before insert on kutipan
  for each row execute function set_no_resit();

create or replace function set_no_tuntutan() returns trigger as $$
begin
  if new.no_tuntutan is null then
    new.no_tuntutan := 'TK' || lpad(nextval('seq_no_tuntutan')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_no_tuntutan on tuntutan_khairat;
create trigger trg_no_tuntutan before insert on tuntutan_khairat
  for each row execute function set_no_tuntutan();

-- ============================================================
-- Fungsi: kemas kini status keahlian khairat ikut yuran tahun semasa
-- aktif = yuran tahun semasa lunas; tertunggak = belum bayar tahun ini
-- ============================================================
create or replace function segar_status_khairat(p_keahlian uuid)
returns void language plpgsql as $$
declare
  v_tahun int := extract(year from current_date);
  v_lunas boolean;
begin
  select coalesce(bool_or(lunas), false) into v_lunas
  from yuran_khairat
  where keahlian_id = p_keahlian and tahun = v_tahun;

  update keahlian_khairat
  set status = case when v_lunas then 'aktif'::status_khairat
                    else 'tertunggak'::status_khairat end
  where id = p_keahlian;
end; $$;

-- Trigger: bila yuran ditambah/dikemas kini, segar status keahlian
create or replace function trg_yuran_segar() returns trigger as $$
begin
  perform segar_status_khairat(new.keahlian_id);
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_yuran_khairat_segar on yuran_khairat;
create trigger trg_yuran_khairat_segar after insert or update on yuran_khairat
  for each row execute function trg_yuran_segar();

-- ============================================================
-- RLS untuk jadual baru (akses admin guna service_role dari server)
-- ============================================================
alter table kategori_kutipan  enable row level security;
alter table kutipan           enable row level security;
alter table kategori_belanja  enable row level security;
alter table perbelanjaan      enable row level security;
alter table tuntutan_khairat  enable row level security;
-- Tiada policy awam: hanya service_role (server) boleh akses.
