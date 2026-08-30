import Link from "next/link";
import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { tarikhMs } from "@/lib/format";
import BorangDaftarProgram from "@/components/BorangDaftarProgram";
import BorangDaftarProgramManual from "@/components/BorangDaftarProgramManual";
import SumbangProgramForm from "@/components/SumbangProgramForm";
import BorangRsvpProgram from "@/components/BorangRsvpProgram";
import { bayaranOnlineDibuka } from "@/lib/tetapanSistem";

export const dynamic = "force-dynamic";

export default async function JemputanProgramPage({ params, searchParams }: { params: { id: string }; searchParams: { rsvp?: string; bayar?: string; sumbang?: string } }) {
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
  let jumTempat = jumHadir; // untuk kiraan penuh (elak overbook)
  if (p.berbayar) {
    // "Hadir" = peserta yang bayaran DAH DISAHKAN (dibayar) sahaja.
    // Tempat (penuh) = dibayar + menunggu sahkan (yang sudah bayar & tunggu semakan tetap pegang tempat).
    const { data: pd } = await db.from("program_pendaftaran").select("bilangan, status_bayar").eq("program_id", p.id).in("status_bayar", ["dibayar", "menunggu_sah"]);
    const rows = (pd as any[]) ?? [];
    jumHadir = rows.filter((r) => r.status_bayar === "dibayar").reduce((s, r) => s + Number(r.bilangan || 1), 0);
    jumTempat = rows.reduce((s, r) => s + Number(r.bilangan || 1), 0);
  }
  const penuh = p.had_peserta ? jumTempat >= Number(p.had_peserta) : false;
  // Suis 'bayaran_online' (tetapan sistem) — lalai OFF: guna borang bayar manual
  // + upload resit. Tukar ON dalam Tetapan hanya bila CHIP betul-betul go live.
  const bayaranOnline = await bayaranOnlineDibuka();

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

          {!p.berbayar && searchParams.rsvp === "ok" && (
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
          {searchParams.sumbang === "ok" && (
            <div className="mt-2 rounded-xl border-2 border-green-500 bg-green-50 p-5 text-center">
              <div className="text-3xl">✓</div>
              <div className="mt-1 text-lg font-bold text-green-700">Terima kasih atas sumbangan anda!</div>
              <div className="mt-1 text-sm text-green-700">Resit dihantar ke e-mel anda. Semoga Allah membalas kebaikan anda.</div>
            </div>
          )}
          {searchParams.sumbang === "gagal" && (
            <div className="mt-2 rounded-xl border-2 border-red-300 bg-red-50 p-4 text-center text-sm font-semibold text-red-700">
              Sumbangan tidak berjaya atau dibatalkan. Sila cuba semula.
            </div>
          )}

          {p.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.poster_url} alt={`Poster ${p.tajuk}`} className="mt-2 w-full rounded-xl border border-slate-200 object-cover" />
          )}

          {p.rsvp_dibuka && !penuh ? (
            p.berbayar ? (
              bayaranOnline
                ? <BorangDaftarProgram programId={p.id} yuran={Number(p.yuran || 0)} />
                : <BorangDaftarProgramManual programId={p.id} yuran={Number(p.yuran || 0)} tajuk={p.tajuk} rujBayar={p.ruj_bayar} />
            ) : (
              <BorangRsvpProgram
                programId={p.id}
                bayaranDibuka={bayaranOnline}
                sumbanganDibuka={!!p.sumbangan_dibuka}
                sumbanganNota={p.sumbangan_nota}
                rsvpOk={searchParams.rsvp === "ok"}
              />
            )
          ) : (
            <p className="mt-2 rounded-lg bg-slate-50 p-4 text-sm text-slate-500">
              {penuh ? "Pendaftaran telah penuh. Terima kasih." : "Pendaftaran ditutup."}
            </p>
          )}

          {/* Sumbangan berdiri sendiri — bila TIDAK dalam borang RSVP percuma (cth berbayar / RSVP tutup / penuh) */}
          {p.sumbangan_dibuka && (p.berbayar || !p.rsvp_dibuka || penuh) && (
            <SumbangProgramForm programId={p.id} nota={p.sumbangan_nota} bayaranDibuka={bayaranOnline} />
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
