-- ============================================================
-- e-Surau · Skema Fasa 23 (Kategori kutipan "Sewaan Ruang")
-- Supaya income dari bayaran sewaan online (CHIP) masuk ke Kewangan.
-- Kategori ini TIDAK dipapar di laman utama (papar_awam = false).
-- Jalankan di Supabase SQL Editor.
-- ============================================================

insert into kategori_kutipan (nama, jenis_khairat) values ('Sewaan Ruang', false)
on conflict (nama) do nothing;

update kategori_kutipan set papar_awam = false where nama = 'Sewaan Ruang';

select id, nama, papar_awam from kategori_kutipan order by id;
