import Link from "next/link";
import { NAMA_SURAU, EMEL_SURAU } from "@/lib/tetapan";

export const metadata = { title: "Terma & Penafian · " + NAMA_SURAU };

export default function TermaPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-4 rounded-xl bg-white p-8 shadow-sm text-sm leading-relaxed text-slate-700">
      <div className="border-b pb-3">
        <h1 className="text-2xl font-bold text-slate-900">Terma Penggunaan & Penafian</h1>
        <p className="mt-1 text-slate-500">{NAMA_SURAU} · Kemas kini terakhir: Julai 2026</p>
      </div>

      <p>
        Dengan menggunakan portal {NAMA_SURAU}, anda bersetuju dengan terma berikut. Sila baca dengan teliti.
      </p>

      <H>1. Penggunaan portal</H>
      <p>
        Portal ini disediakan untuk ahli kariah, bakal ahli, pembekal (vendor/imam/bilal/supplier) dan
        orang ramai yang berurusan dengan Surau. Anda bertanggungjawab memastikan maklumat yang diberikan
        adalah <b>benar, tepat & terkini</b>. Maklumat palsu boleh menyebabkan permohonan/akaun ditolak atau digantung.
      </p>

      <H>2. Akaun & kata laluan</H>
      <p>
        Anda bertanggungjawab menjaga kerahsiaan kata laluan akaun anda dan semua aktiviti di bawah akaun tersebut.
        Maklumkan kepada kami segera jika akaun anda disalahguna.
      </p>

      <H>3. Pembayaran</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Pembayaran atas talian diproses oleh penyedia gerbang pembayaran pihak ketiga (<b>CHIP</b>). Surau tidak menyimpan maklumat penuh kad anda.</li>
        <li>Surau tidak bertanggungjawab atas gangguan, kelewatan atau ralat pada gerbang pembayaran di luar kawalan kami.</li>
        <li>Resit yang dijana sistem adalah bukti pembayaran yang sah.</li>
        <li>Bayaran kepada pembekal/tuntutan dibuat secara manual oleh Bendahari selepas kelulusan; slip bayaran disediakan sebagai bukti.</li>
      </ul>

      <H>4. Khairat, sewaan, program & tuntutan</H>
      <ul className="list-disc space-y-1 pl-6">
        <li>Skim Khairat Kematian tertakluk kepada terma & manual khairat surau (yuran & pampasan seperti ditetapkan).</li>
        <li>Permohonan keahlian, sewaan ruang, dan tuntutan bayaran tertakluk kepada <b>semakan & kelulusan AJK</b>.</li>
        <li>Surau berhak menerima atau menolak sebarang permohonan mengikut budi bicara jawatankuasa.</li>
      </ul>

      <H>5. Penafian liabiliti</H>
      <p>
        Portal disediakan “sebagaimana adanya” (as is). Walaupun kami berusaha memastikan ketepatan &
        ketersediaan, Surau tidak menjamin perkhidmatan bebas gangguan atau ralat, dan tidak bertanggungjawab
        atas sebarang kerugian tidak langsung akibat penggunaan portal, kecuali seperti dikehendaki undang-undang.
      </p>

      <H>6. Penggantungan akaun</H>
      <p>
        Surau berhak menggantung atau menamatkan akaun yang menyalahi terma, memberi maklumat palsu, atau
        menyalahgunakan perkhidmatan.
      </p>

      <H>7. Perubahan terma</H>
      <p>
        Terma ini boleh dikemas kini dari semasa ke semasa. Penggunaan berterusan selepas perubahan bermakna
        anda menerima terma yang dikemas kini.
      </p>

      <H>8. Hubungi kami</H>
      <p>
        Sebarang pertanyaan: <a href={`mailto:${EMEL_SURAU}`} className="text-surau hover:underline">{EMEL_SURAU}</a> ·
        {" "}Rujuk juga <Link href="/dasar-privasi" className="text-surau hover:underline">Dasar Privasi</Link> &
        {" "}<Link href="/keselamatan" className="text-surau hover:underline">Keselamatan</Link>.
      </p>
      <p className="text-center"><Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link></p>
    </article>
  );
}

function H({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-2 text-base font-bold text-slate-900">{children}</h2>;
}
