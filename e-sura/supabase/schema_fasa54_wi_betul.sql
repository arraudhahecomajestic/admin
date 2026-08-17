-- ============================================================
-- e-Surau · Fasa 54 — Work Instruction (WI) PENUH & BETUL
--  Menggantikan seed WI lama (Fasa 53) dengan WI penuh yang telah
--  DISELARASKAN dengan Surat Tawaran (Offer Letter) Penolong Pengurus Surau.
--
--  Pembetulan utama vs draf WI lama:
--   1) GAJI: RM2,000 (bukan RM1,700-2,500), OT RM9/jam (bukan RM10),
--      bayar 30 haribulan (bukan 25) + elaun penuh ikut offer letter.
--   2) KPI: 30% / 20% / 20% / 30% (bukan 30/25/25/20) + keputusan
--      Cemerlang/Baik/Sederhana/Lemah.
--   3) Istilah: Setiausaha / Pengerusi / AJK (bukan Siak / Siak 1 / Siak 2).
--   4) Placeholder diisi: Kod Dokumen, nama Pengerusi & Setiausaha, kontak.
--
--  Jalankan di Supabase SQL Editor. SQL sahaja - tiada perubahan kod / push.
-- ============================================================

-- Buang seed lama (4 seksyen placeholder Fasa 53). Jika anda telah
-- mengedit seksyen secara manual & mahu simpan, langkau baris ini.
delete from staf_wi;

insert into staf_wi (tajuk, kandungan, susunan, aktif) values

('1.0 Tujuan & Skop',
'Kod Dokumen: SAR-WI-PPS-01   |   Semakan 2   |   Berkuatkuasa: 1 Februari 2026
Disediakan oleh: Setiausaha Surau Ar-Raudhah Eco Majestic

TUJUAN
Work Instruction (WI) ini membimbing Penolong Pengurus Surau (PPS) melaksanakan tugas harian dengan betul, cekap dan mengikut piawaian yang ditetapkan oleh Jawatankuasa Surau.

SKOP
Panduan ini merangkumi semua tugas operasi surau, kebersihan, pengurusan pentadbiran dan khidmat kepada jemaah yang perlu dilaksanakan oleh PPS.

RUJUKAN
WI ini adalah pelengkap kepada Surat Tawaran Kerja. Jika terdapat sebarang percanggahan, terma dalam Surat Tawaran Kerja adalah muktamad dan mengatasi WI ini.',
10, true),

('2.0 Jadual Kerja & Shift',
'WAKTU BERTUGAS
- Shift Pagi: 5:30 pagi hingga 1:30 petang (8 jam)
- Shift Petang: 2:00 petang hingga 10:00 malam (8 jam)

HARI BEKERJA
- 6 hari seminggu (termasuk hujung minggu)
- 1 hari OFF mengikut jadual roster (tidak semestinya hujung minggu)
- Jadual shift bulanan diberikan oleh Setiausaha pada awal bulan
- Wajib clock in / clock out menggunakan sistem kehadiran (app / fingerprint)

LAPOR KEPADA
- Pengerusi Surau / Setiausaha Surau

OVERTIME (OT)
- Terpakai untuk: program khas (ceramah, kenduri, majlis), hari kelepasan am, bulan Ramadhan
- WAJIB dapat kelulusan Pengerusi / Setiausaha sebelum membuat OT',
20, true),

('3.0 Gaji, Elaun & Potongan (ikut Surat Tawaran)',
'A. GAJI & ELAUN BULANAN
- Elaun Bulanan (Kasar / Gaji Pokok): RM2,000.00 sebulan
- Elaun Telefon: RM50.00 sebulan (komunikasi rasmi & WhatsApp group)
- Elaun Perjalanan: RM50.00 sebulan (urusan surau & menghadiri mesyuarat)
- Elaun Kehadiran: RM5.00 sehari jika hadir tepat waktu (maksimum RM130 sebulan, 26 hari x RM5)
- Elaun Perkhidmatan: RM270.00 sebulan (selepas tempoh percubaan tamat)

Jumlah anggaran pendapatan bulanan: RM2,230 hingga RM2,500.00

B. OVERTIME (OT)
- Kadar: RM9.00 sejam (selepas 8 jam kerja)
- Perlu kelulusan Pengerusi / Setiausaha sebelum OT
- Isi borang OT (tarikh, masa, sebab); dibayar bersama gaji bulan berkenaan

C. TARIKH BAYARAN
- Gaji dibayar setiap 30 haribulan, ke akaun peribadi pekerja

D. POTONGAN
- Lewat lebih 15 minit tanpa alasan: RM10
- Ponteng / cuti tanpa kebenaran: RM50 sehari
- Rosak peralatan (jika disengajakan): ganti kos penuh

E. KWSP
- Tidak terpakai (kontrak)',
30, true),

