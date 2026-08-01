import Link from "next/link";
import { getProfil } from "@/lib/sesi";
import { PerluMasuk } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { rm, tarikhMs } from "@/lib/format";
import { STATUS_TUNTUTAN, STATUS_PEMBEKAL } from "@/lib/pembekal";
import TuntutanPembekalForm from "@/components/TuntutanPembekalForm";

export const dynamic = "force-dynamic";

export default async function PembekalPortalPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Sistem belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;

  const db = createAdminClient();

  // Auto-sambung ikut e-mel jika akaun belum dipautkan ke rekod pembekal.
  let pembekalId = profil.pembekal_id;
  if (!pembekalId && profil.emel) {
    const { data: padan } = await db.from("pembekal").select("id").eq("emel", profil.emel.toLowerCase()).maybeSingle();
    if ((padan as any)?.id) {
      pembekalId = (padan as any).id;
      await db.from("profil").update({ pembekal_id: pembekalId }).eq("id", profil.id);
    }
  }

  if (!pembekalId) {
    return (
      <div className="mx-auto max-w-md rounded-xl bg-white p-6 text-center shadow-sm">
        <h1 className="text-lg font-bold text-slate-900">Akaun bukan pembekal</h1>
        <p className="mt-2 text-sm text-slate-600">Akaun anda tidak dipautkan sebagai pembekal. Jika anda vendor/imam/bilal/supplier, sila daftar dahulu.</p>
        <Link href="/pembekal/daftar" className="mt-4 inline-block rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white">Daftar Pembekal</Link>
      </div>
    );
  }

  const { data: pb } = await db.from("pembekal").select("*").eq("id", pembekalId).single();
  const p: any = pb;
  const { data: tuntutanData } = await db
    .from("tuntutan_bayaran")
    .select("*")
    .eq("pembekal_id", pembekalId)
    .order("dicipta", { ascending: false });
  const tuntutan = (tuntutanData as any[]) ?? [];

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const slipMap: Record<string, string | null> = {};
  await Promise.all(tuntutan.filter((t) => t.url_dokumen).map(async (t) => { slipMap[t.id] = await signed(t.url_dokumen); }));

  const stPb = STATUS_PEMBEKAL[p?.status] ?? STATUS_PEMBEKAL.menunggu;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-3">
        <div>
          <div className="text-xs text-slate-500">Portal Pembekal</div>
          <h1 className="text-2xl font-bold text-slate-900">{p?.nama}</h1>
          <p className="text-sm text-slate-500">{p?.jenis}{p?.syarikat ? ` · ${p.syarikat}` : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${stPb.warna}`}>{stPb.label}</span>
          <form action="/masuk/logout" method="post"><button className="text-sm text-slate-500 hover:underline">Log keluar</button></form>
        </div>
      </div>

      {p?.status === "menunggu" && (
        <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
          Akaun pembekal anda <b>menunggu kelulusan AJK surau</b>. Anda boleh hantar tuntutan selepas diluluskan.
        </div>
      )}
      {p?.status === "tolak" && (
        <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 text-sm text-red-800">
          Pendaftaran pembekal anda tidak diluluskan. Sila hubungi pejabat surau.
        </div>
      )}

      {p?.status === "lulus" && <TuntutanPembekalForm />}

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Tuntutan Saya</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">No.</th>
                <th className="px-4 py-2">Tarikh</th>
                <th className="px-4 py-2">Butiran</th>
                <th className="px-4 py-2 text-right">Jumlah</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Slip</th>
              </tr>
            </thead>
            <tbody>
              {tuntutan.length === 0 && <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Tiada tuntutan lagi.</td></tr>}
              {tuntutan.map((t) => {
                const st = STATUS_TUNTUTAN[t.status] ?? STATUS_TUNTUTAN.baru;
                return (
                  <tr key={t.id} className="border-b last:border-0">
                    <td className="px-4 py-2 font-mono text-xs">{t.no_tuntutan}</td>
                    <td className="px-4 py-2">{tarikhMs(t.dicipta)}</td>
                    <td className="px-4 py-2">{t.butiran}</td>
                    <td className="px-4 py-2 text-right font-medium">{rm(t.jumlah)}</td>
                    <td className="px-4 py-2"><span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.warna}`}>{st.label}</span></td>
                    <td className="px-4 py-2">{slipMap[t.id] ? <a href={slipMap[t.id]!} target="_blank" className="text-xs font-semibold text-surau hover:underline">Lihat</a> : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
