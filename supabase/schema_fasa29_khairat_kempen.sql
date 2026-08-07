-- ============================================================
-- e-Surau · Skema Fasa 29 (Toggle khairat + pakej pelbagai tahun)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- Tetapan sistem (suis & nilai boleh ubah tanpa deploy semula)
create table if not exists tetapan_sistem (
  kunci text primary key,
  nilai text
);
insert into tetapan_sistem (kunci, nilai) values
  ('khairat_dibuka', 'false'),
  ('pampasan_khairat', '1200')
on conflict (kunci) do nothing;

alter table tetapan_sistem enable row level security;
drop policy if exists "tetapan baca awam" on tetapan_sistem;
create policy "tetapan baca awam" on tetapan_sistem for select using (true);
grant select on tetapan_sistem to anon, authenticated;

-- Bilangan tahun bagi pakej khairat (untuk bayaran)
alter table bayaran add column if not exists tahun_bil int not null default 1;
