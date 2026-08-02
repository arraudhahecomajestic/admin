import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { rm, tarikhMs } from "@/lib/format";
import { tetapkanStatusSewaan, padamSewaan } from "./actions";

export const dynamic = "force-dynamic";

const warnaStatus: Record<string, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  lulus: "bg-green-100 text-green-700",
  tolak: "bg-red-100 text-red-700",
  selesai: "bg-slate-200 text-slate-600",
};

export default async function AdminSewaanPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("sewaan").select("*").order("dicipta", { ascending: false }).limit(300);
  const senarai = (data as any[]) ?? [];

  // Peta bayaran (CHIP) ikut rujukan_id
  const { data: bayaranData } = await db
    .from("bayaran")
    .select("rujukan_id, status, jumlah, tarikh_bayar")
    .eq("jenis", "sewaan")
    .order("dicipta", { ascending: false });
  const bayarMap: Record<string, any> = {};
  for (const b of (bayaranData as any[]) ?? []) {
    if (b.rujukan_id && !bayarMap[b.rujukan_id]) bayarMap[b.rujukan_id] = b;
  }

  async function signed(path: string | null) {
    if (!path) return null;
    const rel = path.replace(/^salinan-kp\//, "");
    const { data } = await db.storage.from("salinan-kp").createSignedUrl(rel, 3600);
    return data?.signedUrl ?? null;
  }
  const ttdMap: Record<string, string | null> = {};
  await Promise.all(senarai.map(async (s) => { ttdMap[s.id] = await signed(s.url_tandatangan); }));

  const menunggu = senarai.filter((s) => s.status === "menunggu").length;

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/sewaan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Permohonan Sewaan</h1>
        <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-700">{menunggu} menunggu</span>
      </div>

      <div className="space-y-4">
        {senarai.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada permohonan sewaan lagi.</p>}
        {senarai.map((s) => {
          const ruang = Array.isArray(s.ruang) ? s.ruang : [];
          const peralatan = Array.isArray(s.peralatan) ? s.peralatan : [];
          return (
            <div key={s.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{s.no_rujukan}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${warnaStatus[s.status]}`}>{s.status}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">{s.nama_program || s.jenis_acara || "Sewaan"}</div>
                  <div className="text-sm text-slate-600">{s.nama_pemohon} · {s.status_pemohon}</div>
                  <div className="text-xs text-slate-500">{tarikhMs(s.tarikh_acara)}{s.masa_mula ? ` · ${s.masa_mula}${s.masa_tamat ? `–${s.masa_tamat}` : ""}` : ""}</div>
                  <div className="text-xs text-slate-500">{s.telefon || "—"}{s.whatsapp ? ` · WA ${s.whatsapp}` : ""}{s.emel ? ` · ${s.emel}` : ""}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-lg font-bold text-surau">{rm(s.jumlah_keseluruhan)}</div>
                  <div className="text-xs text-slate-500">Deposit: {rm(s.deposit)}</div>
                  {bayarMap[s.id]?.status === "dibayar"
                    ? <div className="mt-1 inline-block rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">✓ Dibayar online {rm(Number(bayarMap[s.id].jumlah || 0))}</div>
                    : bayarMap[s.id]?.status === "menunggu"
                    ? <div className="mt-1 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Bayaran belum selesai</div>
                    : null}
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs text-slate-600 sm:grid-cols-2">
                <div><b>Ruang:</b> {ruang.length ? ruang.map((r: any) => `${r.nama} (${rm(r.kadar)})`).join(", ") : "—"}</div>
                <div><b>Peralatan:</b> {peralatan.length ? peralatan.map((p: any) => `${p.nama} ×${p.kuantiti}`).join(", ") : "—"}</div>
              </div>
              {s.butiran && <div className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-600">{s.butiran}</div>}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                {ttdMap[s.id] && <a href={ttdMap[s.id]!} target="_blank" className="text-xs font-semibold text-surau hover:underline">Lihat Tandatangan</a>}
                <div className="flex-1" />
                <Butang id={s.id} status="lulus" label="Luluskan" warna="bg-green-600" />
                <Butang id={s.id} status="tolak" label="Tolak" warna="bg-red-600" />
                <Butang id={s.id} status="selesai" label="Selesai" warna="bg-slate-600" />
                <form action={padamSewaan}><input type="hidden" name="id" value={s.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Padam</button></form>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Butang({ id, status, label, warna }: { id: string; status: string; label: string; warna: string }) {
  return (
    <form action={tetapkanStatusSewaan}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <ButangHantar className={`rounded-lg ${warna} px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50`} pendingText="…">{label}</ButangHantar>
    </form>
  );
}
