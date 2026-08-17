-- ============================================================
-- e-Surau · Fasa 55 — Dokumen Staf (Modul HR Staf 4/4)
--  Simpan surat tawaran, aku janji, WI, borang penilaian, slip gaji,
--  salinan KP, lesen, sijil dsb bagi setiap staf.
--  Fail disimpan dalam bucket sedia ada `salinan-kp` (private) di bawah
--  folder dokumen-staf/<profil_id>/... dan dibaca melalui signed URL.
--  Jalankan di Supabase SQL Editor. Tiada perubahan bucket diperlukan.
-- ============================================================

create table if not exists staf_dokumen (
  id               uuid primary key default gen_random_uuid(),
  profil_id        uuid not null,               -- staf (padan staf_gaji_config.profil_id)
  nama_staf        text,                         -- snapshot nama staf ketika simpan
  jenis            text not null default 'lain', -- tawaran|aku_janji|kontrak|wi|penilaian|slip_gaji|ic|lesen|sijil|gambar|lain
  tajuk            text not null,                -- label ringkas dokumen
  url_fail         text not null,                -- cth 'salinan-kp/dokumen-staf/<id>/<uuid>.pdf'
  nama_fail        text,                         -- nama asal fail
  tarikh_dokumen   date,                         -- cth tarikh surat / bulan slip
  catatan          text,
  dimuat_naik_oleh text,                         -- nama SU/admin yang muat naik
  dicipta          timestamptz not null default now()
);

alter table staf_dokumen enable row level security;
-- Tiada policy: akses jadual hanya melalui service-role (createAdminClient) di server.

create index if not exists idx_staf_dokumen_profil on staf_dokumen (profil_id, dicipta desc);

-- Selesai. Modul: /admin/staf/dokumen (SU/Admin) & paparan "Dokumen Saya"
-- dalam Portal Staf (/kerani).
