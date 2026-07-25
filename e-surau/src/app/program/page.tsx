import Link from "next/link";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { tarikhMs } from "@/lib/format";
import { rsvpProgram } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  let program: any[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_program_awam").select("*");
    program = (data as any[]) ?? [];
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Program & Aktiviti Surau</h1>
        <p className="mt-1 text-sm text-slate-600">Sertai program akan datang. Daftar kehadiran anda di bawah.</p>
      </div>

      {program.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">Tiada program akan datang buat masa ini.</p>
      )}

      <div className="space-y-4">
        {program.map((p) => {
          const penuh = p.had_peserta ? Number(p.jumlah_rsvp) >= Number(p.had_peserta) : false;
          return (
            <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{p.tajuk}</h2>
                    {p.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{p.kategori}</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    📅 {tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}{p.lokasi ? ` · 📍 ${p.lokasi}` : ""}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {p.jumlah_rsvp} hadir{p.had_peserta ? ` / ${p.had_peserta}` : ""}
                </div>
              </div>

              {p.keterangan && <p className="mt-2 text-sm text-slate-600">{p.keterangan}</p>}

              {p.rsvp_dibuka && !penuh ? (
                <form action={rsvpProgram} className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
                  <input type="hidden" name="program_id" value={p.id} />
                  <input name="nama" required placeholder="Nama anda" className="inp sm:col-span-2" />
                  <input name="telefon" placeholder="No. telefon" className="inp" />
                  <input name="bil_orang" type="number" min="1" defaultValue={1} title="Bilangan orang" className="inp" />
                  <div className="sm:col-span-4">
                    <button className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark">Daftar Kehadiran →</button>
                  </div>
                </form>
              ) : (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  {penuh ? "Pendaftaran penuh." : "Pendaftaran ditutup."}
                </p>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
