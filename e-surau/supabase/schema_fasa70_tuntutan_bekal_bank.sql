-- ============================================================
-- e-Surau · Fasa 70 — Tuntutan Dalaman: Tarikh Pembekalan, Akaun Bank,
--                      langkah Sah AJK, + akaun bank pada baucer.
-- Jalankan di Supabase SQL Editor (selepas fasa 49 & 24).
-- ============================================================

-- (1) Tarikh pembekalan/perkhidmatan — untuk elak submission berganda.
alter table tuntutan_dalaman add column if not exists tarikh_bekal date;

-- (2) Akaun bank penerima (penuntut) — untuk pembayaran oleh Bendahari.
alter table tuntutan_dalaman add column if not exists bank text;
alter table tuntutan_dalaman add column if not exists no_akaun text;
alter table tuntutan_dalaman add column if not exists nama_akaun text;

-- (3) Langkah semakan AJK bertugas (baru → disah_ajk → diproses → dibayar).
alter table tuntutan_dalaman add column if not exists sah_ajk_oleh text;
alter table tuntutan_dalaman add column if not exists tarikh_sah_ajk timestamptz;

-- (4) Akaun bank pada baucer (perbelanjaan) — dipapar di senarai & baucer cetak.
alter table perbelanjaan add column if not exists bank text;
alter table perbelanjaan add column if not exists no_akaun text;
alter table perbelanjaan add column if not exists nama_akaun text;
