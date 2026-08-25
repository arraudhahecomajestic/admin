import Link from "next/link";
import { NAMA_SURAU } from "@/lib/tetapan";
import PenajaSertaiForm from "@/components/PenajaSertaiForm";
import PakejFaedah from "@/components/PakejFaedah";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jadi Penaja — Rakan Surau",
  description: "Sertai sebagai penaja / Rakan Surau Ar Raudhah. Sokong operasi surau, logo perniagaan anda dipaparkan di portal.",
};

export default function PenajaSertaiPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <section className="rounded-2xl bg-gradient-to-br from-surau to-surau-dark p-6 text-white shadow-lg">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Jadi Penaja Surau</h1>
        <p className="mt-2 text-sm text-amber-50 sm:text-base">
          Sokong operasi &amp; dakwah {NAMA_SURAU}. Logo &amp; perniagaan anda akan dipaparkan di portal kariah sepanjang tempoh tajaan — insya-Allah menjadi sedekah jariah &amp; pendedahan kepada komuniti.
        </p>
      </section>

      <PakejFaedah />

      <PenajaSertaiForm />

      <div className="text-center">
        <Link href="/rakan" className="text-sm text-surau hover:underline">&larr; Lihat direktori Rakan Surau</Link>
      </div>
    </div>
  );
}
