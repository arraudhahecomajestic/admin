import Link from "next/link";
import { NAMA_SURAU } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default function SelamatDatangPage() {
  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
          ✓
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Email Anda Telah Disahkan</h1>
        <p className="mt-3 text-slate-600">
          Selamat datang ke portal <b>{NAMA_SURAU}</b>. Akaun anda kini aktif.
          Sila log masuk untuk kemas kini & sahkan maklumat kariah anda.
        </p>

        <div className="mt-6 rounded-xl bg-surau/5 p-4 text-left text-sm text-slate-600">
          <div className="font-semibold text-slate-800">Langkah seterusnya:</div>
          <ol className="mt-2 list-inside list-decimal space-y-1">
            <li>Log masuk guna emel & kata laluan anda.</li>
            <li>Semak & lengkapkan maklumat diri (alamat, telefon, gambar IC).</li>
            <li>Kemas kini senarai tanggungan / isi rumah.</li>
          </ol>
        </div>

        <Link
          href="/masuk"
          className="mt-6 inline-block rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark"
        >
          Log Masuk Sekarang →
        </Link>

        <p className="mt-4 text-xs text-slate-400">
          Semoga Allah memberkati usaha kita bersama memakmurkan surau.
        </p>
      </div>
    </div>
  );
}
