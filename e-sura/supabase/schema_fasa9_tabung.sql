-- ============================================================
-- e-Surau · Skema Fasa 9 (Tabung Kutipan & Kategori Belanja + paparan awam)
-- Jalankan SELEPAS fasa 1-8.
-- ============================================================

-- Kawalan paparan awam & susunan untuk kategori kutipan
alter table kategori_kutipan add column if not exists urutan int not null default 100;
alter table kategori_kutipan add column if not exists papar_awam boolean not null default true;

-- ---------- Ganti kategori KUTIPAN dengan 4 tabung rasmi ----------
-- Buang kategori lama yang TIDAK digunakan (elak ralat FK jika ada rekod).
delete from kategori_kutipan
  where nama in ('Infaq / Derma', 'Yuran Bulanan', 'Wakaf')
    and id not in (select distinct kategori_id from kutipan);

insert into kategori_kutipan (nama, jenis_khairat) values
  ('Kutipan Mingguan (Sabtu–Khamis)', false),
  ('Kutipan Mingguan (Jumaat)', false),
  ('Tabung Khas', false),
  ('Yuran Khairat', true)
on conflict (nama) do nothing;

-- Susunan paparan
update kategori_kutipan set urutan = 1, papar_awam = true where nama = 'Kutipan Mingguan (Sabtu–Khamis)';
update kategori_kutipan set urutan = 2, papar_awam = true where nama = 'Kutipan Mingguan (Jumaat)';
update kategori_kutipan set urutan = 3, papar_awam = true where nama = 'Tabung Khas';
update kategori_kutipan set urutan = 4, papar_awam = true where nama = 'Yuran Khairat';
-- Sembunyikan sebarang kategori lama yang masih tinggal (kerana ada rekod)
update kategori_kutipan set papar_awam = false
  where nama not in ('Kutipan Mingguan (Sabtu–Khamis)', 'Kutipan Mingguan (Jumaat)', 'Tabung Khas', 'Yuran Khairat');

-- ---------- Ganti kategori BELANJA dengan senarai rasmi ----------
delete from kategori_belanja
  where nama in ('Utiliti (air/elektrik)', 'Penyelenggaraan', 'Program / Aktiviti', 'Elaun / Upah', 'Peralatan', 'Lain-lain')
    and id not in (select distinct kategori_id from perbelanjaan);

insert into kategori_belanja (nama) values
  ('Gaji / Elaun Pekerja'),
  ('Utiliti'),
  ('Pengurusan'),
  ('Elaun Imam, Bilal & Siak'),
  ('Belanja Am'),
  ('Pembelian Aset'),
  ('Kebajikan'),
  ('Selenggara')
on conflict (nama) do nothing;

-- ---------- Paparan awam: ringkasan tabung untuk front page ----------
create or replace view v_kutipan_ringkasan as
select
  kk.id as kategori_id,
  kk.nama,
  kk.jenis_khairat,
  kk.urutan,
  coalesce(sum(k.jumlah), 0) as jumlah_terkumpul,
  coalesce(sum(k.jumlah) filter (where date_trunc('month', k.tarikh) = date_trunc('month', current_date)), 0) as jumlah_bulan_ini,
  (select k2.jumlah from kutipan k2 where k2.kategori_id = kk.id order by k2.tarikh desc, k2.dicipta desc limit 1) as terkini_jumlah,
  (select k2.tarikh from kutipan k2 where k2.kategori_id = kk.id order by k2.tarikh desc, k2.dicipta desc limit 1) as terkini_tarikh
from kategori_kutipan kk
left join kutipan k on k.kategori_id = kk.id
where kk.papar_awam
group by kk.id, kk.nama, kk.jenis_khairat, kk.urutan
order by kk.urutan, kk.id;

-- Sejarah kutipan (tanpa nama penderma) untuk paparan awam
create or replace view v_kutipan_sejarah as
select k.kategori_id, kk.nama, k.tarikh, k.jumlah, k.dicipta
from kutipan k
join kategori_kutipan kk on kk.id = k.kategori_id
where kk.papar_awam
order by k.tarikh desc, k.dicipta desc;

grant select on v_kutipan_ringkasan to anon, authenticated;
grant select on v_kutipan_sejarah to anon, authenticated;