('4.0 KPI & Penilaian Prestasi (ikut Surat Tawaran)',
'Prestasi PPS dinilai setiap 3 bulan. Semasa tempoh percubaan, penilaian dibuat pada akhir bulan ke-2 dan ke-3.

PEMBERAT KPI (4 aspek):
- A. Kebersihan & Kekemasan  =  30%
     Surau sentiasa bersih & wangi; bilik air baik; peralatan tersusun kemas.
- B. Ketepatan Masa  =  20%
     Datang kerja tepat waktu; azan & iqamah on time; selesai kerja ikut jadual.
- C. Sikap & Adab  =  20%
     Peramah dengan jemaah; ikut arahan AJK yang tidak bercanggah syarak; jaga nama baik surau.
- D. Pentadbiran & Rekod  =  30%
     Data entry dalam sistem dikemaskini (Kariah & e-Khairat); laporan prestasi kepada kariah; laporan program lengkap & jelas.

KEPUTUSAN PENILAIAN:
- Cemerlang (80% ke atas): Saguhati one-off + Sijil Penghargaan
- Baik (60% - 79%): Sijil Penghargaan
- Sederhana (40% - 59%): Amaran + latihan semula
- Lemah (bawah 40%): Penamatan kontrak

Sekiranya prestasi memuaskan, kontrak diteruskan dengan kenaikan gaji sehingga maksimum RM2,500.',
40, true),

('5.0 Tugas Shift Pagi (5:30 AM - 1:30 PM)',
'PEMBUKAAN SURAU (5:30 AM)
- Tiba 10 minit awal (5:20 AM), clock in, ambil kunci dari tempat selamat
- Buka pintu utama & belakang (pengudaraan), hidupkan lampu & kipas (aircond tunggu lepas Subuh)
- Bentang sejadah: ruang lelaki 40 helai, perempuan 20 helai; jarak saf 1 meter
- Sedia tempat wuduk: tuala (lelaki 4, perempuan 2), sabun dalam dispenser, lap lantai basah
- Hidup & test sistem audio; sedia Al-Quran, buku doa, tisu; semak telekung bersih (min 5 helai)

SOLAT SUBUH
- Azan (jika ditugaskan), bantu Imam, iqamah, pastikan saf lurus
- Selepas solat: kutip sedekah, kira, rekod (rujuk Seksyen 8.0)

PEMBERSIHAN PAGI (6:30 - 7:00 AM)
- Bilik air lelaki & perempuan (ketuk pintu perempuan dulu), tempat wuduk
- Ruang solat: vacuum, lap habuk rak/tingkap, lap kipas, bentang semula sejadah
- Kawasan luar: sapu tangga, buang sampah, semak parking

PENTADBIRAN (9:00 - 11:00 AM)
- Semak WhatsApp AJK; data entry kehadiran program; kemaskini inventori; fail & susun dokumen

ZOHOR & SERAH TUGAS
- Azan & iqamah Zohor, kemas sejadah, rekod sedekah
- Brief shift petang (masalah/program/arahan), serah kunci, tulis buku log, clock out (1:30 PM)',
50, true),

('6.0 Tugas Shift Petang (2:00 PM - 10:00 PM)',
'AMBIL ALIH (2:00 PM)
- Tiba 1:50 PM, clock in, ambil kunci & taklimat dari shift pagi, baca buku log
- Round inspection: bilik air, ruang solat, peralatan. Jika ada masalah, WhatsApp Setiausaha / AJK segera

PENTADBIRAN PETANG (2:30 - 4:00 PM)
- Update sistem & status aset; sedia bahan program malam (kerusi, sound system, banner, air ustaz); bersih pejabat surau

ASAR (4:00 - 5:00 PM)
- Sedia ruang, azan, iqamah ikut Imam, kemas & rekod sedekah

SAMBUT JEMAAH (5:00 - 6:00 PM)
- Peak hour: senyum & salam, bantu soalan jemaah, semak bilik air setiap 30 minit

MAGHRIB & ISYAK (6:00 - 8:30 PM)
- Sedia ruang, azan tepat waktu, iqamah ikut Imam, rekod sedekah; beri masa jemaah baca Quran

PEMBERSIHAN MALAM (8:30 - 9:30 PM)
- Ruang solat (angkat & lipat sejadah, vacuum, susun Al-Quran), bilik air, tempat wuduk

PENUTUPAN (9:30 - 10:00 PM)
- Round akhir (tiada jemaah tertinggal), matikan aircond/kipas/lampu (tinggal lampu kecemasan)/sound system
- Kunci pintu belakang & utama, tutup tingkap, aktifkan alarm
- Simpan kunci, tulis buku log, clock out (10:00 PM)',
60, true),

