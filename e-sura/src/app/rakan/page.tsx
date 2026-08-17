import Link from "next/link";
import { redirect } from "next/navigation";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { NAMA_SURAU } from "@/lib/tetapan";
import { penajaDipapar } from "@/lib/tetapanSistem";
import { getProfil, isMaster } from "@/lib/sesi";
import SalinKod from "@/components/SalinKod";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Rakan Surau — Direktori & Tawaran",
  description: "Direktori perniagaan rakan penaja Surau Ar Raudhah & tawaran eksklusif untuk ahli kariah.",
};

function waLink(tel: string | null): string | null {
  const d = (tel || "").replace(/\D/g, "");
  if (!d) return null;
  const n = d.startsWith("0") ? "60" + d.slice(1) : d.startsWith("60") ? d : "60" + d;
  return `https://wa.me/${n}`;
}

export default async function RakanPage() {
  const [dipapar, profil] = await Promise.all([penajaDipapar(), getProfil()]);
  const preview = !dipapar && isMaster(profil);
  // Belum dilancarkan & bukan super admin → sorok.
  if (!dipapar && !preview) redirect("/");

  let senarai: any[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_penaja_aktif").select("*");
    senarai = (data as any[]) ?? [];
  }

  const tawaranAda = senarai.filter((p) => p.tawaran);
  const kategoriMap = new Map<string, any[]>();
  for (const p of senarai) {
    const k = (p.kategori || "Lain-lain").trim() || "Lain-lain";
    if (!kategoriMap.has(k)) kategoriMap.set(k, []);
    kategoriMap.get(k)!.push(p);
  }
  const kategori = [...kategoriMap.entries()];

  return (
    <div className="space-y-8">
      {preview && (
        <div className="rounded-lg bg-amber-400/90 px-4 py-2 text-sm font-semibold text-teal-900">
          PRATONTON SUPER ADMIN — Rakan Surau belum dilancarkan. Orang lain tidak nampak. Flip suis Penaja di /admin/tetapan bila sedia.
        </div>
      )}

      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-surau to-surau-dark p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-2xl font-extrabold sm:text-3xl">Rakan Surau {NAMA_SURAU.includes("Ar Raudhah") ? "Ar Raudhah" : ""}</h1>
        <p className="mt-2 max-w-2xl text-sm text-amber-50 sm:text-base">
          Perniagaan yang menyokong surau kita. Sokong mereka kembali — dan nikmati tawaran eksklusif untuk ahli kariah. Semoga rezeki semua diberkati.
        </p>
      </section>

      {senarai.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">Belum ada rakan penaja disenaraikan.</p>
      )}

      {/* Tawaran eksklusif ahli */}
      {tawaranAda.length > 0 && (
        <section>
          <h2 className="mb-1 text-xl font-bold text-slate-900">Tawaran Eksklusif Ahli Kariah</h2>
          <p className="mb-4 text-sm text-slate-600">Tunjukkan anda ahli kariah atau guna kod promo di bawah.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {tawaranAda.map((p) => (
              <div key={p.id} className="rounded-xl border-2 border-surau/30 bg-surau/5 p-4">
                <div className="flex items-center gap-3">
                  {p.logo_url ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={p.logo_url} alt={p.nama} className="h-10 w-auto max-w-[72px] rounded border bg-white object-contain" />
                  ) : null}
                  <div className="font-semibold text-slate-900">{p.nama}</div>
                </div>
                <div className="mt-2 text-sm font-medium text-surau-dark">{p.tawaran}</div>
                {p.kod_promo && <div className="mt-2"><SalinKod kod={p.kod_promo} /></div>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Direktori ikut kategori */}
      {kategori.map(([nama, senaraiKat]) => (
        <section key={nama}>
          <h2 className="mb-3 text-lg font-bold text-slate-900">{nama}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {senaraiKat.map((p) => {
              const wa = waLink(p.telefon);
              return (
                <div key={p.id} className="flex flex-col rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {p.logo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={p.logo_url} alt={p.nama} className="h-12 w-auto max-w-[84px] rounded border object-contain" />
                    ) : (
                      <div className="flex h-12 w-16 items-center justify-center rounded border bg-slate-50 text-xs text-slate-400">{p.nama.slice(0, 2)}</div>
                    )}
                    <div className="font-semibold text-slate-900">{p.nama}</div>
                  </div>
                  {p.keterangan && <p className="mt-2 flex-1 text-sm text-slate-600">{p.keterangan}</p>}
                  {p.tawaran && (
                    <div className="mt-2 rounded-lg bg-surau/5 px-2 py-1 text-xs font-semibold text-surau-dark">{p.tawaran}</div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wa && (
                      <a href={wa} target="_blank" rel="noopener noreferrer sponsored" className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">
                        WhatsApp
                      </a>
                    )}
                    {p.pautan && (
                      <a href={p.pautan} target="_blank" rel="noopener noreferrer sponsored" className="rounded-lg border border-surau/40 px-3 py-1.5 text-xs font-semibold text-surau hover:bg-surau/10">
                        Lawati →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <section className="rounded-2xl bg-slate-50 p-6 text-center">
        <h2 className="text-lg font-bold text-slate-900">Nak jadi Rakan Surau?</h2>
        <p className="mx-auto mt-1 max-w-xl text-sm text-slate-600">
          Sokong aktiviti surau &amp; capai komuniti Eco Majestic. Hubungi Setiausaha Surau di arraudhah.ecomajestic@gmail.com untuk pakej tajaan.
        </p>
      </section>

      <p className="text-center">
        <Link href="/" className="text-sm text-slate-500 hover:underline">← Kembali ke laman utama</Link>
      </p>
    </div>
  );
}
