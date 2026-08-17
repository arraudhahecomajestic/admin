-- ============================================================
-- e-Surau · Skema Fasa 25 (Pembekal + Tuntutan Bayaran)
-- Portal untuk vendor/imam/bilal/supplier hantar tuntutan sendiri.
-- Jalankan di Supabase SQL Editor (selepas fasa 1-24).
-- ============================================================

-- ---------- Pembekal (penuntut bayaran) ----------
create table if not exists pembekal (
  id           uuid primary key default gen_random_uuid(),
  jenis        text not null default 'vendor',  -- vendor|imam|bilal|supplier|lain
  nama         text not null,
  syarikat     text,
  no_kp        text,
  telefon      text,
  emel         text unique,
  bank         text,
  no_akaun     text,
  nama_akaun   text,
  penyelia_id  uuid references profil(id) on delete set null,  -- AJK penyemak (Fasa 2)
  status       text not null default 'menunggu',  -- menunggu|lulus|tolak
  catatan      text,
  dicipta      timestamptz not null default now()
);

alter table profil add column if not exists pembekal_id uuid references pembekal(id) on delete set null;

-- ---------- Tuntutan bayaran ----------
create table if not exists tuntutan_bayaran (
  id              uuid primary key default gen_random_uuid(),
  no_tuntutan     text unique,
  pembekal_id     uuid not null references pembekal(id) on delete cascade,
  butiran         text not null,
  jumlah          numeric(10,2) not null check (jumlah > 0),
  url_dokumen     text,                                -- invois / resit sokongan
  status          text not null default 'baru',        -- baru|disah_ajk|diluluskan|dibayar|ditolak
  catatan         text,
  sah_ajk_oleh    text,
  tarikh_sah_ajk  timestamptz,
  lulus_oleh      text,
  tarikh_lulus    timestamptz,
  perbelanjaan_id uuid references perbelanjaan(id) on delete set null,
  url_slip        text,                                -- slip bayaran
  rujukan_bayar   text,
  tarikh_bayar    timestamptz,
  dicipta         timestamptz not null default now()
);

-- Auto no_tuntutan: TB2026-0001
create sequence if not exists seq_no_tuntutan_bayaran start 1;
create or replace function set_no_tuntutan_bayaran() returns trigger as $$
begin
  if new.no_tuntutan is null then
    new.no_tuntutan := 'TB' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_no_tuntutan_bayaran')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_no_tuntutan_bayaran on tuntutan_bayaran;
create trigger trg_no_tuntutan_bayaran before insert on tuntutan_bayaran
  for each row execute function set_no_tuntutan_bayaran();

-- ---------- RPC: daftar pembekal (dipanggil sebelum signUp) ----------
create or replace function daftar_pembekal(payload jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  insert into pembekal (jenis, nama, syarikat, no_kp, telefon, emel, bank, no_akaun, nama_akaun, status)
  values (
    coalesce(nullif(payload->>'jenis',''), 'vendor'),
    payload->>'nama',
    nullif(payload->>'syarikat',''),
    nullif(payload->>'no_kp',''),
    nullif(payload->>'telefon',''),
    lower(nullif(payload->>'emel','')),
    nullif(payload->>'bank',''),
    nullif(payload->>'no_akaun',''),
    nullif(payload->>'nama_akaun',''),
    'menunggu'
  )
  on conflict (emel) do update set
    jenis = excluded.jenis, nama = excluded.nama, syarikat = excluded.syarikat,
    no_kp = excluded.no_kp, telefon = excluded.telefon,
    bank = excluded.bank, no_akaun = excluded.no_akaun, nama_akaun = excluded.nama_akaun
  returning id into v_id;
  return jsonb_build_object('ok', true, 'id', v_id);
end; $$;
grant execute on function daftar_pembekal(jsonb) to anon, authenticated;

-- ---------- Kemas kini trigger handle_new_user: paut ahli_id DAN pembekal_id ikut emel ----------
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profil (id, nama, emel)
  values (new.id, new.raw_user_meta_data->>'nama', new.email)
  on conflict (id) do nothing;

  update profil p
     set ahli_id = (
        select a.id from ahli_kariah a
        where a.emel is not null and lower(a.emel) = lower(new.email)
        order by a.tarikh_daftar desc limit 1)
   where p.id = new.id and p.ahli_id is null;

  update profil p
     set pembekal_id = (
        select b.id from pembekal b
        where b.emel is not null and lower(b.emel) = lower(new.email)
        order by b.dicipta desc limit 1)
   where p.id = new.id and p.pembekal_id is null;

  return new;
end; $$;

alter table pembekal enable row level security;
alter table tuntutan_bayaran enable row level security;
-- Tiada policy awam: akses melalui server (service_role) sahaja.
