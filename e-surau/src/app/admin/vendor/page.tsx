import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { tarikhMs } from "@/lib/format";
import { KATEGORI_VENDOR } from "@/lib/vendor";
import { tetapkanStatusVendor, padamVendor } from "./actions";

export const dynamic = "force-dynamic";

const warna: Record<string, string> = {
  menunggu: "bg-amber-100 text-amber-700",
  lulus: "bg-green-100 text-green-700",
  tolak: "bg-red-100 text-red-700",
};

export default async function AdminVendorPage({ searchParams }: { searchParams: { kategori?: string; status?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  let q = db.from("vendor").select("*").order("dicipta", { ascending: false }).limit(500);
  if (searchParams.status && ["menunggu", "lulus", "tolak"].includes(searchParams.status)) q = q.eq("status", searchParams.status);
  if (searchParams.kategori) q = q.contains("kategori", [searchParams.kategori]);
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/vendor" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Vendor / Pembekal</h1>

      <div className="flex flex-wrap gap-1 text-sm">
        <Tapis label="Semua" href="/admin/vendor" aktif={!searchParams.status && !searchParams.kategori} />
        <Tapis label="Menunggu" href="/admin/vendor?status=menunggu" aktif={searchParams.status === "menunggu"} />
        <Tapis label="Diluluskan" href="/admin/vendor?status=lulus" aktif={searchParams.status === "lulus"} />
        {KATEGORI_VENDOR.map((k) => (
          <Tapis key={k} label={k} href={`/admin/vendor?kategori=${encodeURIComponent(k)}`} aktif={searchParams.kategori === k} />
        ))}
      </div>

      <div className="space-y-3">
        {senarai.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada vendor.</p>}
        {senarai.map((v) => {
          const kat = Array.isArray(v.kategori) ? v.kategori : [];
          return (
            <div key={v.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{v.no_rujukan}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${warna[v.status]}`}>{v.status}</span>
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">{v.nama} <span className="text-xs font-normal text-slate-400">· {v.jenis_pemohon}</span></div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {kat.map((k: string) => <span key={k} className="rounded bg-surau/10 px-2 py-0.5 text-xs text-surau">{k}</span>)}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    {v.pegawai ? `${v.pegawai} · ` : ""}📞 {v.telefon}{v.whatsapp ? ` · WA ${v.whatsapp}` : ""}{v.emel ? ` · ${v.emel}` : ""}
                  </div>
                  {v.no_pendaftaran && <div className="text-xs text-slate-500">SSM/KP: {v.no_pendaftaran}</div>}
                  {v.keterangan && <div className="mt-1 rounded bg-slate-50 p-2 text-xs text-slate-600">{v.keterangan}</div>}
                  <div className="mt-1 text-xs text-slate-400">{tarikhMs(v.dicipta)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex gap-1">
                    <Btn id={v.id} status="lulus" label="Lulus" warna="bg-green-600" />
                    <Btn id={v.id} status="tolak" label="Tolak" warna="bg-red-600" />
                  </div>
                  <form action={padamVendor}><input type="hidden" name="id" value={v.id} /><button className="text-xs font-semibold text-red-600 hover:underline">Padam</button></form>
                </div>
              </div>
            </div>
          );
        })}
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
      <button className={`rounded-lg ${warna} px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90`}>{label}</button>
    </form>
  );
}
