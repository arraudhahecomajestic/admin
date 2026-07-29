import Link from "next/link";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { PerluMasuk, TiadaAkses } from "@/components/PerluMasuk";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import AdminNav from "@/components/AdminNav";
import KongsiProgram from "@/components/KongsiProgram";
import ButangHantar from "@/components/ButangHantar";
import { tarikhMs } from "@/lib/format";
import { tambahProgram, padamProgram } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProgramAdminPage() {
  if (!adminConfigured)
    return <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">Supabase belum dikonfigurasi.</div>;
  const profil = await getProfil();
  if (!profil) return <PerluMasuk />;
  if (!isPentadbir(profil)) return <TiadaAkses />;

  const db = createAdminClient();
  const { data } = await db.from("program").select("*, rsvp(bil_orang)").order("tarikh", { ascending: false }).limit(200);
  const program = (data as any[]) ?? [];

  return (
    <div className="space-y-6">
      <AdminNav aktif="/admin/program" nama={profil.nama ?? profil.emel ?? undefined} peranan={profil.peranan} master={profil.master} />
      <h1 className="text-2xl font-bold text-slate-900">Program & Aktiviti</h1>

      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Tambah Program</h2>
        <form action={tambahProgram} className="grid gap-3 sm:grid-cols-2">
          <input name="tajuk" required placeholder="Tajuk program *" className="inp sm:col-span-2" />
          <input name="kategori" placeholder="Kategori (Kelas, Ceramah, Gotong-royong)" className="inp" />
          <input name="lokasi" placeholder="Lokasi" className="inp" />
          <input name="tarikh" type="date" required className="inp" />
          <input name="masa" placeholder="Masa (cth: 8:30 malam)" className="inp" />
          <input name="had_peserta" type="number" min="1" placeholder="Had peserta (kosong = tiada had)" className="inp" />
          <textarea name="keterangan" rows={2} placeholder="Keterangan / butiran program" className="inp sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="rsvp_dibuka" defaultChecked /> Buka pendaftaran (RSVP)</label>
          <label className="flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="diterbitkan" defaultChecked /> Terbitkan di laman</label>
          <div className="sm:col-span-2">
            <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Simpan Program</ButangHantar>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white shadow-sm">
        <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Senarai Program</h2>
        <div className="divide-y">
          {program.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada program lagi.</p>}
          {program.map((p) => {
            const jumRsvp = (p.rsvp ?? []).reduce((s: number, r: any) => s + Number(r.bil_orang || 0), 0);
            return (
              <div key={p.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{p.tajuk}</span>
                    {!p.diterbitkan && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">Draf</span>}
                    {p.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs text-surau">{p.kategori}</span>}
                  </div>
                  <div className="text-xs text-slate-500">{tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}{p.lokasi ? ` · ${p.lokasi}` : ""}</div>
                  <div className="mt-1 text-xs text-slate-600">RSVP: <b>{jumRsvp}</b>{p.had_peserta ? ` / ${p.had_peserta}` : ""}</div>
                  <div className="mt-2">
                    <KongsiProgram id={p.id} tajuk={p.tajuk} tarikhLabel={tarikhMs(p.tarikh)} masa={p.masa} lokasi={p.lokasi} />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link href={`/admin/program/${p.id}`} className="text-xs font-semibold text-surau hover:underline">Butiran / RSVP</Link>
                  <form action={padamProgram}>
                    <input type="hidden" name="id" value={p.id} />
                    <button className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
