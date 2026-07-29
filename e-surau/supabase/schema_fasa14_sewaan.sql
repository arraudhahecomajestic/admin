-- ============================================================
-- e-Surau · Skema Fasa 14 (Permohonan Sewaan Ruang Surau)
-- Jalankan SELEPAS fasa 1-13.
-- ============================================================

do $$ begin
  create type status_sewaan as enum ('menunggu', 'lulus', 'tolak', 'selesai');
exception when duplicate_object then null; end $$;

create table if not exists sewaan (
  id                 uuid primary key default gen_random_uuid(),
  no_rujukan         text unique,
  nama_pemohon       text not null,
  no_kp              text,
  status_pemohon     text,
  alamat             text,
  telefon            text,
  whatsapp           text,
  emel               text,
  nama_program       text,
  jenis_acara        text,
  tarikh_acara       date not null,
  masa_mula          text,
  masa_tamat         text,
  anggaran_kehadiran int,
  butiran            text,
  ruang              jsonb not null default '[]'::jsonb,   -- [{nama,kadar}]
  peralatan          jsonb not null default '[]'::jsonb,   -- [{nama,unit,kuantiti,kadar}]
  jumlah_ruang       numeric(10,2) not null default 0,
  jumlah_peralatan   numeric(10,2) not null default 0,
  jumlah_keseluruhan numeric(10,2) not null default 0,
  deposit            numeric(10,2) not null default 0,
  kaedah_bayar       text,
  url_tandatangan    text,
  status             status_sewaan not null default 'menunggu',
  catatan_admin      text,
  dicipta            timestamptz not null default now()
);

-- Auto no_rujukan: SAR-SEWAAN-YYYY-0001
create sequence if not exists seq_no_sewaan start 1;
create or replace function set_no_sewaan() returns trigger as $$
begin
  if new.no_rujukan is null then
    new.no_rujukan := 'SAR-SEWAAN-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_no_sewaan')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_no_sewaan on sewaan;
create trigger trg_no_sewaan before insert on sewaan for each row execute function set_no_sewaan();

-- Paparan awam untuk kalendar (tempahan akan datang, tanpa maklumat peribadi)
create or replace view v_sewaan_kalendar as
select id, tarikh_acara, masa_mula, masa_tamat, nama_program, ruang, status
from sewaan
where status in ('menunggu', 'lulus') and tarikh_acara >= current_date - 1
order by tarikh_acara asc;

grant select on v_sewaan_kalendar to anon, authenticated;
