import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { adminConfigured } from "@/lib/supabaseAdmin";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import AdminNav from "@/components/AdminNav";
import SeedRunner from "@/components/SeedRunner";

export const dynamic = "force-dynamic";

export default async function SeedAkaunPage() {
  if (!adminConfigured)
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Supabase belum dikonfigurasi.
      </div>
    );
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  return (
    <div className="space-y-6">
      <AdminNav aktif="" nama={profil.nama ?? profil.emel ?? undefined} />
      <div>
        <Link href="/admin" className="text-sm text-slate-500 hover:underline">← Kembali ke Panel Admin</Link>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">Sediakan Akaun Ahli</h1>
      </div>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">
          Butang ini mencipta akaun log masuk untuk ahli sedia ada yang ada emel
          dalam rekod. Kata laluan setiap ahli ialah <b>No. Kad Pengenalan</b> mereka
          (tanpa sengkang). Ahli dengan emel dikongsi / tiada emel akan dilangkau —
          mereka guna cara <b>No. KP + telefon</b> di Portal.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Selamat ditekan berulang kali — akaun yang sudah wujud akan dilangkau.
        </p>

        <div className="mt-4">
          <SeedRunner />
        </div>
      </div>
    </div>
  );
}
