-- ============================================================
-- e-Surau · Fasa 59 — Lampiran Minit Mesyuarat
--  Simpan slide pembentangan, dokumen & gambar yang dirujuk dalam mesyuarat.
--  Fail disimpan dalam bucket sedia ada `salinan-kp` (private) di bawah
--  folder mesyuarat-lampiran/<mesyuarat_id>/... & dibaca melalui signed URL.
--  Jalankan di Supabase SQL Editor. SQL sahaja.
-- ============================================================

create table if not exists mesyuarat_lampiran (
  id           uuid primary key default gen_random_uuid(),
  mesyuarat_id uuid references mesyuarat(id) on delete cascade,
  tajuk        text not null,
  url_fail     text not null,            -- cth 'salinan-kp/mesyuarat-lampiran/<id>/<uuid>.pdf'
  nama_fail    text,
  dicipta_oleh text,
  dicipta      timestamptz not null default now()
);

alter table mesyuarat_lampiran enable row level security;
-- Tiada policy: akses jadual hanya melalui service-role (createAdminClient) di server.

create index if not exists idx_mesyuarat_lampiran on mesyuarat_lampiran (mesyuarat_id, dicipta);

notify pgrst, 'reload schema';
