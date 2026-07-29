import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { KATEGORI_VENDOR } from "@/lib/vendor";

export const dynamic = "force-dynamic";

function wa(tel: string | null): string {
  let d = (tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d ? "60" + d.slice(0, 10) : "";
}

export default async function DirektoriVendorPage({ searchParams }: { searchParams: { kategori?: string } }) {
  const kategori = searchParams.kategori || "";
  let vendor: any[] = [];
  if (supabaseConfigured) {
    let q = supabase.from("v_vendor_lulus").select("*");
    if (kategori) q = q.contains("kategori", [kategori]);
    const { data } = await q;
    vendor = (data as any[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Direktori Vendor Berdaftar</h1>
        <p className="mt-1 text-sm text-slate-600">Senarai vendor & pembekal yang telah diluluskan oleh Surau Ar-Raudhah.</p>
      </div>

      <div className="flex flex-wrap gap-1 text-sm">
        <Chip label="Semua" href="/vendor/direktori" aktif={!kategori} />
        {KATEGORI_VENDOR.map((k) => (
          <Chip key={k} label={k} href={`/vendor/direktori?kategori=${encodeURIComponent(k)}`} aktif={kategori === k} />
        ))}
      </div>

      {vendor.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-400 shadow-sm">Tiada vendor berdaftar dalam kategori ini lagi.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {vendor.map((v) => {
          const kat = Array.isArray(v.kategori) ? v.kategori : [];
          const w = wa(v.whatsapp || v.telefon);
          return (
            <div key={v.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="font-semibold text-slate-900">{v.nama}</div>
              <div className="text-xs text-slate-400">{v.jenis_pemohon}</div>
              <div className="mt-2 flex flex-wrap gap-1">
                {kat.map((k: string) => <span key={k} className="rounded bg-surau/10 px-2 py-0.5 text-xs text-surau">{k}</span>)}
              </div>
              {v.keterangan && <p className="mt-2 text-sm text-slate-600">{v.keterangan}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                {v.telefon && <a href={`tel:${v.telefon}`} className="font-medium text-slate-700 hover:underline">📞 {v.telefon}</a>}
                {w && <a href={`https://wa.me/${w}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</a>}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-center">
        <Link href="/vendor" className="text-sm font-medium text-surau hover:underline">+ Daftar sebagai vendor</Link>
        <span className="mx-2 text-slate-300">·</span>
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link>
      </p>
    </div>
  );
}

function Chip({ label, href, aktif }: { label: string; href: string; aktif: boolean }) {
  return <a href={href} className={`rounded-lg px-3 py-1.5 font-medium ${aktif ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{label}</a>;
}
