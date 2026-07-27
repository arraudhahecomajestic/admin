import { getProfil, isKerani, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { adminConfigured } from "@/lib/supabaseAdmin";
import KeraniCarian from "@/components/KeraniCarian";

export const dynamic = "force-dynamic";

export default async function KeraniPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!(isKerani(profil) || isMaster(profil))) return <TiadaAkses />;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Semak Senarai Ahli Kariah</h1>
          <p className="mt-1 text-sm text-slate-600">
            Cari & sahkan maklumat ahli untuk tally dengan borang hardcopy. Akses kerani — carian sahaja.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {profil.nama && <span>👤 {profil.nama}</span>}
          <form action="/masuk/logout" method="post">
            <button className="hover:underline">Log keluar</button>
          </form>
        </div>
      </div>

      <KeraniCarian />
    </div>
  );
}
