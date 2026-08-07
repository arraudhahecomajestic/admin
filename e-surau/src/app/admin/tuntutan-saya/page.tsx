import Link from "next/link";
import AdminNav from "@/components/AdminNav";
import { getProfil, bolehTuntutanDalaman, isKerani } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { rm, tarikhMs } from "@/lib/format";
import BorangTuntutanDalaman from "@/components/BorangTuntutanDalaman";
import ProgresTuntutan from "@/components/ProgresTuntutan";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; warna: string }> = {
  baru: { label: "Menunggu Bendahari", warna: "bg-amber-100 text-amber-700" },
  diproses: { label: "Baucer disedia", warna: "bg-blue-100 text-blue-700" },
  dibayar: { label: "Selesai Dibayar", warna: "bg-green-100 text-green-700" },
  ditolak: { label: "Ditolak", warna: "bg-red-100 text-red-700" },
};

export default async function TuntutanSayaPage() {
  if (!adminConfigured) return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehTuntutanDalaman(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data: tData } = await db
    .from("tuntutan_dalaman")
    .select("*")
    .eq("profil_id", profil.id)
    .order("dicipta", { ascending: false });
  const tuntutan = (tData as any[]) ?? [];

  // Baucer berkaitan (untuk tarikh kelulusan Pengerusi).
  const pbIds = tuntutan.map((t) => t.perbelanjaan_id).filter(Boolean);
  const pbMap: Record<string, any> = {};
  if (pbIds.length) {
    const { data: pbs } = await db.from("perbelanjaan").select("id, status, tarikh_lulus").in("id", pbIds);
    for (const x of (pbs as any[]) ?? []) pbMap[x.id] = x;
  }

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const slipMap: Record<string, string | null> = {};
  await Promise.all(tuntutan.filter((t) => t.url_slip).map(async (t) => { slipMap[t.id] = await signed(t.url_slip); }));

  return (
    <div className="space-y-6">
      {isKerani(profil) && !profil.master ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <Link href="/kerani" className="text-sm font-medium text-surau hover:underline">← Portal Staf</Link>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            {profil.nama && <span>{profil.nama}</span>}
            <form action="/masuk/logout" method="post"><button className="hover:underline">Log keluar</button></form>
          </div>
        </div>
      ) : (
        <AdminNav aktif="/admin/tuntutan-saya" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      )}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Tuntutan Saya (Dalaman)</h1>
        <p className="mt-1 text-sm text-slate-600">Hantar tuntutan perbelanjaan anda untuk surau & pantau statusnya di sini.</p>
      </div>

      <BorangTuntutanDalaman />

      <section className="space-y-4">
        <h2 className="font-semibold text-slate-900">Senarai Tuntutan Saya</h2>
        {tuntutan.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada tuntutan lagi.</p>}
        {tuntutan.map((t) => {
          const st = STATUS[t.status] ?? STATUS.baru;
          const pb = t.perbelanjaan_id ? pbMap[t.perbelanjaan_id] : null;
          const langkah = [
            { label: "Tuntutan dihantar", tarikh: t.dicipta, done: true },
            { label: "Baucer disedia (Bendahari)", tarikh: pb ? null : null, done: ["diproses", "dibayar"].includes(t.status) },
            { label: "Diluluskan Pengerusi", tarikh: pb?.tarikh_lulus, done: pb ? ["lulus", "dibayar"].includes(pb.status) : false },
            { label: "Bayaran selesai", tarikh: t.tarikh_bayar, done: t.status === "dibayar" },
          ];
          return (
            <div key={t.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b pb-3">
                <div>
                  <span className="font-mono text-xs text-slate-400">{t.no_tuntutan}</span>
                  <div className="font-semibold text-slate-900">{t.butiran}</div>
                  <div className="text-xs text-slate-500">Dihantar: {tarikhMs(t.dicipta)}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-surau">{rm(t.jumlah)}</div>
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${st.warna}`}>{st.label}</span>
                </div>
              </div>
              <div className="mt-4">
                <ProgresTuntutan langkah={langkah} ditolak={t.status === "ditolak"} sebab={t.catatan} />
              </div>
              {t.status === "dibayar" && (
                <div className="mt-3 flex items-center gap-3 border-t pt-3 text-sm">
                  <span className="text-slate-500">Bukti bayaran:</span>
                  {slipMap[t.id]
                    ? <a href={slipMap[t.id]!} target="_blank" rel="noreferrer" className="font-semibold text-surau hover:underline">Lihat Slip Bayaran</a>
                    : <span className="text-slate-400">Slip belum dimuat naik</span>}
                  {t.rujukan_bayar && <span className="text-xs text-slate-400">· Ruj: {t.rujukan_bayar}</span>}
                </div>
              )}
            </div>
          );
        })}
      </section>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
