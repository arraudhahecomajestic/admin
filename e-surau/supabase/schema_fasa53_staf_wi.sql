-- ============================================================
-- e-Surau · Fasa 53 — Work Instruction (WI) Staf (Modul HR Staf 3/…)
--  Arahan kerja disimpan sebagai seksyen boleh-edit; dipapar dalam portal staf.
--  Jalankan di Supabase SQL Editor.
-- ============================================================

create table if not exists staf_wi (
  id           uuid primary key default gen_random_uuid(),
  tajuk        text not null,
  kandungan    text not null default '',
  susunan      int not null default 0,
  aktif        boolean not null default true,
  dikemaskini  timestamptz not null default now()
);
alter table staf_wi enable row level security;

-- Seed struktur asas (boleh edit/ tambah di panel admin). Elak apostrof dalam teks seed.
insert into staf_wi (tajuk, kandungan, susunan) values
('1.0 Tujuan & Skop',
 'Work Instruction ini membimbing Penolong Pengurus Surau melaksanakan tugas harian dengan betul, cekap & mengikut piawaian Jawatankuasa Surau. Skop merangkumi operasi surau, kebersihan, pentadbiran & khidmat kepada jemaah.',
 10),
('2.0 Jadual Kerja & Shift',
 'Shift Pagi: 5:30 pagi - 1:30 petang (8 jam). Shift Petang: 2:00 petang - 10:00 malam (8 jam). 6 hari seminggu, 1 hari OFF ikut roster. Jadual shift diberi setiap bulan oleh Setiausaha. OT (program khas, cuti umum, Ramadan) perlu kelulusan Pengerusi/Setiausaha sebelum claim.',
 20),
('3.0 Tugas Shift Pagi (5:30 AM - 1:30 PM)',
 'Pembukaan (5:30 AM): tiba 10 minit awal, clock in, ambil kunci, buka pintu & lampu, hidupkan kipas. Sediakan ruang solat (sejadah lelaki 40 / perempuan 20, jarak saf 1m), tempat wuduk (tuala, sabun), sistem audio, Al-Quran & telekung bersih. Subuh: azan (jika ditugaskan), bantu Imam, iqamah, kutip & rekod sedekah. Pembersihan pagi: bilik air, tempat wuduk, ruang solat (vacuum, lap habuk, lap kipas), kawasan luar. Pentadbiran (9-11 AM): semak WhatsApp AJK, kemaskini data, laporan.',
 30),
('4.0 Tugas Shift Petang, Kebersihan, Pentadbiran & Kecemasan',
 'Sila lengkapkan butiran penuh dari dokumen WI rasmi - tampal di sini melalui panel admin (Staf > Arahan Kerja WI).',
 40);
