import { getProfil, isMaster } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { tetapkanPeranan } from "./actions";

export const dynamic = "force-dynamic";

const PERANAN = [
  { v: "ahli", t: "Ahli" },
  { v: "imam", t: "Imam" },
  { v: "ajk", t: "AJK" },
  { v: "bendahari", t: "Bendahari" },
  { v: "admin", t: "Admin / SU" },
];

export default async function PerananPage({ searchParams }: { searchParams: { cari?: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isMaster(profil)) return <TiadaAkses />;

  const cari = (searchParams.cari ?? "").trim();
  const db = createAdminClient();
  let q = db.from("profil").select("id, nama, emel, peranan, master").order("peranan").limit(200);
  if (cari) q = q.or(`emel.ilike.%${cari}%,nama.ilike.%${cari}%`);
  const { data } = await q;
  const senarai = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/peranan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Urus Peranan</h1>
        <p className="mt-1 text-sm text-slate-600">Lantik Admin, Imam, Bendahari, AJK. Hanya Master Admin boleh akses halaman ini.</p>
      </div>

      <form className="flex gap-2">
        <input name="cari" defaultValue={cari} placeholder="Cari nama atau emel…" className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
        <button className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white">Cari</button>
      </form>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Nama / Emel</th>
              <th className="px-4 py-3">Peranan</th>
              <th className="px-4 py-3">Master</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {senarai.length === 0 && <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Tiada pengguna dijumpai.</td></tr>}
            {senarai.map((u) => (
              <tr key={u.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{u.nama || "—"}</div>
                  <div className="text-xs text-slate-400">{u.emel}</div>
                </td>
                <td className="px-4 py-3" colSpan={3}>
                  <form action={tetapkanPeranan} className="flex flex-wrap items-center gap-3">
                    <input type="hidden" name="id" value={u.id} />
                    <select name="peranan" defaultValue={u.peranan} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                      {PERANAN.map((p) => <option key={p.v} value={p.v}>{p.t}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-xs text-slate-600">
                      <input type="checkbox" name="master" defaultChecked={u.master} /> Master
                    </label>
                    <button className="rounded-lg bg-hitam px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">Simpan</button>
                    {u.master && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">Master Admin</span>}
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
