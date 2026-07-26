-- ============================================================
-- e-Surau · Skema Fasa 18 (Direktori Vendor awam)
-- Jalankan SELEPAS fasa 17.
-- ============================================================

create or replace view v_vendor_lulus as
select id, jenis_pemohon, nama, kategori, pegawai, telefon, whatsapp, emel, keterangan
from vendor
where status = 'lulus'
order by nama asc;

grant select on v_vendor_lulus to anon, authenticated;
