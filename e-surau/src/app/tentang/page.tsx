import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";
import { NAMA_SURAU } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";
import { bahasaSemasa } from "@/lib/bahasa";
import { buatT } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function TentangPage() {
  const tr = buatT(bahasaSemasa());
  let visi = "", misi = "", carta: any[] = [], buletin: any[] = [];
  if (adminConfigured) {
    const db = createAdminClient();
    const [{ data: kv }, { data: c }, { data: b }] = await Promise.all([
      db.from("kandungan_surau").select("kunci, nilai"),
      db.from("carta_organisasi").select("jawatan, nama, gambar_url, susunan").eq("aktif", true).order("susunan"),
      db.from("buletin").select("tajuk, keterangan, url_fail, jenis_fail, tarikh").eq("diterbitkan", true).order("tarikh", { ascending: false }).limit(30),
    ]);
    const map: Record<string, string> = {};
    for (const r of (kv as any[]) ?? []) map[r.kunci] = r.nilai ?? "";
    visi = map.visi ?? ""; misi = map.misi ?? "";
    carta = (c as any[]) ?? []; buletin = (b as any[]) ?? [];
  }
  const misiPoin = misi.split("\n").map((s) => s.trim()).filter(Boolean);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{tr("Tentang", "About")} {NAMA_SURAU}</h1>
      </div>

      {/* Visi & Misi */}
      {(visi || misiPoin.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          {visi && (
            <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
              <h2 className="mb-2 font-bold text-surau">{tr("Visi", "Vision")}</h2>
              <p className="whitespace-pre-wrap text-slate-700">{visi}</p>
            </div>
          )}
          {misiPoin.length > 0 && (
            <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
              <h2 className="mb-2 font-bold text-surau">{tr("Misi", "Mission")}</h2>
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                {misiPoin.map((m, i) => <li key={i}>{m}</li>)}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Carta Organisasi */}
      {carta.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{tr("Carta Organisasi", "Organisation Chart")}</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {carta.map((c, i) => (
              <div key={i} className="rounded-xl bg-white p-4 text-center shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {c.gambar_url
                  ? <img src={c.gambar_url} alt={c.nama ?? c.jawatan} className="mx-auto h-20 w-20 rounded-full object-cover" />
                  : <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-surau/10 text-2xl text-surau">👤</div>}
                <div className="mt-2 text-sm font-bold text-slate-900">{c.nama || "—"}</div>
                <div className="text-xs font-medium text-surau">{c.jawatan}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Buletin */}
      {buletin.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold text-slate-900">{tr("Buletin Surau", "Surau Bulletin")}</h2>
          <div className="space-y-3">
            {buletin.map((b, i) => (
              <article key={i} className="rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-900">{b.tajuk}</h3>
                    <div className="text-xs text-slate-500">{tarikhMs(b.tarikh)}</div>
                    {b.keterangan && <p className="mt-1 text-sm text-slate-600">{b.keterangan}</p>}
                  </div>
                  {b.url_fail && (
                    <a href={b.url_fail} target="_blank" rel="noreferrer" className="shrink-0 rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">
                      {b.jenis_fail === "pdf" ? tr("Buka PDF", "Open PDF") : tr("Lihat", "View")}
                    </a>
                  )}
                </div>
                {b.url_fail && b.jenis_fail === "imej" && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.url_fail} alt={b.tajuk} className="mt-3 max-h-96 w-auto rounded-lg" />
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {!visi && !misiPoin.length && carta.length === 0 && buletin.length === 0 && (
        <p className="rounded-lg bg-white p-4 text-sm text-slate-500 shadow-sm">{tr("Maklumat akan dikemas kini tidak lama lagi.", "Information will be updated soon.")}</p>
      )}
    </div>
  );
}
