import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import ButangHantar from "@/components/ButangHantar";
import { rsvpProgram } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProgramPage() {
  let program: any[] = [];
  const hadirMap: Record<string, number> = {};   // berbayar: peserta DAH DISAHKAN (dibayar)
  const tempatMap: Record<string, number> = {};  // berbayar: dibayar + menunggu sahkan (untuk penuh)

  if (adminConfigured) {
    const db = createAdminClient();
    const { data } = await db
      .from("program")
      .select("*, rsvp(bil_orang)")
      .eq("diterbitkan", true)
      .order("tarikh", { ascending: true });
    program = (data as any[]) ?? [];

    const idBerbayar = program.filter((p) => p.berbayar).map((p) => p.id);
    if (idBerbayar.length) {
      const { data: pd } = await db
        .from("program_pendaftaran")
        .select("program_id, bilangan, status_bayar")
        .in("program_id", idBerbayar)
        .in("status_bayar", ["dibayar", "menunggu_sah"]);
      for (const r of (pd as any[]) ?? []) {
        const b = Number(r.bilangan || 1);
        tempatMap[r.program_id] = (tempatMap[r.program_id] ?? 0) + b;
        if (r.status_bayar === "dibayar") hadirMap[r.program_id] = (hadirMap[r.program_id] ?? 0) + b;
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Program & Aktiviti Surau</h1>
        <p className="mt-1 text-sm text-slate-600">Sertai program akan datang. Daftar kehadiran anda di bawah.</p>
      </div>

      {/* Program tetap: Yaasin & Tahlil */}
      <Link href="/tahlil" className="block rounded-xl border-2 border-surau/30 bg-surau/5 p-5 hover:bg-surau/10">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="font-semibold text-slate-900">Yaasin & Tahlil · Malam Jumaat</div>
            <p className="mt-1 text-sm text-slate-600">Program mingguan — hantar nama arwah ahli keluarga untuk dibacakan.</p>
          </div>
          <span className="shrink-0 rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white">Hantar Nama →</span>
        </div>
      </Link>

      {program.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-center text-slate-400 shadow-sm">Tiada program akan datang buat masa ini.</p>
      )}

      <div className="space-y-4">
        {program.map((p) => {
          const jumRsvpPercuma = (p.rsvp ?? []).reduce((s: number, r: any) => s + Number(r.bil_orang || 0), 0);
          const hadir = p.berbayar ? (hadirMap[p.id] ?? 0) : jumRsvpPercuma;
          const tempat = p.berbayar ? (tempatMap[p.id] ?? 0) : jumRsvpPercuma;
          const penuh = p.had_peserta ? tempat >= Number(p.had_peserta) : false;
          return (
            <article key={p.id} className="rounded-xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-slate-900">{p.tajuk}</h2>
                    {p.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{p.kategori}</span>}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}{p.lokasi ? ` · ${p.lokasi}` : ""}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {hadir} hadir{p.had_peserta ? ` / ${p.had_peserta}` : ""}
                </div>
              </div>

              {p.keterangan && <p className="mt-2 text-sm text-slate-600">{p.keterangan}</p>}

              {!p.rsvp_dibuka || penuh ? (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-500">
                  {penuh ? "Pendaftaran penuh." : "Pendaftaran ditutup."}
                </p>
              ) : p.berbayar ? (
                // Program berbayar — hantar ke halaman butiran untuk borang bayar + upload resit.
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-surau/5 p-3">
                  <span className="text-sm text-slate-600">Yuran: <b className="text-surau">RM{Number(p.yuran || 0).toFixed(2)}</b> seorang</span>
                  <Link href={`/program/${p.id}`} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark">Daftar & Bayar →</Link>
                </div>
              ) : (
                <form action={rsvpProgram} className="mt-4 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
                  <input type="hidden" name="program_id" value={p.id} />
                  <input name="nama" required placeholder="Nama anda" className="inp sm:col-span-2" />
                  <input name="telefon" placeholder="No. telefon" className="inp" />
                  <input name="bil_orang" type="number" min="1" defaultValue={1} title="Bilangan orang" className="inp" />
                  <div className="sm:col-span-4">
                    <ButangHantar className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Mendaftar…">Daftar Kehadiran →</ButangHantar>
                  </div>
                </form>
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
