import { getProfil, isPentadbir, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { KAWASAN, KAWASAN_LAIN, kenalKawasan } from "@/lib/kawasan";

export const dynamic = "force-dynamic";

export default async function KariahKawasanPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isPentadbir(profil) || isMaster(profil))) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("ahli_kariah").select("id, nama, alamat, alamat_kp, kawasan, maklumat_disahkan").order("nama");
  const ahli = (data as any[]) ?? [];

  // Kumpul ikut kawasan
  const susunan = [...KAWASAN.map((k) => k.kod), KAWASAN_LAIN.kod];
  const kump: Record<string, { nama: string; ahli: any[] }> = {};
  for (const k of [...KAWASAN, KAWASAN_LAIN]) kump[k.kod] = { nama: k.nama, ahli: [] };
  for (const a of ahli) {
    const kw = kenalKawasan(a.alamat || a.alamat_kp, a.kawasan);
    (kump[kw.kod] ?? kump[KAWASAN_LAIN.kod]).ahli.push(a);
  }

  const jumlah = ahli.length;
  const maxBil = Math.max(1, ...susunan.map((k) => kump[k].ahli.length));

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/kariah-kawasan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Ahli Kariah Ikut Kawasan</h1>
        <p className="mt-1 text-sm text-slate-600">Bilangan ahli berdaftar setiap fasa — untuk chase AJK setiap kawasan push pendaftaran. Jumlah: <b>{jumlah}</b> ahli.</p>
      </div>

      {/* Ringkasan bilangan */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Ringkasan</h2>
        <div className="space-y-2">
          {susunan.map((kod) => {
            const g = kump[kod];
            const bil = g.ahli.length;
            const pct = Math.round((bil / maxBil) * 100);
            const isLain = kod === KAWASAN_LAIN.kod;
            return (
              <div key={kod} className="flex items-center gap-3 text-sm">
                <div className="w-40 shrink-0 font-medium text-slate-700">{g.nama}</div>
                <div className="h-5 flex-1 overflow-hidden rounded bg-slate-100">
                  <div className={`h-full ${isLain ? "bg-slate-400" : "bg-surau"}`} style={{ width: `${bil ? Math.max(pct, 4) : 0}%` }} />
                </div>
                <div className="w-12 shrink-0 text-right font-bold text-slate-900">{bil}</div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Auto-kesan dari alamat (nombor selepas &quot;Eco Majestic&quot;). Ahli boleh sahkan kawasan sendiri dalam borang kemas kini.
          &quot;Lain-lain&quot; = alamat luar fasa (cth kedai jalan 3/4/5) atau tiada alamat.
        </p>
      </section>

      {/* Senarai per kawasan */}
      {susunan.map((kod) => {
        const g = kump[kod];
        if (g.ahli.length === 0) return null;
        return (
          <section key={kod} className="rounded-xl bg-white shadow-sm">
            <h2 className="flex items-center justify-between border-b px-5 py-3 font-semibold text-slate-900">
              <span>{g.nama}</span>
              <span className="rounded-full bg-surau/10 px-3 py-0.5 text-sm font-semibold text-surau">{g.ahli.length} ahli</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {g.ahli.map((a) => (
                <div key={a.id} className="flex items-center justify-between gap-3 px-5 py-2 text-sm">
                  <span className="font-medium text-slate-800">{a.nama}</span>
                  <span className="flex items-center gap-2">
                    {!a.maklumat_disahkan && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">Belum sah</span>}
                    {a.kawasan && <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">✓ dipilih</span>}
                  </span>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
