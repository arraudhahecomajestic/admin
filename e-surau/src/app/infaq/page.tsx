import Link from "next/link";
import { redirect } from "next/navigation";
import { NAMA_SURAU } from "@/lib/tetapan";
import { infaqDipapar } from "@/lib/tetapanSistem";
import { getProfil, isMaster } from "@/lib/sesi";
import InfaqForm from "@/components/InfaqForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Infaq — Surau Ar Raudhah",
  description: "Infaq Subuh & Infaq Jamuan Yassin & Tahlil — Surau Ar Raudhah Eco Majestic.",
};

export default async function InfaqPage() {
  const [dipapar, profil] = await Promise.all([infaqDipapar(), getProfil()]);
  const preview = !dipapar && isMaster(profil);
  if (!dipapar && !preview) redirect("/");

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {preview && (
        <div className="rounded-lg bg-amber-400/90 px-4 py-2 text-sm font-semibold text-teal-900">
          👁️ PRATONTON SUPER ADMIN — halaman Infaq belum dilancarkan. Orang lain tidak nampak. Flip suis di /admin/tetapan bila sedia.
        </div>
      )}

      <section className="rounded-2xl bg-gradient-to-br from-surau to-surau-dark p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Infaq {NAMA_SURAU.includes("Ar Raudhah") ? "Surau Ar Raudhah" : ""}</h1>
        <p className="mt-2 text-sm text-amber-50 sm:text-base">
          Salurkan infaq anda dengan mudah — Infaq Subuh setiap pagi, atau tajaan Jamuan Yassin & Tahlil setiap malam Jumaat. Setiap sen membawa keberkatan.
        </p>
      </section>

      <InfaqForm />

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
