-- ============================================================
-- e-Surau · Skema Fasa 13 (Program & Aktiviti + Aset & Inventori)
-- Jalankan SELEPAS fasa 1-12.
-- ============================================================

-- ---------- Program & Aktiviti ----------
create table if not exists program (
  id           uuid primary key default gen_random_uuid(),
  tajuk        text not null,
  keterangan   text,
  kategori     text,
  tarikh       date not null,
  masa         text,
  lokasi       text,
  had_peserta  int,
  rsvp_dibuka  boolean not null default true,
  diterbitkan  boolean not null default true,
  dicipta      timestamptz not null default now()
);

create table if not exists rsvp (
  id          uuid primary key default gen_random_uuid(),
  program_id  uuid not null references program(id) on delete cascade,
  ahli_id     uuid references ahli_kariah(id) on delete set null,
  nama        text not null,
  telefon     text,
  bil_orang   int not null default 1,
  dicipta     timestamptz not null default now()
);

-- Paparan awam: program akan datang yang diterbitkan (untuk front page)
create or replace view v_program_awam as
select p.id, p.tajuk, p.keterangan, p.kategori, p.tarikh, p.masa, p.lokasi,
       p.had_peserta, p.rsvp_dibuka,
       (select coalesce(sum(r.bil_orang),0) from rsvp r where r.program_id = p.id) as jumlah_rsvp
from program p
where p.diterbitkan and p.tarikh >= current_date
order by p.tarikh asc;

grant select on v_program_awam to anon, authenticated;

-- ---------- Aset & Inventori (dalaman) ----------
create table if not exists aset (
  id                uuid primary key default gen_random_uuid(),
  nama              text not null,
  kategori          text,
  kuantiti          int not null default 1,
  lokasi            text,
  keadaan           text,        -- Baik / Perlu Servis / Rosak
  tarikh_perolehan  date,
  nilai             numeric(10,2),
  catatan           text,
  dicipta           timestamptz not null default now()
);
