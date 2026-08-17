-- ============================================================
-- e-Surau · Skema Fasa 10 (e-Tandatangan + Swafoto pengesahan)
-- Jalankan SELEPAS fasa 1-9.
-- Ganti keperluan hardcopy: ahli tandatangan atas skrin + swafoto (selfie)
-- pegang IC sebagai bukti identiti & hidup.
-- ============================================================

alter table ahli_kariah add column if not exists url_tandatangan text;
alter table ahli_kariah add column if not exists url_selfie text;
alter table ahli_kariah add column if not exists disahkan_esign boolean not null default false;
alter table ahli_kariah add column if not exists tarikh_esign timestamptz;

-- Bucket 'salinan-kp' (fasa5) digunakan semula untuk simpan tandatangan & selfie
-- (privat; admin lihat guna signed URL). Tiada perubahan bucket diperlukan.
