import Link from "next/link";
import VendorForm from "@/components/VendorForm";
import { NAMA_SURAU } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default function VendorPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pendaftaran Vendor / Pembekal</h1>
        <p className="mt-1 text-sm text-slate-600">
          {NAMA_SURAU} mempelawa individu & syarikat mendaftar sebagai vendor rasmi surau
          (makanan, elektrikal, penyaman udara, pencucian, kawalan perosak, bahan mentah, dll).
          Permohonan akan disemak oleh AJK.
        </p>
        <Link href="/vendor/direktori" className="mt-3 inline-block rounded-lg border border-surau/40 px-4 py-2 text-sm font-semibold text-surau hover:bg-surau/10">
          Lihat Direktori Vendor Berdaftar →
        </Link>
      </div>

      <VendorForm />

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
