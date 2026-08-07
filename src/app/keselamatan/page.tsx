import Link from "next/link";
import { NAMA_SURAU, EMEL_SURAU } from "@/lib/tetapan";

export const metadata = { title: "Keselamatan · " + NAMA_SURAU };

export default function KeselamatanPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-xl bg-white p-8 shadow-sm text-sm leading-relaxed text-slate-700">
      <div className="border-b pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Keselamatan Data</h1>
        <p className="mt-1 text-slate-500">{NAMA_SURAU} · Kemas kini terakhir: Julai 2026</p>
      </div>

      <p>
        Kami mengambil serius keselamatan data peribadi anda. Berikut ialah langkah-langkah yang kami laksanakan.
      </p>

      <H>1. Penyimpanan & sambungan</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Data disimpan dalam pangkalan data terlindung dengan <b>kawalan capaian peringkat baris (RLS)</b>.</li>
        <li>Semua sambungan ke portal disulitkan menggunakan <b>HTTPS</b>.</li>
        <li>Kata laluan disimpan dalam bentuk <b>tercincang (hashed)</b> — tidak boleh dilihat oleh sesiapa.</li>
      </ul>

      <H>2. Dokumen sulit</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Salinan Kad Pengenalan, swafoto, slip bayaran & dokumen sokongan disimpan dalam <b>storan peribadi (private)</b> — tidak boleh diakses secara terbuka.</li>
        <li>Akses hanya melalui <b>pautan bertandatangan sementara</b> yang tamat tempoh secara automatik.</li>
        <li>Salinan IC & swafoto dicap air <b>“Untuk Kegunaan {NAMA_SURAU} Sahaja”</b> bagi mengelak penyalahgunaan.</li>
      </ul>

      <H>3. Kawalan capaian ikut peranan</H>
      <p>
        Hanya kakitangan yang diberi kuasa boleh mengakses data mengikut peranan masing-masing
        (Admin, Setiausaha/Pengerusi, AJK, Bendahari, Imam). Ahli & pembekal hanya nampak data mereka sendiri.
      </p>

      <H>4. Pembayaran</H>
      <p>
        Transaksi atas talian diproses oleh gerbang pembayaran <b>CHIP</b> yang mematuhi standard keselamatan industri.
        Surau tidak menyimpan maklumat penuh kad kredit/debit anda.
      </p>

      <H>5. Pemberitahuan pelanggaran</H>
      <p>
        Sekiranya berlaku pelanggaran data yang berisiko menyebabkan mudarat ketara, kami akan bertindak segera dan
        memaklumkan pihak berkuasa (Pesuruhjaya PDPA) dalam tempoh <b>72 jam</b> serta pihak terjejas mengikut keperluan undang-undang.
      </p>

      <H>6. Tanggungjawab anda</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Rahsiakan kata laluan anda & jangan kongsi dengan sesiapa.</li>
        <li>Log keluar selepas menggunakan peranti berkongsi.</li>
        <li>Laporkan sebarang aktiviti mencurigakan kepada kami dengan segera.</li>
      </ul>

      <p className="border-t pt-3">
        Laporan isu keselamatan: <a href={`mailto:${EMEL_SURAU}`} className="text-surau hover:underline">{EMEL_SURAU}</a> ·
        {" "}Rujuk <Link href="/dasar-privasi" className="text-surau hover:underline">Dasar Privasi</Link> &
        {" "}<Link href="/terma" className="text-surau hover:underline">Terma</Link>.
      </p>
      <p className="text-center"><Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link></p>
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-slate-900">{children}</h2>;
}
