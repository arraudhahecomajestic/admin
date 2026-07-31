import Link from "next/link";
import MaklumBalasForm from "@/components/MaklumBalasForm";
import { NAMA_SURAU } from "@/lib/tetapan";

export const dynamic = "force-dynamic";

export default function MaklumBalasPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Maklum Balas &amp; Cadangan</h1>
        <p className="mt-1 text-sm text-slate-600">
          Ada komplen, cadangan penambahbaikan, atau pandangan untuk {NAMA_SURAU}? Kongsi dengan kami — suara anda membantu kami menambah baik surau. 🤝
        </p>
      </div>
      <MaklumBalasForm />
      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
