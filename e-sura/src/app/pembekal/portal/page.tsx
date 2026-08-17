import Link from "next/link";
import { getProfil } from "@/lib/sesi";
import { PerluMasuk } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { rm, tarikhMs } from "@/lib/format";
import { STATUS_TUNTUTAN, STATUS_PEMBEKAL } from "@/lib/pembekal";
import TuntutanPembekalForm from "@/components/TuntutanPembekalForm";
import ProgresTuntutan from "@/components/ProgresTuntutan";
import ButangTerima from "@/components/ButangTerima";

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
  // Slip bayaran (bukti pindahan dari bendahari) untuk setiap tuntutan.
  const slipMap: Record<string, string | null> = {};
  await Promise.all(tuntutan.filter((t) => t.url_slip).map(async (t) => { slipMap[t.id] = await signed(t.url_slip); }));

  // Baucer berkaitan (untuk tarikh kelulusan Pengerusi).
  const pbIds = tuntutan.map((t) => t.perbelanjaan_id).filter(Boolean);
  const pbMap: Record<string, any> = {};
  if (pbIds.length) {
    const { data: pbs } = await db.from("perbelanjaan").select("id, status, tarikh_lulus").in("id", pbIds);
    for (const x of (pbs as any[]) ?? []) pbMap[x.id] = x;
  }

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
          {profil.ahli_id
            ? <Link href="/ahli" className="rounded-lg border border-surau/40 px-3 py-1 text-sm font-medium text-surau hover:bg-surau/10">Portal Ahli</Link>
            : <Link href="/daftar" className="rounded-lg border border-surau/40 px-3 py-1 text-sm font-medium text-surau hover:bg-surau/10">Daftar Ahli Kariah</Link>}
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

      <section className="space-y-4">
        <h2 className="font-semibold text-slate-900">Tuntutan Saya</h2>
        {tuntutan.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada tuntutan lagi.</p>}
        {tuntutan.map((t) => {
          const st = STATUS_TUNTUTAN[t.status] ?? STATUS_TUNTUTAN.baru;
          const pb = t.perbelanjaan_id ? pbMap[t.perbelanjaan_id] : null;
          const langkah = [
            { label: "Tuntutan dihantar", tarikh: t.dicipta, done: true },
            { label: "Disahkan AJK", tarikh: t.tarikh_sah_ajk, done: ["disah_ajk", "diluluskan", "dibayar"].includes(t.status) },
            { label: "Baucer disedia (Bendahari)", tarikh: t.tarikh_lulus, done: ["diluluskan", "dibayar"].includes(t.status) },
            { label: "Diluluskan Pengerusi", tarikh: pb?.tarikh_lulus, done: pb ? ["lulus", "dibayar"].includes(pb.status) : false },
            { label: "Bayaran selesai", tarikh: t.tarikh_bayar, done: t.status === "dibayar" },
            { label: "Bayaran disahkan diterima", tarikh: t.tarikh_terima, done: !!t.diterima_disah },
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
              {t.status === "dibayar" && (
                t.diterima_disah
                  ? <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                      ✓ Anda telah <b>sahkan bayaran diterima</b>{t.tarikh_terima ? ` pada ${tarikhMs(t.tarikh_terima)}` : ""}.
                    </div>
                  : <ButangTerima tuntutanId={t.id} />
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
