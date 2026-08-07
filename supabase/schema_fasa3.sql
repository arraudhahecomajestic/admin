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
