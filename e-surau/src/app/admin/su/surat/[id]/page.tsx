import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import SuratDetail from "@/components/SuratDetail";

export const dynamic = "force-dynamic";

export default async function SuratDetailPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("surat").select("*").eq("id", params.id).maybeSingle();
  if (!data) return <div className="rounded-lg border p-4 text-sm">Surat tidak dijumpai.</div>;

  return <SuratDetail surat={data} pencatat={profil.nama ?? profil.emel ?? "Setiausaha"} />;
}
