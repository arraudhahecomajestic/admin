import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import { tarikhMs } from "@/lib/format";
import { kemasProgram } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditProgramPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("program").select("*").eq("id", params.id).single();
  if (!data) return <p className="text-slate-500">Program tidak dijumpai.</p>;
  const p: any = data;

  const { data: rsvpData } = await db
    .from("rsvp")
    .select("nama, telefon, bil_orang, dicipta")
    .eq("program_id", params.id)
    .order("dicipta", { ascending: true });
  const rsvp = (rsvpData as any[]) ?? [];
  const jumlahHadir = rsvp.reduce((s, r) => s + Number(r.bil_orang || 0), 0);

  const wa = (tel: string | null) => {
    let d = (tel || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.startsWith("60")) d = d.slice(2);
    if (d.startsWith("0")) d = d.slice(1);
    return d ? "60" + d : "";
  };

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/program" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <div>
        <Link href="/admin/program" className="text-sm text-slate-500 hover:underline">← Senarai program</Link>
        <h1 className="text-2xl font-bold text-slate-900">Edit Program</h1>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <form action={kemasProgram} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={p.id} />
          <input name="tajuk" required defaultValue={p.tajuk ?? ""} placeholder="Tajuk program *" className="inp sm:col-span-2" />
          <input name="kategori" defaultValue={p.kategori ?? ""} placeholder="Kategori (Kelas, Ceramah, Gotong-royong)" className="inp" />
          <input name="lokasi" defaultValue={p.lokasi ?? ""} placeholder="Lokasi" className="inp" />
          <input name="tarikh" type="date" required defaultValue={p.tarikh ?? ""} className="inp" />
          <input name="masa" defaultValue={p.masa ?? ""} placeholder="Masa (cth: 8:30 malam)" className="inp" />
          <input name="had_peserta" type="number" min="1" defaultValue={p.had_peserta ?? ""} placeholder="Had peserta (kosong = tiada had)" className="inp" />
          <textarea name="keterangan" rows={3} defaultValue={p.keterangan ?? ""} placeholder="Keterangan / butiran program" className="inp sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="rsvp_dibuka" defaultChecked={p.rsvp_dibuka} /> Buka pendaftaran (RSVP)</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="diterbitkan" defaultChecked={p.diterbitkan} /> Terbitkan di laman (senarai awam)</label>
          <div className="sm:col-span-2 flex gap-3">
            <button className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Simpan Perubahan</button>
            <Link href="/admin/program" className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">Batal</Link>
          </div>
        </form>
        <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          <b>Nota:</b> Untuk jemputan tertutup, biar <b>&quot;Terbitkan di laman&quot;</b> tidak bertanda — program tak akan muncul dalam senarai awam,
          tetapi masih boleh dibuka & RSVP melalui pautan jemputan yang kau kongsi.
        </p>
      </section>

      {/* Senarai RSVP / Kehadiran */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b px-5 py-3">
          <h2 className="font-semibold text-slate-900">Senarai RSVP / Akan Hadir</h2>
          <div className="flex items-center gap-2 text-sm">
            <span className="rounded-lg bg-surau/10 px-3 py-1 font-semibold text-surau">{rsvp.length} pendaftaran</span>
            <span className="rounded-lg bg-green-100 px-3 py-1 font-semibold text-green-700">{jumlahHadir} orang{p.had_peserta ? ` / ${p.had_peserta}` : ""}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Nama</th>
                <th className="px-4 py-2">Telefon</th>
                <th className="px-4 py-2 text-center">Bil. Orang</th>
                <th className="px-4 py-2">Tarikh Daftar</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {rsvp.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">Belum ada pendaftaran kehadiran.</td></tr>
              )}
              {rsvp.map((r, i) => {
                const w = wa(r.telefon);
                return (
                  <tr key={i} className="border-b last:border-0">
                    <td className="px-4 py-2 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-2 font-medium text-slate-800">{r.nama}</td>
                    <td className="px-4 py-2">{r.telefon || "—"}</td>
                    <td className="px-4 py-2 text-center">{r.bil_orang}</td>
                    <td className="px-4 py-2 text-slate-500">{tarikhMs(r.dicipta)}</td>
                    <td className="px-4 py-2 text-right">
                      {w && <a href={`https://wa.me/${w}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</a>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
