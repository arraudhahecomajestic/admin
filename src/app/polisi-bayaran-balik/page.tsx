import Link from "next/link";
import { NAMA_SURAU, EMEL_SURAU } from "@/lib/tetapan";

export const metadata = { title: "Polisi Bayaran Balik · " + NAMA_SURAU };

export default function PolisiBayaranBalikPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-xl bg-white p-8 shadow-sm text-sm leading-relaxed text-slate-700">
      <div className="border-b pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Polisi Bayaran Balik & Pembatalan</h1>
        <p className="mt-1 text-slate-500">{NAMA_SURAU} · Sewaan Ruang · Kemas kini terakhir: Julai 2026</p>
      </div>

      <p>
        Polisi ini terpakai untuk tempahan & pembayaran sewaan ruang {NAMA_SURAU} yang dibuat melalui portal ini.
      </p>

      <H>1. Deposit Keselamatan</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Deposit dipulangkan <b>100%</b> selepas pemeriksaan mendapati tiada kerosakan, kehilangan atau kekotoran.</li>
        <li>Deposit akan ditolak sebahagian atau sepenuhnya jika berlaku kerosakan/kehilangan harta surau atau ruang tidak dibersihkan seperti asal.</li>
      </ul>

      <H>2. Pembatalan oleh Penyewa</H>
      <p>Bayaran sewaan (tidak termasuk deposit) dikembalikan seperti berikut:</p>
      <ul className="list-disc space-y-1 pl-6">
        <li><b>7 hari atau lebih</b> sebelum tarikh acara — refund <b>penuh (100%)</b>.</li>
        <li><b>3 hingga 6 hari</b> sebelum acara — refund <b>50%</b>.</li>
        <li><b>Kurang 3 hari</b> sebelum acara atau tidak hadir — sewa <b>hangus (tiada refund)</b>.</li>
      </ul>
      <p className="text-slate-600">Dalam semua kes pembatalan oleh penyewa, <b>deposit tetap dipulangkan sepenuhnya</b> (tertakluk tiada tuntutan kerosakan).</p>

      <H>3. Pembatalan / Penolakan oleh Surau</H>
      <p>
        Jika permohonan sewaan <b>tidak diluluskan</b> oleh AJK, atau dibatalkan atas sebab pihak Surau,
        bayaran dikembalikan <b>100% (sewa + deposit)</b>.
      </p>

      <H>4. Cara & Tempoh Bayaran Balik</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Pemulangan dibuat melalui <b>pindahan bank</b> ke akaun penyewa.</li>
        <li>Tempoh proses: <b>7–14 hari bekerja</b> selepas pengesahan pembatalan / pemeriksaan.</li>
        <li>Bayaran atas talian diproses oleh gerbang CHIP; bayaran balik dilakukan secara manual oleh Bendahari Surau.</li>
      </ul>

      <H>5. Cara Memohon Bayaran Balik</H>
      <p>
        Hubungi pejabat surau dengan No. Rujukan tempahan anda:
        {" "}<a href={`mailto:${EMEL_SURAU}`} className="text-surau hover:underline">{EMEL_SURAU}</a>.
        Sila sertakan nama, No. Rujukan sewaan, dan butiran akaun bank untuk pemulangan.
      </p>

      <p className="border-t pt-3 text-xs text-slate-500">
        Surau berhak meminda polisi ini dari semasa ke semasa. Rujuk juga{" "}
        <Link href="/terma" className="text-surau hover:underline">Terma Penggunaan</Link>.
      </p>
      <p className="text-center"><Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link></p>
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-slate-900">{children}</h2>;
}
