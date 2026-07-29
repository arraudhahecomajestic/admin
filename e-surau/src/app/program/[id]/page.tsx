import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import ButangHantar from "@/components/ButangHantar";
import { rsvpProgram } from "../actions";

export const dynamic = "force-dynamic";

export default async function JemputanProgramPage({ params }: { params: { id: string } }) {
  if (!adminConfigured)
    return <p className="text-center text-slate-500">Sistem belum dikonfigurasi.</p>;

  const db = createAdminClient();
  const { data } = await db.from("program").select("*, rsvp(bil_orang)").eq("id", params.id).single();
  if (!data) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-slate-500">Jemputan tidak dijumpai atau telah ditarik balik.</p>
        <Link href="/" className="mt-4 inline-block text-sm text-surau hover:underline">← Laman utama</Link>
      </div>
    );
  }
  const p: any = data;
  const jumRsvp = (p.rsvp ?? []).reduce((s: number, r: any) => s + Number(r.bil_orang || 0), 0);
  const penuh = p.had_peserta ? jumRsvp >= Number(p.had_peserta) : false;

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <article className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="bg-surau/10 px-6 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-surau">Jemputan · Surau Ar-Raudhah, Eco Majestic</p>
        </div>
        <div className="space-y-3 p-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900">{p.tajuk}</h1>
            {p.kategori && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{p.kategori}</span>}
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <div>🗓️ {tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}</div>
            {p.lokasi && <div>📍 {p.lokasi}</div>}
            <div>🙋 {jumRsvp} akan hadir{p.had_peserta ? ` / ${p.had_peserta}` : ""}</div>
          </div>
          {p.keterangan && <p className="whitespace-pre-line border-t pt-3 text-sm text-slate-700">{p.keterangan}</p>}

          {p.rsvp_dibuka && !penuh ? (
            <form action={rsvpProgram} className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-800">Sahkan Kehadiran (RSVP)</div>
              <input type="hidden" name="program_id" value={p.id} />
              <input name="nama" required placeholder="Nama anda" className="inp" />
              <input name="telefon" placeholder="No. telefon (WhatsApp)" className="inp" />
              <input name="bil_orang" type="number" min="1" defaultValue={1} title="Bilangan orang" className="inp" />
              <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Sahkan Kehadiran →</ButangHantar>
            </form>
          ) : (
            <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              {penuh ? "Pendaftaran telah penuh. Terima kasih." : "Pendaftaran ditutup."}
            </p>
          )}
        </div>
      </article>

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Laman utama</Link>
      </p>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
