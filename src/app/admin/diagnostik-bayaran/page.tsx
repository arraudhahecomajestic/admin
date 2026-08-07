import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import AdminNav from "@/components/AdminNav";

export const dynamic = "force-dynamic";

export default async function DiagnostikBayaranPage() {
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const brand = process.env.CHIP_BRAND_ID ?? "";
  const key = process.env.CHIP_SECRET_KEY ?? "";
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "(default)";

  const Row = ({ nama, ada, info }: { nama: string; ada: boolean; info?: string }) => (
    <div className="flex items-center justify-between border-b border-slate-100 py-2 text-sm">
      <span className="font-mono text-slate-700">{nama}</span>
      <span>
        {ada
          ? <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">✓ Nampak {info}</span>
          : <span className="rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">✕ Tidak nampak</span>}
      </span>
    </div>
  );

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Diagnostik Bayaran (CHIP)</h1>
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-3 text-sm text-slate-600">
          Semakan sama ada server (runtime) nampak kunci CHIP. Halaman ini tidak memaparkan nilai penuh kunci.
        </p>
        <Row nama="CHIP_BRAND_ID" ada={!!brand} info={brand ? `(${brand.length} aksara)` : ""} />
        <Row nama="CHIP_SECRET_KEY" ada={!!key} info={key ? `(${key.length} aksara)` : ""} />
        <div className="flex items-center justify-between py-2 text-sm">
          <span className="font-mono text-slate-700">NEXT_PUBLIC_SITE_URL</span>
          <span className="text-slate-500">{site}</span>
        </div>
        <div className="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          {(!brand || !key)
            ? "Salah satu / kedua kunci TIDAK nampak. Pastikan ia diletak di Worker → Settings → Variables and Secrets (bahagian RUNTIME, jenis Secret), BUKAN di 'Build variables'. Kemudian Retry deployment."
            : "Kedua-dua kunci nampak oleh server. Bayaran CHIP sepatutnya berfungsi. Jika masih gagal, semak nilai kunci betul & mod (test/live) sepadan."}
        </div>
      </div>
    </div>
  );
}
