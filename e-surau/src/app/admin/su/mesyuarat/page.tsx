import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import { tarikhMs } from "@/lib/format";
import MesyuaratBaru from "@/components/MesyuaratBaru";

export const dynamic = "force-dynamic";

export default async function MesyuaratListPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("mesyuarat").select("id, tajuk, jenis, tarikh, tempat, status").order("tarikh", { ascending: false, nullsFirst: false }).order("dicipta", { ascending: false });
  const senarai = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/su" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Minit Mesyuarat</h1>
          <p className="mt-1 text-sm text-slate-600">Rekod agenda, minit &amp; jejak tindakan setiap mesyuarat.</p>
        </div>
        <Link href="/admin/su" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">← Panel SU</Link>
      </div>

      <MesyuaratBaru />

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Mesyuarat</h2>
        <div className="divide-y divide-slate-100">
          {senarai.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Belum ada mesyuarat direkod.</p>}
          {senarai.map((m) => (
            <Link key={m.id} href={`/admin/su/mesyuarat/${m.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-slate-50">
              <div>
                <div className="font-medium text-slate-900">{m.tajuk}</div>
                <div className="text-xs text-slate-500">
                  <span className="rounded bg-slate-100 px-1.5 py-0.5">{m.jenis}</span>
                  {m.tarikh ? ` · ${tarikhMs(m.tarikh)}` : ""}{m.tempat ? ` · ${m.tempat}` : ""}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${m.status === "selesai" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                {m.status === "selesai" ? "Selesai" : "Draf"}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
