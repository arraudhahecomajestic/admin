-- ============================================================
-- e-Surau · Fasa 49 — Tuntutan Dalaman (AJK/Staf)
--  Ahli jawatankuasa/staf hantar tuntutan sendiri (cth beli barang surau)
--  tanpa perlu daftar sebagai vendor. Flow: Bendahari jana baucer →
--  Pengerusi lulus → Bayar (guna sistem baucer sedia ada).
--  Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists tuntutan_dalaman (
  id              uuid primary key default gen_random_uuid(),
  no_tuntutan     text unique,                        -- TD2026-0001
  profil_id       uuid references profil(id) on delete set null,
  nama_pemohon    text not null,                      -- snapshot nama
  jawatan         text,                               -- snapshot jawatan
  butiran         text not null,
  jumlah          numeric(10,2) not null check (jumlah > 0),
  url_dokumen     text,                               -- resit/invois sokongan
  kategori_id     integer references kategori_belanja(id) on delete set null,
  status          text not null default 'baru',       -- baru|diproses|dibayar|ditolak
  perbelanjaan_id uuid references perbelanjaan(id) on delete set null,
  url_slip        text,
  rujukan_bayar   text,
  tarikh_bayar    timestamptz,
  catatan         text,                               -- sebab tolak / nota
  dicipta         timestamptz not null default now()
);

create index if not exists idx_tuntutan_dalaman_profil on tuntutan_dalaman(profil_id);
create index if not exists idx_tuntutan_dalaman_status on tuntutan_dalaman(status);

-- Auto no_tuntutan: TD2026-0001
create sequence if not exists seq_no_tuntutan_dalaman start 1;
create or replace function set_no_tuntutan_dalaman() returns trigger as $$
begin
  if new.no_tuntutan is null then
    new.no_tuntutan := 'TD' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_no_tuntutan_dalaman')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;
drop trigger if exists trg_no_tuntutan_dalaman on tuntutan_dalaman;
create trigger trg_no_tuntutan_dalaman before insert on tuntutan_dalaman
  for each row execute function set_no_tuntutan_dalaman();

alter table tuntutan_dalaman enable row level security;
-- Akses hanya melalui server (service_role). Tiada polisi anon/authenticated.
