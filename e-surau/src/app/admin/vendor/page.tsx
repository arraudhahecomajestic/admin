import { getProfil, isPentadbir, bolehKewangan, bolehLulusVendor } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { tarikhMs } from "@/lib/format";
import { tetapkanStatusVendor, padamVendor } from "./actions";

export const dynamic = "force-dynamic";

const warna: Record<string, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  lulus: "bg-green-100 text-green-700",
  tolak: "bg-red-100 text-red-700",
};

export default async function AdminVendorPage({ searchParams }: { searchParams: { status?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil) && !bolehKewangan(profil)) return <TiadaAkses />;
  const bolehLulus = bolehLulusVendor(profil); // Admin & Bendahari sahaja boleh lulus/tolak/padam

  const db = createAdminClient();
  let q = db.from("pembekal").select("*").order("dicipta", { ascending: false }).limit(500);
  if (searchParams.status && ["menunggu", "lulus", "tolak"].includes(searchParams.status)) q = q.eq("status", searchParams.status);
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  // Kiraan untuk tab
  const { data: semua } = await db.from("pembekal").select("status");
  const bil = { semua: (semua as any[])?.length ?? 0, menunggu: 0, lulus: 0 };
  for (const r of (semua as any[]) ?? []) { if (r.status === "menunggu") bil.menunggu++; if (r.status === "lulus") bil.lulus++; }

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/vendor" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Vendor / Pembekal</h1>

      <div className="flex flex-wrap gap-1 text-sm">
        <Tapis label={`Semua (${bil.semua})`} href="/admin/vendor" aktif={!searchParams.status} />
        <Tapis label={`Menunggu (${bil.menunggu})`} href="/admin/vendor?status=menunggu" aktif={searchParams.status === "menunggu"} />
        <Tapis label={`Diluluskan (${bil.lulus})`} href="/admin/vendor?status=lulus" aktif={searchParams.status === "lulus"} />
      </div>

      <div className="space-y-3">
        {senarai.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada vendor dalam kategori ini.</p>}
        {senarai.map((v) => (
          <div key={v.id} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`rounded px-2 py-0.5 text-xs font-semibold ${warna[v.status] ?? "bg-slate-100 text-slate-600"}`}>{v.status}</span>
                  <span className="rounded bg-surau/10 px-2 py-0.5 text-xs text-surau">{v.jenis || "vendor"}</span>
                </div>
                <div className="mt-1 font-semibold text-slate-900">{v.nama}{v.syarikat ? <span className="text-sm font-normal text-slate-500"> · {v.syarikat}</span> : null}</div>
                <div className="mt-1 text-xs text-slate-500">
                  📞 {v.telefon || "-"}{v.emel ? ` · ${v.emel}` : ""}{v.no_kp ? ` · KP ${v.no_kp}` : ""}
                </div>
                {(v.bank || v.no_akaun) && (
                  <div className="mt-0.5 text-xs text-slate-500">🏦 {v.bank || "-"} · {v.no_akaun || "-"}{v.nama_akaun ? ` · ${v.nama_akaun}` : ""}</div>
                )}
                {v.catatan && <div className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600">{v.catatan}</div>}
                <div className="mt-1 text-xs text-slate-400">{tarikhMs(v.dicipta)}</div>
              </div>
              {bolehLulus && (
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <Btn id={v.id} status="lulus" label="Lulus" warna="bg-green-600" />
                    <Btn id={v.id} status="tolak" label="Tolak" warna="bg-red-600" />
                  </div>
                  <form action={padamVendor}><input type="hidden" name="id" value={v.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Padam</button></form>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Tapis({ label, href, aktif }: { label: string; href: string; aktif: boolean }) {
  return <a href={href} className={`rounded-lg px-3 py-1.5 font-medium ${aktif ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</a>;
}
function Btn({ id, status, label, warna }: { id: string; status: string; label: string; warna: string }) {
  return (
    <form action={tetapkanStatusVendor}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <ButangHantar className={`rounded-lg ${warna} px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50`} pendingText="…">{label}</ButangHantar>
    </form>
  );
}
