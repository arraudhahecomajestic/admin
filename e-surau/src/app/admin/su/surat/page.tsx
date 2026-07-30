import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import Link from "next/link";
import { tarikhMs } from "@/lib/format";
import { cadangRujukan, labelStatusSurat } from "@/lib/su";
import SuratBaru from "@/components/SuratBaru";

export const dynamic = "force-dynamic";

export default async function SuratListPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("surat").select("id, jenis, no_rujukan, tarikh, pihak, perkara, status").order("tarikh", { ascending: false }).order("dicipta", { ascending: false });
  const senarai = (data as any[]) ?? [];

  // Cadang no rujukan surat keluar (kira surat keluar tahun ini)
  const tahun = new Date().getFullYear();
  const bilKeluar = senarai.filter((s) => s.jenis === "keluar").length;
  const rujukanCadang = cadangRujukan(bilKeluar, tahun);

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/su" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Surat Rasmi &amp; Daftar</h1>
          <p className="mt-1 text-sm text-slate-600">Karang surat keluar berkepala surat, rekod surat masuk.</p>
        </div>
        <Link href="/admin/su" className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50">← Panel SU</Link>
      </div>

      <SuratBaru rujukanCadang={rujukanCadang} />

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Daftar Surat</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
              <tr><th className="px-4 py-2">Jenis</th><th className="px-4 py-2">Rujukan</th><th className="px-4 py-2">Tarikh</th><th className="px-4 py-2">Pihak</th><th className="px-4 py-2">Perkara</th><th className="px-4 py-2">Status</th></tr>
            </thead>
            <tbody>
              {senarai.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Tiada surat direkod.</td></tr>}
              {senarai.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${s.jenis === "keluar" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>{s.jenis === "keluar" ? "Keluar" : "Masuk"}</span>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{s.no_rujukan || "—"}</td>
                  <td className="px-4 py-2">{s.tarikh ? tarikhMs(s.tarikh) : "—"}</td>
                  <td className="px-4 py-2">{s.pihak || "—"}</td>
                  <td className="px-4 py-2">
                    <Link href={`/admin/su/surat/${s.id}`} className="font-medium text-surau hover:underline">{s.perkara}</Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-slate-500">{labelStatusSurat(s.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
