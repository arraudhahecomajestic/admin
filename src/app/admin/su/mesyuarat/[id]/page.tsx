import { getProfil, isPentadbir, isMaster, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import MesyuaratDetail from "@/components/MesyuaratDetail";

export const dynamic = "force-dynamic";

export default async function MesyuaratDetailPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const [{ data: m }, { data: tindakan }] = await Promise.all([
    db.from("mesyuarat").select("*").eq("id", params.id).maybeSingle(),
    db.from("mesyuarat_tindakan").select("*").eq("mesyuarat_id", params.id).order("dicipta"),
  ]);
  if (!m) return <div className="rounded-lg border p-4 text-sm">Mesyuarat tidak dijumpai.</div>;

  return <MesyuaratDetail mesyuarat={m} tindakan={(tindakan as any[]) ?? []} />;
}
