-- ============================================================
-- e-Surau · Skema Fasa 17 (Pendaftaran Vendor / Pembekal)
-- Jalankan SELEPAS fasa 1-16.
-- ============================================================

do $$ begin
  create type status_vendor as enum ('menunggu', 'lulus', 'tolak');
exception when duplicate_object then null; end $$;

create table if not exists vendor (
  id             uuid primary key default gen_random_uuid(),
  no_rujukan     text unique,
  jenis_pemohon  text,               -- Individu / Syarikat
  nama           text not null,
  no_pendaftaran text,               -- No. SSM / No. KP
  kategori       jsonb not null default '[]'::jsonb,
  pegawai        text,               -- pegawai untuk dihubungi
  telefon        text,
  whatsapp       text,
  emel           text,
  alamat         text,
  keterangan     text,
  status         status_vendor not null default 'menunggu',
  catatan_admin  text,
  dicipta        timestamptz not null default now()
);

create sequence if not exists seq_no_vendor start 1;
create or replace function set_no_vendor() returns trigger as $$
begin
  if new.no_rujukan is null then
    new.no_rujukan := 'SAR-VENDOR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_no_vendor')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_no_vendor on vendor;
create trigger trg_no_vendor before insert on vendor for each row execute function set_no_vendor();
