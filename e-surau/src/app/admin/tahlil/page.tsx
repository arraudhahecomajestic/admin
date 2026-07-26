import { getProfil, bolehTahlil } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangCetak from "@/components/ButangCetak";
import { khamisAkan } from "@/lib/arwah";
import { tarikhMs } from "@/lib/format";
import { padamArwah } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminTahlilPage({ searchParams }: { searchParams: { minggu?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehTahlil(profil)) return <TiadaAkses />;

  const minggu = searchParams.minggu || khamisAkan();
  const db = createAdminClient();
  const { data } = await db.from("arwah").select("*").eq("minggu", minggu).order("jantina").order("nama");
  const arwah = (data as any[]) ?? [];
  const lelaki = arwah.filter((a) => a.jantina === "lelaki");
  const perempuan = arwah.filter((a) => a.jantina === "perempuan");
  const lain = arwah.filter((a) => a.jantina === "tidak_pasti");

  // senarai minggu tersedia
  const { data: mgu } = await db.from("arwah").select("minggu").order("minggu", { ascending: false }).limit(500);
  const mingguList = [...new Set(((mgu as any[]) ?? []).map((m) => m.minggu))].slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="no-print">
        <AdminNav aktif="/admin/tahlil" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-slate-900">Senarai Arwah — Yaasin & Tahlil</h1>
          <ButangCetak />
        </div>
        {mingguList.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {mingguList.map((m) => (
              <a key={m} href={`/admin/tahlil?minggu=${m}`} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${m === minggu ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>{tarikhMs(m)}</a>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-3 text-center">
          <h2 className="text-lg font-bold text-slate-900">Sesi {tarikhMs(minggu)} (Malam Jumaat)</h2>
          <p className="text-sm text-slate-500">Jumlah {arwah.length} arwah</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Blok tajuk="Al-Marhum (Lelaki)" senarai={lelaki} />
          <Blok tajuk="Al-Marhumah (Perempuan)" senarai={perempuan} />
        </div>
        {lain.length > 0 && <div className="mt-4"><Blok tajuk="Belum dipastikan (sila semak)" senarai={lain} /></div>}
      </div>

      <style>{`@media print { .no-print{display:none!important} body{background:white!important} }`}</style>
    </div>
  );
}

function Blok({ tajuk, senarai }: { tajuk: string; senarai: any[] }) {
  return (
    <div>
      <h3 className="mb-1 font-semibold text-slate-900">{tajuk} ({senarai.length})</h3>
      <ol className="list-decimal space-y-1 pl-6 text-sm text-slate-700">
        {senarai.length === 0 && <p className="list-none text-slate-400">Tiada.</p>}
        {senarai.map((a) => (
          <li key={a.id} className="group">
            {a.nama}
            {a.pemohon && <span className="text-xs text-slate-400"> · {a.pemohon}</span>}
            <form action={padamArwah} className="ml-2 inline no-print">
              <input type="hidden" name="id" value={a.id} />
              <button className="text-xs text-red-500 opacity-0 hover:underline group-hover:opacity-100">padam</button>
            </form>
          </li>
        ))}
      </ol>
    </div>
  );
}
