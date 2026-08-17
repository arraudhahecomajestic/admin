import { getProfil, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { tetapkanPeranan } from "./actions";
import { SENARAI_JAWATAN, jawatanSemasa } from "@/lib/jawatan";

export const dynamic = "force-dynamic";

export default async function PerananPage({ searchParams }: { searchParams: { cari?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isMaster(profil)) return <TiadaAkses />;

  // Buang aksara khas PostgREST (,()%*) supaya input carian tak boleh manipulasi penapis.
  const cari = (searchParams.cari ?? "").replace(/[,()%*]/g, " ").trim();
  const db = createAdminClient();
  let q = db.from("profil").select("id, nama, emel, peranan, master, jawatan, ahli_id, ahli_kariah(nama)").order("peranan").limit(200);
  if (cari) q = q.or(`emel.ilike.%${cari}%,nama.ilike.%${cari}%`);
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/peranan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Urus Peranan</h1>
        <p className="mt-1 text-sm text-slate-600">Pilih <b>jawatan</b> — level akses sistem di-set automatik ikut jawatan. Gelaran ini juga dipapar pada baucer. Hanya Super Admin/Master boleh akses halaman ini.</p>
      </div>

      <details className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
        <summary className="cursor-pointer font-semibold text-slate-800">Rujukan jawatan &amp; level akses</summary>
        <ul className="mt-3 space-y-1.5">
          {SENARAI_JAWATAN.map((j) => (
            <li key={j.jawatan} className="flex flex-wrap items-baseline gap-2">
              <span className="min-w-[150px] font-semibold text-slate-800">{j.jawatan}</span>
              <span className="text-xs text-slate-500">{j.nota}</span>
            </li>
          ))}
        </ul>
      </details>

      <form className="flex gap-2">
        <input name="cari" defaultValue={cari} placeholder="Cari nama atau emel…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
        <button className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white">Cari</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama / Emel</th>
              <th className="px-4 py-3">Jawatan &amp; Akses</th>
            </tr>
          </thead>
          <tbody>
            {senarai.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-slate-400">Tiada pengguna dijumpai.</td></tr>}
            {senarai.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{(u.nama || u.ahli_kariah?.nama || "—").toUpperCase()}</div>
                  <div className="text-xs text-slate-400">{u.emel}</div>
                  {u.ahli_id ? (
                    <a href={`/admin/permohonan/${u.ahli_id}`} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-surau hover:underline">
                      Lihat Profil →
                    </a>
                  ) : (
                    <span className="mt-1 inline-block text-xs text-slate-400">Tiada rekod ahli</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <form action={tetapkanPeranan} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="jawatan" defaultValue={jawatanSemasa(u.peranan, u.master, u.jawatan)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                      {SENARAI_JAWATAN.map((j) => <option key={j.jawatan} value={j.jawatan}>{j.jawatan}</option>)}
                    </select>
                    <ButangHantar className="rounded-lg bg-hitam px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50" pendingText="…">Simpan</ButangHantar>
                    {u.master && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">Super Admin</span>}
                    <span className="text-xs text-slate-400">Akses: {jawatanSemasa(u.peranan, u.master, u.jawatan)}</span>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
