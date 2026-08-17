-- ============================================================
-- e-Surau · Fasa 57 — Tugasan / Takwim Setiausaha
--  Senarai tugasan (to-do) & tarikh penting untuk SU jejak kerja sendiri.
--  Dipapar dalam Portal Setiausaha (/admin/su).
--  Jalankan di Supabase SQL Editor. SQL sahaja.
-- ============================================================

create table if not exists su_tugasan (
  id           uuid primary key default gen_random_uuid(),
  tajuk        text not null,
  catatan      text,
  tarikh_tamat date,                    -- tarikh perlu siap / takwim (pilihan)
  siap         boolean not null default false,
  dicipta_oleh text,
  dicipta      timestamptz not null default now()
);

alter table su_tugasan enable row level security;
-- Tiada policy: akses hanya melalui service-role (createAdminClient) di server.

create index if not exists idx_su_tugasan_susun on su_tugasan (siap, tarikh_tamat);

notify pgrst, 'reload schema';
