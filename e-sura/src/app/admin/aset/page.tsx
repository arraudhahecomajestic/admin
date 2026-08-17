import { getProfil, isPentadbir, isAdmin } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import ButangHantar from "@/components/ButangHantar";
import { rm, tarikhMs } from "@/lib/format";
import { tambahAset, padamAset } from "./actions";

export const dynamic = "force-dynamic";

export default async function AsetPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isAdmin(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("aset").select("*").order("dicipta", { ascending: false }).limit(500);
  const aset = (data as any[]) ?? [];
  const jumlahNilai = aset.reduce((s, a) => s + Number(a.nilai || 0), 0);

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/aset" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Aset & Inventori</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Jumlah Item" nilai={String(aset.length)} />
        <Stat label="Jumlah Kuantiti" nilai={String(aset.reduce((s, a) => s + Number(a.kuantiti || 0), 0))} />
        <Stat label="Anggaran Nilai" nilai={rm(jumlahNilai)} />
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Tambah Aset</h2>
        <form action={tambahAset} className="grid gap-3 sm:grid-cols-2">
          <input name="nama" required placeholder="Nama aset *" className="inp" />
          <input name="kategori" placeholder="Kategori (cth: Elektrik, Perabot)" className="inp" />
          <input name="kuantiti" type="number" min="1" defaultValue={1} placeholder="Kuantiti" className="inp" />
          <input name="lokasi" placeholder="Lokasi (cth: Ruang solat)" className="inp" />
          <select name="keadaan" className="inp">
            <option value="Baik">Baik</option>
            <option value="Perlu Servis">Perlu Servis</option>
            <option value="Rosak">Rosak</option>
          </select>
          <input name="tarikh_perolehan" type="date" className="inp" />
          <input name="nilai" type="number" step="0.01" min="0" placeholder="Nilai (RM)" className="inp" />
          <input name="catatan" placeholder="Catatan (pilihan)" className="inp" />
          <div className="sm:col-span-2">
            <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Simpan Aset</ButangHantar>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Aset</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2 text-right">Kuantiti</th>
                <th className="px-4 py-2">Lokasi</th>
                <th className="px-4 py-2">Keadaan</th>
                <th className="px-4 py-2 text-right">Nilai</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {aset.length === 0 && <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Tiada aset direkod lagi.</td></tr>}
              {aset.map((a) => (
                <tr key={a.id} className="border-b last:border-0">
                  <td className="px-4 py-2">
                    <div className="font-medium text-slate-900">{a.nama}</div>
                    {a.tarikh_perolehan && <div className="text-xs text-slate-400">Diperoleh {tarikhMs(a.tarikh_perolehan)}</div>}
                  </td>
                  <td className="px-4 py-2">{a.kategori || "—"}</td>
                  <td className="px-4 py-2 text-right">{a.kuantiti}</td>
                  <td className="px-4 py-2">{a.lokasi || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-semibold ${a.keadaan === "Rosak" ? "bg-red-100 text-red-700" : a.keadaan === "Perlu Servis" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>{a.keadaan || "Baik"}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">{a.nilai ? rm(a.nilai) : "—"}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={padamAset}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}

function Stat({ label, nilai }: { label: string; nilai: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="text-xl font-bold text-slate-900">{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}
