-- e-Surau · SKEMA PENUH (Fasa 1-6)

-- >>>>>>>>>>>>>>>>> schema.sql >>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>> schema_fasa2.sql >>>>>>>>>>>>>>>>>

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

-- >>>>>>>>>>>>>>>>> schema_fasa3.sql >>>>>>>>>>>>>>>>>

-- ============================================================
-- e-Surau · Skema Fasa 3 (Kewangan Teras — Fund Accounting)
-- Jalankan SELEPAS schema.sql (Fasa 1) & schema_fasa2.sql (Fasa 2).
-- Menambah: dana (tabung berasingan), invois, online transfer,
-- penjejakan resit emel, dan view baki dana.
-- ============================================================

-- ---------- ENUM ----------
do $$ begin
  create type status_invois as enum ('belum', 'sebahagian', 'lunas', 'batal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type status_transfer as enum ('menunggu', 'sah', 'tolak');
exception when duplicate_object then null; end $$;

-- ============================================================
-- DANA (tabung berasingan — fund accounting)
-- ============================================================
create table if not exists dana (
  id     serial primary key,
  kod    text not null unique,
  nama   text not null,
  aktif  boolean not null default true
);
insert into dana (kod, nama) values
  ('AM', 'Tabung Am'),
  ('KHAIRAT', 'Tabung Khairat'),
  ('PROGRAM', 'Tabung Program'),
  ('WAKAF', 'Tabung Wakaf')
on conflict (kod) do nothing;

-- Kaitkan kategori & transaksi ke dana
alter table kategori_kutipan add column if not exists dana_id int references dana(id);
alter table kutipan          add column if not exists dana_id int references dana(id);
alter table perbelanjaan     add column if not exists dana_id int references dana(id);
alter table kutipan          add column if not exists invois_id uuid;
alter table kutipan          add column if not exists emel_resit_dihantar boolean not null default false;
alter table kutipan          add column if not exists emel_resit_pada timestamptz;

-- Padankan kategori sedia ada ke dana yang sesuai
update kategori_kutipan set dana_id = (select id from dana where kod='KHAIRAT')
  where nama = 'Yuran Khairat' and dana_id is null;
update kategori_kutipan set dana_id = (select id from dana where kod='WAKAF')
  where nama = 'Wakaf' and dana_id is null;
update kategori_kutipan set dana_id = (select id from dana where kod='AM')
  where dana_id is null;

-- Isi dana_id transaksi sedia ada (default ikut kategori, jika tak ada → AM)
update kutipan k set dana_id = coalesce(
  (select dana_id from kategori_kutipan kk where kk.id = k.kategori_id),
  (select id from dana where kod='AM'))
  where k.dana_id is null;
update perbelanjaan p set dana_id = (select id from dana where kod='AM')
  where p.dana_id is null;

-- ============================================================
-- INVOIS (bil dalaman) + item
-- ============================================================
create table if not exists invois (
  id            uuid primary key default gen_random_uuid(),
  no_invois     text unique,
  ahli_id       uuid references ahli_kariah(id) on delete set null,
  nama_penerima text,                       -- jika bukan ahli
  keterangan    text,
  jumlah        numeric(10,2) not null default 0,
  status        status_invois not null default 'belum',
  tarikh        date not null default current_date,
  tarikh_tamat  date,
  dicipta       timestamptz not null default now()
);

create table if not exists invois_item (
  id          uuid primary key default gen_random_uuid(),
  invois_id   uuid not null references invois(id) on delete cascade,
  keterangan  text not null,
  harga       numeric(10,2) not null default 0,
  kuantiti    int not null default 1,
  jumlah      numeric(10,2) generated always as (harga * kuantiti) stored
);

-- FK kutipan.invois_id → invois (ditambah selepas invois wujud)
do $$ begin
  alter table kutipan
    add constraint fk_kutipan_invois
    foreign key (invois_id) references invois(id) on delete set null;
exception when duplicate_object then null; end $$;

-- Auto no_invois (INV000001)
create sequence if not exists seq_no_invois start 1;
create or replace function set_no_invois() returns trigger as $$
begin
  if new.no_invois is null then
    new.no_invois := 'INV' || lpad(nextval('seq_no_invois')::text, 6, '0');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_no_invois on invois;
create trigger trg_no_invois before insert on invois
  for each row execute function set_no_invois();

-- Kira semula jumlah invois bila item berubah
create or replace function segar_jumlah_invois(p_invois uuid)
returns void language plpgsql as $$
declare v_jumlah numeric(10,2);
begin
  select coalesce(sum(jumlah),0) into v_jumlah from invois_item where invois_id = p_invois;
  update invois set jumlah = v_jumlah where id = p_invois;
end; $$;

create or replace function trg_item_segar() returns trigger as $$
begin
  perform segar_jumlah_invois(coalesce(new.invois_id, old.invois_id));
  return null;
end; $$ language plpgsql;
drop trigger if exists trg_invois_item_segar on invois_item;
create trigger trg_invois_item_segar after insert or update or delete on invois_item
  for each row execute function trg_item_segar();

-- ============================================================
-- ONLINE TRANSFER (rekod manual + bukti; disahkan → jadi kutipan)
-- ============================================================
create table if not exists online_transfer (
  id            uuid primary key default gen_random_uuid(),
  ahli_id       uuid references ahli_kariah(id) on delete set null,
  nama_penghantar text not null,
  jumlah        numeric(10,2) not null check (jumlah > 0),
  kategori_id   int references kategori_kutipan(id),
  tujuan        text,
  url_bukti     text,                 -- pautan fail dalam Supabase Storage
  status        status_transfer not null default 'menunggu',
  kutipan_id    uuid references kutipan(id) on delete set null,  -- diisi bila disahkan
  tarikh        date not null default current_date,
  dicipta       timestamptz not null default now()
);

-- ============================================================
-- VIEW: baki setiap dana (sumber kebenaran untuk laporan)
-- baki = kutipan - perbelanjaan - pampasan khairat dibayar
-- ============================================================
create or replace view v_baki_dana as
with masuk as (
  select dana_id, sum(jumlah) amt from kutipan group by dana_id
),
keluar as (
  select dana_id, sum(jumlah) amt from perbelanjaan group by dana_id
),
pampasan as (
  select (select id from dana where kod='KHAIRAT') as dana_id,
         sum(jumlah_pampasan) amt
  from tuntutan_khairat where status = 'dibayar'
)
select d.id, d.kod, d.nama,
  coalesce(m.amt,0)
  - coalesce(k.amt,0)
  - coalesce(case when d.kod='KHAIRAT' then p.amt else 0 end,0) as baki
from dana d
left join masuk m on m.dana_id = d.id
left join keluar k on k.dana_id = d.id
left join pampasan p on p.dana_id = d.id;

-- ============================================================
-- VIEW: ringkasan bulanan (untuk laporan pendapatan & perbelanjaan)
-- ============================================================
create or replace view v_ringkasan_bulanan as
select
  to_char(tarikh, 'YYYY-MM') as bulan,
  'masuk' as jenis,
  dana_id,
  sum(jumlah) as jumlah
from kutipan group by 1,2,3
union all
select
  to_char(tarikh, 'YYYY-MM') as bulan,
  'keluar' as jenis,
  dana_id,
  sum(jumlah) as jumlah
from perbelanjaan group by 1,2,3;

-- ============================================================
-- RLS untuk jadual baru (akses admin guna service_role)
-- ============================================================
alter table dana            enable row level security;
alter table invois          enable row level security;
alter table invois_item     enable row level security;
alter table online_transfer enable row level security;

-- Online transfer: benarkan orang awam (anon) HANTAR permohonan sahaja
drop policy if exists "awam hantar transfer" on online_transfer;
create policy "awam hantar transfer" on online_transfer
  for insert to anon, authenticated with check (status = 'menunggu');

-- >>>>>>>>>>>>>>>>> schema_fasa4_auth.sql >>>>>>>>>>>>>>>>>

-- ============================================================
-- e-Surau · Skema Fasa 4 (Auth Berperanan — Supabase Auth)
-- Jalankan SELEPAS schema.sql, fasa2, fasa3.
-- Menambah: profil pengguna terpaut auth.users, peranan (RBAC),
-- fungsi pembantu, dan polisi RLS berasaskan peranan.
-- ============================================================

-- ---------- ENUM peranan ----------
do $$ begin
  create type peranan_jenis as enum ('admin', 'bendahari', 'ajk', 'ahli');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFIL — satu baris untuk setiap pengguna auth
-- ============================================================
create table if not exists profil (
  id        uuid primary key references auth.users(id) on delete cascade,
  nama      text,
  emel      text,
  ahli_id   uuid references ahli_kariah(id) on delete set null,
  peranan   peranan_jenis not null default 'ahli',
  dicipta   timestamptz not null default now()
);

-- Auto-cipta profil bila pengguna baharu daftar melalui Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profil (id, nama, emel)
  values (new.id, new.raw_user_meta_data->>'nama', new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_auth_user_baharu on auth.users;
create trigger trg_auth_user_baharu
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNGSI PEMBANTU peranan (guna dalam polisi RLS)
-- ============================================================
create or replace function auth_peranan()
returns peranan_jenis language sql stable security definer set search_path = public as $$
  select peranan from profil where id = auth.uid();
$$;

create or replace function is_staf()
returns boolean language sql stable as $$
  select auth_peranan() in ('admin','bendahari','ajk');
$$;

create or replace function is_admin_atau_bendahari()
returns boolean language sql stable as $$
  select auth_peranan() in ('admin','bendahari');
$$;

-- ============================================================
-- POLISI RLS berasaskan peranan
-- (staf boleh urus; ahli baca rekod sendiri)
-- ============================================================
alter table profil enable row level security;

drop policy if exists "profil: baca sendiri" on profil;
create policy "profil: baca sendiri" on profil
  for select using (id = auth.uid() or is_staf());

drop policy if exists "profil: admin urus" on profil;
create policy "profil: admin urus" on profil
  for all using (auth_peranan() = 'admin') with check (auth_peranan() = 'admin');

-- Ahli kariah: staf urus penuh; ahli baca rekod sendiri
drop policy if exists "ahli: staf urus" on ahli_kariah;
create policy "ahli: staf urus" on ahli_kariah
  for all using (is_staf()) with check (is_staf());

drop policy if exists "ahli: baca sendiri" on ahli_kariah;
create policy "ahli: baca sendiri" on ahli_kariah
  for select using (
    id = (select ahli_id from profil where profil.id = auth.uid())
  );

-- Kewangan: staf urus; ahli baca kutipan/invois sendiri
drop policy if exists "kutipan: staf urus" on kutipan;
create policy "kutipan: staf urus" on kutipan
  for all using (is_staf()) with check (is_staf());

drop policy if exists "kutipan: ahli baca sendiri" on kutipan;
create policy "kutipan: ahli baca sendiri" on kutipan
  for select using (
    ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

drop policy if exists "perbelanjaan: staf urus" on perbelanjaan;
create policy "perbelanjaan: staf urus" on perbelanjaan
  for all using (is_admin_atau_bendahari()) with check (is_admin_atau_bendahari());

drop policy if exists "invois: staf urus" on invois;
create policy "invois: staf urus" on invois
  for all using (is_staf()) with check (is_staf());

drop policy if exists "invois: ahli baca sendiri" on invois;
create policy "invois: ahli baca sendiri" on invois
  for select using (
    ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

-- Nota: operasi pentadbiran dari server masih boleh guna service_role
-- (bypass RLS). Polisi di atas membolehkan akses terus berasaskan peranan
-- untuk masa depan (portal ahli & pengurangan kebergantungan service_role).

-- ============================================================
-- CADANGAN: selepas cipta pengguna admin pertama di Supabase Auth,
-- jalankan sekali untuk jadikan dia admin:
--   update profil set peranan='admin' where emel='EMEL_ADMIN_ANDA';
-- ============================================================

-- >>>>>>>>>>>>>>>>> schema_fasa5_jais.sql >>>>>>>>>>>>>>>>>

-- ============================================================
-- e-Surau · Skema Fasa 5 (Pematuhan Borang JAIS Selangor)
-- Borang Pendaftaran Ahli Kariah Masjid & Surau Negeri Selangor.
-- Jalankan SELEPAS schema.sql .. fasa4.
-- ============================================================

-- ---------- ENUM tempoh menetap ----------
do $$ begin
  create type unit_tempoh as enum ('tahun', 'bulan');
exception when duplicate_object then null; end $$;

-- ============================================================
-- BAHAGIAN A — medan tambahan pada ahli_kariah
-- ============================================================
alter table ahli_kariah add column if not exists kariah text;                 -- Nama masjid/surau
alter table ahli_kariah add column if not exists alamat_kp text;              -- Alamat dalam KP/Passport
-- (kolum sedia ada `alamat` digunakan sebagai Alamat Tempat Tinggal Sekarang)
alter table ahli_kariah add column if not exists no_telefon_rumah text;       -- No. Telefon Rumah
-- (kolum sedia ada `telefon` digunakan sebagai No. H/P)
alter table ahli_kariah add column if not exists tempoh_menetap_nilai int;    -- Tempoh menetap
alter table ahli_kariah add column if not exists tempoh_menetap_unit unit_tempoh default 'tahun';
alter table ahli_kariah add column if not exists pengakuan boolean not null default false; -- Bahagian A no.8
-- Salinan kad pengenalan — snap kamera (KYC): depan & belakang
alter table ahli_kariah add column if not exists url_kp_depan text;
alter table ahli_kariah add column if not exists url_kp_belakang text;

-- ============================================================
-- BAHAGIAN B — Ulasan (2 peringkat sokongan)
-- ============================================================
-- Ulasan 1: Pengerusi MPKK/JPP / Setiausaha Masjid/Surau
alter table ahli_kariah add column if not exists ulasan_su_sokong boolean;
alter table ahli_kariah add column if not exists ulasan_su_catatan text;
alter table ahli_kariah add column if not exists ulasan_su_oleh text;
alter table ahli_kariah add column if not exists ulasan_su_tarikh date;
-- Ulasan 2: Nazir Masjid / Pengerusi Surau
alter table ahli_kariah add column if not exists ulasan_nazir_sokong boolean;
alter table ahli_kariah add column if not exists ulasan_nazir_catatan text;
alter table ahli_kariah add column if not exists ulasan_nazir_oleh text;
alter table ahli_kariah add column if not exists ulasan_nazir_tarikh date;

-- ============================================================
-- BAHAGIAN C — Keputusan Permohonan (JK Kariah/Surau)
-- Status akhir kekal di kolum `status` (menunggu/lulus/tolak).
-- ============================================================
alter table ahli_kariah add column if not exists keputusan_oleh text;
alter table ahli_kariah add column if not exists keputusan_tarikh date;

-- Peringkat aliran kerja (untuk paparkan status proses kepada pemohon)
do $$ begin
  create type peringkat_permohonan as enum
    ('baru', 'disokong_su', 'disokong_nazir', 'selesai');
exception when duplicate_object then null; end $$;
alter table ahli_kariah add column if not exists peringkat peringkat_permohonan not null default 'baru';

-- ============================================================
-- Kemas kini RPC daftar_ahli — terima semua medan Bahagian A
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
  insert into ahli_kariah (
    kariah, nama, no_kp, alamat_kp, alamat, no_telefon_rumah, telefon, emel,
    status_perkahwinan, tempoh_menetap_nilai, tempoh_menetap_unit,
    pengakuan, url_kp_depan, url_kp_belakang, status, peringkat
  )
  values (
    nullif(payload->>'kariah',''),
    payload->>'nama',
    payload->>'no_kp',
    nullif(payload->>'alamat_kp',''),
    nullif(payload->>'alamat',''),
    nullif(payload->>'no_telefon_rumah',''),
    nullif(payload->>'telefon',''),
    nullif(payload->>'emel',''),
    nullif(payload->>'status_perkahwinan',''),
    nullif(payload->>'tempoh_menetap_nilai','')::int,
    coalesce(nullif(payload->>'tempoh_menetap_unit','')::unit_tempoh, 'tahun'),
    coalesce((payload->>'pengakuan')::boolean, false),
    nullif(payload->>'url_kp_depan',''),
    nullif(payload->>'url_kp_belakang',''),
    'menunggu', 'baru'
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

grant execute on function daftar_ahli(jsonb) to anon, authenticated;

-- ============================================================
-- STORAGE: bucket untuk salinan kad pengenalan
-- (Jalankan di Supabase; jika ralat "already exists" — abaikan)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('salinan-kp', 'salinan-kp', false)
on conflict (id) do nothing;

-- Benarkan orang awam MUAT NAIK salinan KP semasa pendaftaran
do $$ begin
  create policy "awam muat naik salinan kp" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'salinan-kp');
exception when duplicate_object then null; end $$;

-- >>>>>>>>>>>>>>>>> schema_fasa6_portal.sql >>>>>>>>>>>>>>>>>

-- ============================================================
-- e-Surau · Skema Fasa 6 (Portal Ahli — login ahli kariah)
-- Jalankan SELEPAS fasa 1-5.
-- Auto-pautkan akaun login ahli ke rekod ahli_kariah ikut emel.
-- ============================================================

-- Kemas kini trigger: bila pengguna baharu daftar, cipta profil DAN
-- pautkan ke rekod ahli_kariah yang sepadan emel (jika ada).
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profil (id, nama, emel)
  values (new.id, new.raw_user_meta_data->>'nama', new.email)
  on conflict (id) do nothing;

  -- Pautkan ke rekod ahli sedia ada (padan emel) — jadikan peranan 'ahli'
  update profil p
     set ahli_id = (
        select a.id from ahli_kariah a
        where a.emel is not null
          and lower(a.emel) = lower(new.email)
        order by a.tarikh_daftar desc
        limit 1
     )
   where p.id = new.id and p.ahli_id is null;

  return new;
end; $$;

-- RPC bantuan: pautkan akaun semasa ke rekod ahli ikut emel (jika trigger
-- terlepas kerana rekod dicipta selepas akaun). Boleh dipanggil oleh ahli.
create or replace function pautkan_akaun_ahli()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_emel text; v_ahli uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'sebab', 'tiada sesi'); end if;
  select emel into v_emel from profil where id = auth.uid();
  if v_emel is null then return jsonb_build_object('ok', false, 'sebab', 'tiada emel'); end if;

  select id into v_ahli from ahli_kariah
    where emel is not null and lower(emel) = lower(v_emel)
    order by tarikh_daftar desc limit 1;

  if v_ahli is not null then
    update profil set ahli_id = v_ahli where id = auth.uid();
  end if;
  return jsonb_build_object('ok', v_ahli is not null, 'ahli_id', v_ahli);
end; $$;

grant execute on function pautkan_akaun_ahli() to authenticated;

-- RLS: ahli boleh baca keahlian khairat & yuran mereka sendiri
alter table keahlian_khairat enable row level security;
alter table yuran_khairat    enable row level security;

drop policy if exists "khairat: ahli baca sendiri" on keahlian_khairat;
create policy "khairat: ahli baca sendiri" on keahlian_khairat
  for select using (
    is_staf() or ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

drop policy if exists "yuran: ahli baca sendiri" on yuran_khairat;
create policy "yuran: ahli baca sendiri" on yuran_khairat
  for select using (
    is_staf() or keahlian_id in (
      select k.id from keahlian_khairat k
      where k.ahli_id = (select ahli_id from profil where profil.id = auth.uid())
    )
  );
