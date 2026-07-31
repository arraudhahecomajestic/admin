import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import MaklumBalasAdmin from "@/components/MaklumBalasAdmin";

export const dynamic = "force-dynamic";

export default async function AdminMaklumBalasPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("maklum_balas").select("id, jenis, nama, hubungan, mesej, status, tindakan, dicipta").order("dicipta", { ascending: false });

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/su" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maklum Balas Kariah</h1>
          <p className="mt-1 text-sm text-slate-600">Komplen &amp; cadangan penambahbaikan dari orang ramai.</p>
        </div>
        <Link href="/admin/su" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">← Panel SU</Link>
      </div>
      <MaklumBalasAdmin senarai={(data as any[]) ?? []} />
    </div>
  );
}
