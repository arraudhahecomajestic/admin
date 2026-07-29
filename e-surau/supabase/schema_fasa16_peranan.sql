-- ============================================================
-- e-Surau · Skema Fasa 16 (Master admin + peranan Imam)
-- Jalankan SELEPAS fasa 1-15.
-- NOTA: jalankan baris ALTER TYPE dahulu (berasingan) jika editor
-- keluar ralat "unsafe use of new value".
-- ============================================================

-- Tambah peranan 'imam'
alter type peranan_jenis add value if not exists 'imam';

-- Penanda master admin
alter table profil add column if not exists master boolean not null default false;

-- Lantik Setiausaha sebagai Master Admin
update profil set master = true, peranan = 'admin'
where lower(emel) = lower('syahmiseliman@gmail.com');

select id, nama, emel, peranan, master from profil where master = true;