('7.0 Tugas Mingguan & Bulanan',
'MINGGUAN
- Isnin: basuh & sidai tuala; kemaskini jadual program minggu ini
- Rabu: lap tingkap (dalam & luar), buang sawang
- Jumaat: datang awal (5:00 AM), bersih extra, bentang sajadah 80-100 helai, sedia sound system khutbah, papan tanda Solat Jumaat, air sejuk; bantu atur saf; vacuum menyeluruh selepas Jumaat
- Sabtu: cuci kipas, gosok/polish lantai ruang solat

BULANAN / MUSIM
- Ramadhan: datang awal, bantu susun juadah iftar, sedia ruang tarawih; shift mungkin dilanjut (OT dibayar)
- Syawal: bantu hiasan & pembersihan extra sebelum Raya; cuti ikut roster (tetap ada pekerja bertugas)',
70, true),

('8.0 Pengurusan Sedekah & Wang',
'Pengambilan sedekah dari kotak derma dipantau oleh Bendahari & Penolong Bendahari.

SELEPAS SETIAP SOLAT WAJIB
1. Tunggu semua jemaah keluar
2. Buka kotak derma dengan kunci (simpan dalam laci meja pejabat)
3. Keluarkan semua duit (nota & syiling)
4. Kira dengan teliti (asing nota & syiling ikut nilai)
5. Tulis dalam Buku Rekod Sedekah: Tarikh, Waktu Solat, Jumlah, Dikira oleh (nama & tandatangan)
6. Masukkan dalam amplop khas; tulis Tarikh + Waktu + Jumlah
7. Simpan amplop dalam peti besi kecil; kunci semula

PENTING
- JANGAN simpan wang dalam poket sendiri
- JANGAN pinjam wang sedekah walaupun nak pulangkan semula
- Jika jumpa wang RM100 ke atas, REPORT TERUS kepada Bendahari / Penolong Bendahari untuk rekod khas',
80, true),

('9.0 Cara Guna Peralatan Surau',
'SOUND SYSTEM
- Hidup: suis plug ON, tekan POWER (LED hijau), volume ke tahap 7, test mic
- Mati: volume ke 0, POWER off, suis plug off
- Masalah: tiada bunyi (check cable mic); berdengung (jauhkan mic dari speaker); pecah (rendahkan volume)

AIRCOND
- ON pada remote, suhu 24C, mode COOL, fan AUTO
- Hidup 30 minit sebelum waktu solat; matikan selepas jemaah keluar / sebelum tutup surau

VACUUM CLEANER
- Keluarkan dari stor, unroll cable, plug, ON; vacuum dari belakang ke depan (gerakan perlahan)
- Angkat sejadah dulu; bila penuh buang habuk; roll cable & simpan semula

MESIN BASUH (tuala)
- Masukkan tuala, detergen 2 sudu, tutup pintu, mode NORMAL WASH, START; tunggu 45 minit, keluar & sidai',
90, true),

('10.0 Komunikasi & Pelaporan',
'WHATSAPP GROUP
- AJK Surau SAR: group rasmi (semua AJK)
- Ops Surau: group operasi harian (pekerja + Setiausaha / AJK bertugas)

CARA GUNA
- Mula shift: report bila sampai (contoh: Assalamualaikum, shift pagi dah start)
- Masalah: report segera (contoh: paip tandas lelaki bocor)
- Sebelum balik: report (contoh: shift petang selesai, surau dah tutup, semua OK)
- JANGAN spam group, forward gambar tidak berkaitan, atau group call tanpa perlu

LAPORAN HARIAN
- Hantar dalam WhatsApp group setiap hari. Format: Tarikh | Shift | Nama | Tugas Selesai | Rekod Sedekah (RM) | Masalah/Isu | Catatan Tambahan | Serah Tugas',
100, true),

('11.0 Adab & Etika Kerja',
'DENGAN JEMAAH
- BUAT: senyum & salam, jawab dengan sopan & sabar, bantu orang tua/OKU, hormat semua tanpa mengira bangsa/status
- JANGAN: bercakap kasar, tidur waktu bertugas, main phone berlebihan, bergurau dengan jemaah perempuan

DENGAN AJK & IMAM
- BUAT: dengar & ikut arahan (yang tidak bercanggah syarak), tanya jika tak faham, hormat, report masalah cepat
- JANGAN: buat keputusan besar sendiri, bergaduh/berdebat, mengumpat, ponteng tanpa sebab

PENJAGAAN DIRI
- BUAT: datang bersih & kemas (baju kurung/kemeja), jaga kebersihan diri, makan cukup
- JANGAN: datang dalam keadaan mabuk/minum arak (haram & dipecat serta-merta), pakai baju lusuh, datang lewat/ponteng tanpa maklum',
110, true),

