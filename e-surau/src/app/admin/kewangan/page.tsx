import Link from "next/link";
import { getProfil, bolehKewangan } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { rm, tarikhMs } from "@/lib/format";
import { tambahKutipan, tambahBelanja, padamKutipan, padamBelanja } from "./actions";

export const dynamic = "force-dynamic";

const hariIni = () => new Date().toISOString().slice(0, 10);
const bulanIni = () => new Date().toISOString().slice(0, 7);

export default async function KewanganPage() {
  if (!adminConfigured)
    return <Perlu />;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!bolehKewangan(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const [katK, katB, kutipanRes, belanjaRes, tuntutanRes, ahliRes] = await Promise.all([
    db.from("kategori_kutipan").select("id, nama, jenis_khairat").order("id"),
    db.from("kategori_belanja").select("id, nama").order("id"),
    db.from("kutipan").select("id, no_resit, jumlah, kaedah, tarikh, catatan, kategori:kategori_kutipan(nama, jenis_khairat), ahli:ahli_kariah(nama)").order("dicipta", { ascending: false }).limit(200),
    db.from("perbelanjaan").select("id, jumlah, keterangan, tarikh, dari_khairat, kategori:kategori_belanja(nama)").order("dicipta", { ascending: false }).limit(200),
    db.from("tuntutan_khairat").select("jumlah_pampasan, status").eq("status", "dibayar"),
    db.from("ahli_kariah").select("id, nama, no_ahli").eq("status", "lulus").order("nama"),
  ]);

  const kutipan = (kutipanRes.data ?? []) as any[];
  const belanja = (belanjaRes.data ?? []) as any[];
  const tuntutan = (tuntutanRes.data ?? []) as any[];
  const ahli = (ahliRes.data ?? []) as any[];

  const jum = (arr: any[], f: (x: any) => boolean, key = "jumlah") =>
    arr.filter(f).reduce((s, x) => s + Number(x[key] || 0), 0);

  const masukAm = jum(kutipan, (k) => !k.kategori?.jenis_khairat);
  const masukKhairat = jum(kutipan, (k) => !!k.kategori?.jenis_khairat);
  const keluarAm = jum(belanja, (b) => !b.dari_khairat);
  const keluarKhairatBelanja = jum(belanja, (b) => !!b.dari_khairat);
  const pampasanDibayar = jum(tuntutan, () => true, "jumlah_pampasan");

  const bakiAm = masukAm - keluarAm;
  const bakiKhairat = masukKhairat - keluarKhairatBelanja - pampasanDibayar;

  const bln = bulanIni();
  const masukBulan = jum(kutipan, (k) => String(k.tarikh).startsWith(bln));
  const keluarBulan = jum(belanja, (b) => String(b.tarikh).startsWith(bln));

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/kewangan" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-slate-900">Kewangan</h1>
        <Link href="/admin/kewangan/laporan" className="rounded-lg border border-surau/40 px-3 py-1.5 text-sm font-semibold text-surau hover:bg-surau/10">
          Laporan & Penyata →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Baki Tabung Am" nilai={rm(bakiAm)} warna="text-surau" />
        <Stat label="Baki Tabung Khairat" nilai={rm(bakiKhairat)} warna="text-teal-600" />
        <Stat label="Kutipan Bulan Ini" nilai={rm(masukBulan)} warna="text-green-600" />
        <Stat label="Belanja Bulan Ini" nilai={rm(keluarBulan)} warna="text-red-600" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Borang kutipan */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Rekod Kutipan</h2>
          <form action={tambahKutipan} className="space-y-3">
            <select name="kategori_id" required className="inp">
              {(katK.data ?? []).map((k: any) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <input name="jumlah" type="number" step="0.01" min="0.01" placeholder="Jumlah (RM)" required className="inp" />
              <select name="kaedah" className="inp">
                <option value="tunai">Tunai</option>
                <option value="online">Online</option>
                <option value="cek">Cek</option>
              </select>
            </div>
            <select name="ahli_id" className="inp">
              <option value="">— Tanpa ahli (umum) —</option>
              {ahli.map((a) => (
                <option key={a.id} value={a.id}>{a.no_ahli} · {a.nama}</option>
              ))}
            </select>
            <input name="catatan" placeholder="Catatan (pilihan)" className="inp" />
            <input name="tarikh" type="date" defaultValue={hariIni()} className="inp" />
            <button className="w-full rounded-lg bg-surau px-4 py-2 font-semibold text-white hover:bg-surau-dark">
              Simpan Kutipan
            </button>
          </form>
        </section>

        {/* Borang belanja */}
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-slate-900">Rekod Perbelanjaan</h2>
          <form action={tambahBelanja} className="space-y-3">
            <select name="kategori_id" required className="inp">
              {(katB.data ?? []).map((k: any) => (
                <option key={k.id} value={k.id}>{k.nama}</option>
              ))}
            </select>
            <input name="jumlah" type="number" step="0.01" min="0.01" placeholder="Jumlah (RM)" required className="inp" />
            <input name="keterangan" placeholder="Keterangan" required className="inp" />
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" name="dari_khairat" /> Keluar dari tabung khairat
            </label>
            <input name="tarikh" type="date" defaultValue={hariIni()} className="inp" />
            <button className="w-full rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-800">
              Simpan Perbelanjaan
            </button>
          </form>
        </section>
      </div>

      {/* Kutipan terkini */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Kutipan Terkini</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Resit</th>
                <th className="px-4 py-2">Tarikh</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Ahli</th>
                <th className="px-4 py-2 text-right">Jumlah</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {kutipan.slice(0, 15).map((k) => (
                <tr key={k.id} className="border-b last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">{k.no_resit}</td>
                  <td className="px-4 py-2">{tarikhMs(k.tarikh)}</td>
                  <td className="px-4 py-2">{k.kategori?.nama}</td>
                  <td className="px-4 py-2">{k.ahli?.nama ?? "—"}</td>
                  <td className="px-4 py-2 text-right font-medium">{rm(k.jumlah)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <Link href={`/admin/kewangan/resit/${k.id}`} target="_blank" className="text-xs font-semibold text-surau hover:underline">
                        Resit
                      </Link>
                      <form action={padamKutipan}>
                        <input type="hidden" name="id" value={k.id} />
                        <button className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {kutipan.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Tiada kutipan lagi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Belanja terkini */}
      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Perbelanjaan Terkini</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">Tarikh</th>
                <th className="px-4 py-2">Kategori</th>
                <th className="px-4 py-2">Keterangan</th>
                <th className="px-4 py-2">Tabung</th>
                <th className="px-4 py-2 text-right">Jumlah</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {belanja.slice(0, 15).map((b) => (
                <tr key={b.id} className="border-b last:border-0">
                  <td className="px-4 py-2">{tarikhMs(b.tarikh)}</td>
                  <td className="px-4 py-2">{b.kategori?.nama}</td>
                  <td className="px-4 py-2">{b.keterangan}</td>
                  <td className="px-4 py-2">{b.dari_khairat ? "Khairat" : "Am"}</td>
                  <td className="px-4 py-2 text-right font-medium text-red-600">{rm(b.jumlah)}</td>
                  <td className="px-4 py-2 text-right">
                    <form action={padamBelanja}>
                      <input type="hidden" name="id" value={b.id} />
                      <button className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
                    </form>
                  </td>
                </tr>
              ))}
              {belanja.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400">Tiada perbelanjaan lagi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <style>{inpStyle}</style>
    </div>
  );
}

const inpStyle = `.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#0f766e;box-shadow:0 0 0 2px rgba(15,118,110,.2)}`;

function Stat({ label, nilai, warna }: { label: string; nilai: string; warna: string }) {
  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className={`text-xl font-bold ${warna}`}>{nilai}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function Perlu() {
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      Supabase belum dikonfigurasi. Set kunci dalam persekitaran.
    </div>
  );
}
