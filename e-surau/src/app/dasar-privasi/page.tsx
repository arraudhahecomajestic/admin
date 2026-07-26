import Link from "next/link";
import { NAMA_SURAU, ALAMAT_SURAU, EMEL_SURAU } from "@/lib/tetapan";

export const metadata = { title: "Dasar Privasi · " + NAMA_SURAU };

export default function DasarPrivasiPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-xl bg-white p-8 shadow-sm text-sm leading-relaxed text-slate-700">
      <div className="border-b pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Dasar Privasi</h1>
        <p className="mt-1 text-slate-500">{NAMA_SURAU} · Kemas kini terakhir: Julai 2026</p>
      </div>

      <p>
        Dasar Privasi ini menerangkan bagaimana {NAMA_SURAU} (“Surau”, “kami”) mengumpul, menggunakan,
        menyimpan dan melindungi data peribadi anda melalui portal ini, selaras dengan
        <b> Akta Perlindungan Data Peribadi 2010 (PDPA)</b> dan pindaannya (Akta Pindaan 2024).
      </p>

      <H>1. Data yang kami kumpul</H>
      <p>Bergantung pada perkhidmatan yang anda gunakan, kami mengumpul:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Maklumat diri: nama, gelaran, No. Kad Pengenalan, alamat, no. telefon, e-mel.</li>
        <li>Salinan Kad Pengenalan (depan & belakang) dan <b>swafoto (selfie)</b>.</li>
        <li>e-Tandatangan.</li>
        <li>Maklumat tanggungan/isi rumah (untuk keahlian & khairat).</li>
        <li>Butiran bank & pembayaran (untuk khairat, sewaan, sumbangan & tuntutan pembekal).</li>
        <li>Bagi pembekal: dokumen SSM/profil syarikat, katalog produk.</li>
      </ul>
      <p className="rounded-lg bg-amber-50 p-3 text-amber-800">
        <b>Data sensitif:</b> Swafoto (biometrik) dan maklumat kewangan dikelaskan sebagai <b>data peribadi sensitif</b>
        di bawah PDPA. Ia dikumpul berdasarkan <b>persetujuan nyata</b> anda dan dilindungi dengan langkah keselamatan tambahan.
      </p>

      <H>2. Tujuan pengumpulan</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Pendaftaran & pengurusan keahlian ahli kariah.</li>
        <li>Skim Khairat Kematian, program/aktiviti, sewaan ruang, dan pengurusan pembekal.</li>
        <li>Pemprosesan pembayaran, resit, baucer & rekod kewangan.</li>
        <li>Pengesahan identiti dan komunikasi rasmi surau.</li>
      </ul>

      <H>3. Perkongsian data</H>
      <p>
        Data anda <b>tidak dijual atau dikongsi kepada mana-mana pihak luar untuk tujuan komersial</b>.
        Data hanya dikongsi dengan:
      </p>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>Jabatan Agama Islam Selangor (JAIS)</b> — bagi tujuan pendaftaran & pengurusan keahlian kariah rasmi.</li>
        <li><b>Pemproses pembayaran (CHIP)</b> — semata-mata untuk memproses transaksi yang anda mulakan sendiri.</li>
      </ul>

      <H>4. Penyimpanan & tempoh</H>
      <p>
        Data disimpan dengan selamat dalam pangkalan data terlindung. Kami menyimpan data anda
        <b> selagi Surau beroperasi/wujud</b> dan selagi perlu untuk tujuan di atas serta mematuhi keperluan berkanun.
        Anda boleh memohon pemadaman tertakluk kepada obligasi undang-undang.
      </p>

      <H>5. Keselamatan data</H>
      <p>
        Kami mengambil langkah teknikal & organisasi yang munasabah untuk melindungi data anda — termasuk
        kawalan akses ikut peranan, storan dokumen sulit secara peribadi, dan sambungan disulitkan (HTTPS).
        Lihat halaman <Link href="/keselamatan" className="font-medium text-surau hover:underline">Keselamatan</Link> untuk butiran.
      </p>

      <H>6. Hak anda</H>
      <p>Di bawah PDPA, anda berhak untuk:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li>Mengakses & membetulkan data peribadi anda (melalui Portal Saya atau dengan menghubungi kami).</li>
        <li>Menarik balik persetujuan (tertakluk kesan terhadap perkhidmatan).</li>
        <li>Memohon pemindahan data (mudah alih data), jika boleh dilaksanakan secara teknikal.</li>
      </ul>

      <H>7. Pemberitahuan pelanggaran data</H>
      <p>
        Sekiranya berlaku pelanggaran data yang berisiko menyebabkan mudarat ketara, kami akan memaklumkan
        Pesuruhjaya Perlindungan Data Peribadi dalam tempoh <b>72 jam</b> dan subjek data yang terjejas mengikut
        keperluan PDPA.
      </p>

      <H>8. Pegawai Perhubungan Data</H>
      <p>
        Sebarang pertanyaan, permohonan akses/pembetulan, atau aduan berkaitan data peribadi:
        <br /><b>Syahmi Seliman</b> — Setiausaha, {NAMA_SURAU}
        <br />E-mel: <a href={`mailto:${EMEL_SURAU}`} className="text-surau hover:underline">{EMEL_SURAU}</a>
        <br />{ALAMAT_SURAU}
      </p>

      <p className="border-t pt-3 text-xs text-slate-500">
        Dengan menggunakan portal ini dan menandakan kotak persetujuan, anda mengesahkan telah membaca &
        bersetuju dengan Dasar Privasi ini.
      </p>
      <p className="text-center"><Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link></p>
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-slate-900">{children}</h2>;
}