('12.0 Cuti & Kebenaran',
'CUTI TAHUNAN
- 8 hari setahun (boleh mohon selepas tempoh percubaan)
- Mohon 1 minggu awal (isi borang cuti), hantar kepada Setiausaha, tunggu kelulusan
- Tidak boleh lebih 3 hari berturut-turut (kecuali kecemasan)

CUTI SAKIT
- 8 hari setahun (dengan MC dari klinik panel)
- WhatsApp Setiausaha sebelum 6:00 AM, dapatkan MC, hantar gambar MC, serah MC asal bila sihat

CUTI KECEMASAN
- Call / WhatsApp Setiausaha segera, terangkan situasi, dapatkan kelulusan, kemukakan bukti (sijil kematian, laporan polis)

PONTENG TANPA KEBENARAN
- Dikenakan potongan RM50 sehari
- Amaran berperingkat; ponteng 4 kali = penamatan kontrak',
120, true),

('13.0 Pengurusan Kecemasan',
'KEBAKARAN
1. Tekan fire alarm  2. Call Bomba 994  3. WhatsApp group: KECEMASAN - KEBAKARAN  4. Keluarkan jemaah  5. Guna fire extinguisher jika api kecil

BANJIR / PAIP PECAH
1. Tutup injap air utama  2. WhatsApp group: KECEMASAN - PAIP PECAH  3. Call tukang paip  4. Lap air

KECURIAN / ORANG MENCURIGAKAN
1. Jangan lawan  2. Pastikan jemaah selamat  3. Call Polis 999  4. WhatsApp group: KECEMASAN - ADA INSIDEN

JEMAAH PENGSAN / SAKIT
1. Call Ambulans 999  2. Baring posisi selesa  3. Jangan beri makan/minum jika tak sedar  4. Tunggu ambulans  5. Maklum WhatsApp group',
130, true),

('14.0 Kontak Penting',
'KONTAK DALAMAN
- Pengerusi: Mohd Thalji Bin Ahmad Bakery  (nombor: untuk diisi)
- Setiausaha: Mohamad Syahmi Bin Seliman  012-7717543
- Bendahari: (nama & nombor untuk diisi)
- Imam: (nama & nombor untuk diisi)

KHIDMAT KECEMASAN
- Bomba: 994
- Polis: 999
- Ambulans: 999

KONTRAKTOR & PEMBEKAL (untuk diisi)
- Tukang Paip, Elektrik, Aircond Service, Pembekal Gas',
140, true),

('15.0 Checklist Harian',
'SHIFT PAGI
[ ] Clock in (5:30 AM)
[ ] Buka pintu & lampu
[ ] Bentang sejadah
[ ] Sedia tempat wuduk
[ ] Azan Subuh (jika bertugas)
[ ] Bersih bilik air (pagi)
[ ] Vacuum ruang solat
[ ] Data entry & pentadbiran
[ ] Azan Zohor
[ ] Serah tugas kepada shift petang
[ ] Clock out (1:30 PM)

SHIFT PETANG
[ ] Clock in (2:00 PM)
[ ] Terima taklimat shift pagi
[ ] Round inspection
[ ] Kerja pentadbiran
[ ] Azan Asar / Maghrib / Isyak
[ ] Bersih bilik air (malam)
[ ] Vacuum & kemas surau
[ ] Round akhir
[ ] Tutup & kunci semua
[ ] Clock out (10:00 PM)',
150, true),

('16.0 Penutup',
'WI ini adalah panduan lengkap untuk membantu anda melaksanakan tugas dengan baik. Jika ada sebarang kemusykilan, sila rujuk:
1. Setiausaha Surau (hal kerja harian)
2. Pengerusi Surau (hal besar / keputusan penting)
3. Pekerja senior (jika shift overlap)

INGAT:
- Kerja dengan ikhlas kerana Allah
- Surau adalah rumah Allah - jaga dengan sebaik-baiknya
- Jemaah adalah tetamu Allah - layani dengan baik
- Gaji adalah rezeki dari Allah - syukuri & jangan khianati

Selamat bertugas & semoga Allah permudahkan urusan anda.

Disediakan oleh: Setiausaha Surau Ar-Raudhah
Disahkan oleh: Pengerusi Surau Ar-Raudhah Eco Majestic',
160, true);

-- Selesai. Portal Staf (/kerani) & panel admin (/admin/staf/wi) akan
-- terus papar seksyen ini kerana kedua-duanya baca dari staf_wi.
