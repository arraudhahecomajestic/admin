-- ============================================================
-- e-Surau · Skema Fasa 65 (Check-in Kehadiran — QR self check-in)
-- Jalankan di Supabase SQL Editor (selepas fasa 13 program & fasa 64).
-- ============================================================

-- Suis buka/tutup check-in kehadiran bagi setiap program (buka pada hari acara).
alter table program add column if not exists checkin_dibuka boolean not null default false;

-- Tandaan kehadiran pada rekod RSVP.
alter table rsvp add column if not exists hadir       boolean not null default false;
alter table rsvp add column if not exists hadir_pada  timestamptz;
alter table rsvp add column if not exists walk_in     boolean not null default false;  -- daftar terus di pintu (tanpa RSVP awal)

-- Profil kehadiran: ahli kariah berdaftar? dari kariah tempatan atau luar?
alter table rsvp add column if not exists adalah_ahli boolean not null default false;  -- padan rekod ahli_kariah ikut telefon
alter table rsvp add column if not exists asal        text;                            -- 'tempatan' (kariah Eco Majestic) | 'luar'

create index if not exists idx_rsvp_hadir on rsvp(program_id, hadir);
