import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import ButangHantar from "@/components/ButangHantar";
import { rsvpProgram } from "../actions";
import BorangDaftarProgram from "@/components/BorangDaftarProgram";

export const dynamic = "force-dynamic";

export default async function JemputanProgramPage({ params, searchParams }: { params: { id: string }; searchParams: { rsvp?: string; bayar?: string } }) {
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
  let jumHadir = (p.rsvp ?? []).reduce((s: number, r: any) => s + Number(r.bil_orang || 0), 0);
  if (p.berbayar) {
    const { data: pd } = await db.from("program_pendaftaran").select("id").eq("program_id", p.id).eq("status_bayar", "dibayar");
    jumHadir = ((pd as any[]) ?? []).length;
  }
  const penuh = p.had_peserta ? jumHadir >= Number(p.had_peserta) : false;

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
            <div>{tarikhMs(p.tarikh)}{p.masa ? ` · ${p.masa}` : ""}</div>
            {p.lokasi && <div>{p.lokasi}</div>}
            <div>{jumHadir} {p.berbayar ? "peserta berdaftar" : "akan hadir"}{p.had_peserta ? ` / ${p.had_peserta}` : ""}</div>
            {p.berbayar && p.yuran > 0 && <div>Yuran: RM{Number(p.yuran).toFixed(2)}</div>}
          </div>
          {p.keterangan && <p className="whitespace-pre-line border-t pt-3 text-sm text-slate-700">{p.keterangan}</p>}

          {searchParams.rsvp === "ok" && (
            <div className="mt-2 rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
              <div className="text-3xl">✓</div>
              <div className="mt-1 text-lg font-bold text-green-700">Kehadiran anda telah disahkan!</div>
              <div className="mt-1 text-sm text-green-700">Terima kasih. Jumpa anda di majlis, insyaAllah. Anda tidak perlu daftar lagi.</div>
            </div>
          )}
          {searchParams.rsvp === "penuh" && (
            <div className="mt-2 rounded-xl border-2 border-amber-400 bg-amber-50 p-4 text-center text-sm font-semibold text-amber-800">
              Maaf, pendaftaran telah penuh. Terima kasih atas minat anda.
            </div>
          )}
          {searchParams.bayar === "ok" && (
            <div className="mt-2 rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
              <div className="text-3xl">✓</div>
              <div className="mt-1 text-lg font-bold text-green-700">Pendaftaran & bayaran berjaya!</div>
              <div className="mt-1 text-sm text-green-700">Terima kasih. Resit dihantar ke e-mel anda. Jumpa di program, insyaAllah.</div>
            </div>
          )}
          {searchParams.bayar === "gagal" && (
            <div className="mt-2 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
              Bayaran tidak berjaya atau dibatalkan. Sila cuba daftar semula di bawah.
            </div>
          )}

          {p.rsvp_dibuka && !penuh ? (
            p.berbayar ? (
              <BorangDaftarProgram programId={p.id} yuran={Number(p.yuran || 0)} />
            ) : (
              <form action={rsvpProgram} className="mt-2 grid gap-2 rounded-lg bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-800">{searchParams.rsvp === "ok" ? "Kemas kini kehadiran anda" : "Sahkan Kehadiran (RSVP)"}</div>
                <p className="text-xs text-slate-500">Guna nombor telefon yang sama untuk kemas kini — tak akan jadi pendaftaran berganda.</p>
                <input type="hidden" name="program_id" value={p.id} />
                <input name="nama" required placeholder="Nama anda" className="inp" />
                <input name="telefon" placeholder="No. telefon (WhatsApp)" className="inp" />
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-slate-600">Bilangan yang akan hadir (termasuk anda)</span>
                  <input name="bil_orang" type="number" min="1" defaultValue={1} placeholder="cth: 3 orang" title="Bilangan orang yang akan hadir bersama anda" className="inp" />
                  <span className="mt-1 block text-[11px] text-slate-400">Contoh: jika anda hadir bersama pasangan &amp; 2 anak, isi 4.</span>
                </label>
                <ButangHantar className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Sahkan Kehadiran →</ButangHantar>
              </form>
            )
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
