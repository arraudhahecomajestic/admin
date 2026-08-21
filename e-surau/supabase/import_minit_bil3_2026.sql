-- ============================================================
-- e-Surau · Import Minit Mesyuarat Khas Bil. 3/2026 (versi Pengerusi)
--  Masukkan minit ini terus ke dalam sistem sebagai contoh siap.
--  SYARAT: run schema_fasa61_minit_online.sql dahulu (kolum kehadiran_online).
--  Jalankan di Supabase SQL Editor. Boleh edit isi kemudian dalam portal.
-- ============================================================

insert into mesyuarat
  (tajuk, jenis, bil, tarikh, masa, tempat, pengerusi, pencatat, kehadiran, kehadiran_online, tidak_hadir, minit, status)
values (
  'Mesyuarat Khas',
  'Khas',
  '3/2026',
  '2026-08-05',
  '9.00 malam',
  'Dewan Solat Utama, Surau Ar-Raudhah Eco Majestic',
  'Mohd Thalji Bin Ahmad Bakery',
  'Mohamad Syahmi bin Seliman',
  'Mohd Thalji Bin Ahmad Bakery (Pengerusi)
Mohamad Fareez Bin Laili (Bilal 2)
Syed Wahiyuddin Bin Syed Mustaman (Siak 2)
Adnan Bin Abdullah (AJK 1)',
  'Mohd Syamil Bin Mokhtar (Imam 1)
Noorhaffizul Bin Nor''azmy (Imam 2)
Mohd Azrun Bin Abd.Rahman (Siak 1)
Mohamad Syahmi bin Seliman (Setiausaha)
Muhammad Al Amin Bin Abdullah (Bendahari)
Mohd Farid Bin Ahmed (Penolong Bendahari)
Ummi Kalsom Binti Rahmat (Pengurus Jenazah Muslimat)
Muhammad Nabhan Bin Kamaludin (Wakil Pemuda)',
  'Mohammed Salihin Bin Ali (Timbalan Pengerusi)
Syarwani Bin Mat Daud (Bilal 1)
Nurul Fatin Amira Binti Sham Ali (Wakil Muslimat)
Nurul Hidawati Binti Harun (AJK 2)
Mohamad Dzul Hilmi Bin Mohd Khalid (AJK 3)
Shahrudin Bin Tembol (Pemeriksa Kira-kira 1)
Ridzuan Bin Ahmad Zaki (Pemeriksa Kira-kira 2)',
  '1. Ucapan Pengerusi
1.1 Tuan Pengerusi mengucapkan salam dan merakamkan ucapan terima kasih kepada ahli mesyuarat yang hadir. Ini merupakan Mesyuarat Khas yang kedua untuk membincangkan berkaitan penganjuran Kem Memanah Recurve & Robotik dan pembangunan portal Sistem Pengurusan Surau Digital.
1.2 Pengerusi mengharapkan semua ahli jawatankuasa mengambil bahagian dalam perbincangan dan memberikan idea serta cadangan yang bernas dan kreatif.
Tindakan: Untuk makluman semua ahli jawatankuasa

2. Program Kem Memanah Recurve & Robotik 2026
2.1 Encik Muhammad Nabhan Bin Kamaludin merupakan wakil Pemuda merangkap Pengarah Program Kem Memanah Recurve & Robotik 2026 membentangkan kertas cadangan program tersebut (seperti dilampirkan).
2.2 Inti sari kertas cadangan tersebut adalah seperti berikut:
2.2.1 Tarikh: 29-30 Ogos 2026 (Sabtu-Ahad)
2.2.2 Masa: 8.00 pagi - 5.00 petang
2.2.3 Tempat: Surau Ar-Raudhah Eco Majestic
2.2.4 Sasaran: murid sekolah 7 tahun ke atas
2.2.5 Jumlah peserta: 40 orang
2.2.6 Fasilitator: 4 orang
2.2.7 Yuran penyertaan: RM 30.00
2.3 Program ini menggabungkan sukan sunnah (memanah recurve) & aktiviti STEM (robotik) secara hands-on.
2.4 Rakan teknikal program ini ialah Kelab Sukan Sunnah Putrajaya / I-Youth Archery (memanah) & Kelab Rekacipta Putrajaya (robotik).
Tindakan: Untuk makluman semua ahli jawatankuasa
2.5 Ahli mesyuarat dimaklumkan bahawa anggaran keseluruhan peruntukan program ini sebanyak RM3,000. Perinciannya adalah seperti jadual berikut:
| Kategori | Jumlah (RM) |
| Makanan | 1,200.00 |
| Peralatan Memanah | 400.00 |
| Peralatan Robotik | 400.00 |
| Fasilitator | 800.00 |
| Cetak Sijil | 80.00 |
| Cetak Poster | 120.00 |
| Jumlah | 3,000.00 |
2.6 Manakala sumber kewangan adalah seperti jadual berikut:
| Sumber | Jumlah (RM) |
| Yuran Peserta (RM30 x 40 peserta) | 1,200.00 |
| Dana Surau | 1,800.00 |
| Jumlah | 3,000.00 |
2.7 Sehubungan dengan itu, Encik Muhammad Nabhan Bin Kamaludin selaku Pengarah Program memohon kertas cadangan ini dan peruntukan kewangan daripada surau sebanyak RM1,800 diluluskan. Keputusan sebulat suara meluluskan permohonan ini.
Tindakan: Encik Muhammad Nabhan Bin Kamaludin dan Bendahari

3. Portal Sistem Pengurusan Surau Digital (e-Surau)
3.1 Encik Mohamad Syahmi bin Seliman selaku setiausaha membentangkan cadangan penggunaan portal Sistem Pengurusan Surau Digital yang dikenali sebagai e-Surau.
3.2 Portal ini dibangunkan oleh beliau secara berperingkat. Portal ini mengandungi sembilan (9) modul iaitu:
3.2.1 Keahlian
3.2.2 Khairat Kematian
3.2.3 Kewangan
3.2.4 Ibadah & Program
3.2.5 Sewaan Fasiliti
3.2.6 Portal Staf
3.2.7 Sistem Gaji
3.2.8 Pembayaran CHIP
3.2.9 Penajaan & Kandungan
3.3 Seterusnya beliau menghuraikan fungsi setiap modul tersebut.
3.4 Ahli mesyuarat dimaklumkan bahawa sehingga kini terdapat 600 orang ahli berdaftar.
3.5 Sistem ini dibangunkan bagi merealisasikan penggantian kerja-kerja manual dengan perekodan dokumen secara automatik melalui sistem digital dan boleh diakses melalui telefon pintar, komputer, tablet dan peranti yang lain di mana-mana sahaja.
3.6 Berkaitan persoalan keselamatan data, beliau menjelaskan bahawa keselamatan data terjamin kerana kawalan capaian ikut peranan, kawalan data peringkat baris (RLS), dokumen sulit dengan pautan sementara dan cap air, selaras dengan Akta Perlindungan Data Peribadi (PDPA) 2010.
3.7 Ahli mesyuarat juga dimaklumkan bahawa sistem e-surau ini memerlukan dana kos operasi tahunan (hosting, pangkalan data, domain & AI). Kos teras dianggarkan berjumlah RM2,500 setahun (atau RM210 sebulan).
3.8 Bagi memastikan kemampanan tanpa membebankan tabung surau, Setiausaha mencadangkan pengwujudan modul penajaan, di mana kos operasi bulanan ditanggung oleh penaja tanpa melibatkan dana surau sedia ada. Sekiranya tiada penaja, dana surau perlu digunakan bagi menanggung kos operasi bulanan sistem e-surau.
3.9 Bagaimanapun beliau berkeyakinan bahawa pencarian penaja tidak terlalu sukar dan memaklumkan bahawa setakat ini ada dua buah syarikat telah menunjukkan minat membuat penajaan.
3.10 Model penajaan ini melibatkan pakej berperingkat iaitu:
3.10.1 Gangsa RM500/bulan
3.10.2 Perak RM800/bulan
3.10.3 Emas RM1,500/bulan
3.10.4 Direktori Rakan Surau RM250/tahun (RM25/bulan)
3.11 Unjuran contoh: 1 Emas + 1 Perak + 2 Gangsa + 4 Direktori = RM4,100 bulan. Terdapat lebihan sebanyak RM1,600 selepas ditolak kos teras untuk naik taraf & perkara luar jangka.
3.12 Seterusnya beliau memohon ahli mesyuarat meluluskan perkara-perkara berikut:
3.12.1 Meluluskan konsep penajaan sebagai sumber dana kos operasi e-Surau;
3.12.2 Meluluskan struktur pakej & harga (Emas/Perak/Gangsa + Direktori Rakan Surau);
3.12.3 Memberi mandat kepada Setiausaha mencari, berunding & mengurus penaja;
3.12.4 Meluluskan pembukaan paparan logo penaja di laman utama (kini disorok);
3.12.5 Bersetuju dana penajaan diurus telus dalam modul Kewangan;
3.12.6 Meluluskan format akad/perjanjian penajaan ringkas;
3.12.7 Meluluskan penggunaan payment gateway CHIP-ASIA sebagai kaedah bayaran.
3.13 Setelah dibincangkan secara terperinci, seramai 6 orang bersetuju, 4 orang bersetuju bersyarat, manakala 7 orang tidak hadir. Bagaimanapun setelah diberikan penerangan selepas itu, ada pertambahan 4 orang bersetuju, 2 orang bersetuju bersyarat, dan 3 orang tidak mengundi. Rumusannya majoriti memberikan persetujuan menggunakan portal Sistem Pengurusan Surau Digital (e-Surau) serta perkara-perkara yang terkandung dalam perkara 3.12.
Tindakan: Semua ahli jawatankuasa
3.14 Langkah seterusnya, Setiausaha diminta menyiapkan portal tersebut, sediakan pakej media & perjanjian penajaan ringkas, serta mula mendekati para perniaga & syarikat tempatan untuk mendapatkan penajaan.

4. Ucapan Penangguhan
4.1 Pengerusi mengucapkan terima kasih kepada ahli mesyuarat kerana memberikan kerjasama yang baik serta bersikap aktif dalam memberikan maklumbalas yang baik.
4.2 Mesyuarat ditangguhkan pada pukul 11.15 malam.',
  'selesai'
);
