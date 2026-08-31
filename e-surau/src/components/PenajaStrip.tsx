import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

// pratonton = true → tunjuk contoh jika belum ada penaja (untuk admin lihat hasil).
export default async function PenajaStrip({ pratonton = false }: { pratonton?: boolean }) {
  let penaja: any[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_penaja_aktif").select("*");
    // Strip: Emas / Perak / Gangsa (+ lama). Direktori RM20 tak masuk strip.
    penaja = ((data as any[]) ?? []).filter((p) => p.pakej !== "direktori");
  }

  let contoh = false;
  if (penaja.length === 0) {
    if (!pratonton) return null;
    contoh = true;
    penaja = [
      { id: "c1", nama: "Brand Anda Di Sini" },
      { id: "c2", nama: "Brand Anda Di Sini" },
      { id: "c3", nama: "Brand Anda Di Sini" },
      { id: "c4", nama: "Brand Anda Di Sini" },
      { id: "c5", nama: "Brand Anda Di Sini" },
    ];
  }

  // Emas = logo besar, tetap di kiri (tak bergerak). Perak/Gangsa/lama = bergerak.
  const emasList = penaja.filter((p) => p.pakej === "emas");
  const gerakList = penaja.filter((p) => p.pakej !== "emas");
  const gerak = [...gerakList, ...gerakList]; // gandakan untuk gelung tanpa jurang

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Laman ini dikuasakan oleh:</h2>
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/rakan" className="whitespace-nowrap text-xs font-medium text-surau hover:underline">Rakan Surau →</a>
          <span className="hidden text-xs text-slate-400 sm:inline">{pratonton ? "Pratonton" : contoh ? "Contoh" : "Tajaan"}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {emasList.length > 0 && (
          <div className="flex shrink-0 items-center gap-3">
            {emasList.map((p, i) => <PenajaItem key={`e${i}`} p={p} saiz="besar" />)}
          </div>
        )}

        {gerakList.length > 0 && (
          <div className="penaja-marquee flex-1">
            <div className="penaja-track">
              {gerak.map((p, i) => <PenajaItem key={i} p={p} saiz={(p.pakej === "gangsa" || p.pakej === "bulanan") ? "kecil" : "sederhana"} />)}
            </div>
          </div>
        )}
      </div>

      <style>{`
        .penaja-marquee { overflow: hidden; position: relative; -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent); }
        .penaja-track { display: flex; align-items: center; gap: 2rem; width: max-content; animation: penaja-scroll 28s linear infinite; }
        .penaja-marquee:hover .penaja-track { animation-play-state: paused; }
        @keyframes penaja-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}

function PenajaItem({ p, saiz }: { p: any; saiz: "besar" | "sederhana" | "kecil" }) {
  const dim = saiz === "besar" ? "h-20 w-44" : saiz === "sederhana" ? "h-16 w-36" : "h-12 w-28";
  const border = saiz === "besar" ? "border-2 border-surau" : "border border-slate-100";
  const inner = (
    <div className={`flex ${dim} shrink-0 items-center justify-center rounded-lg ${border} bg-slate-50 p-2`}>
      {p.logo_url
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.logo_url} alt={p.nama} className="max-h-full max-w-full object-contain" />
        : <span className="text-center text-xs font-semibold text-slate-600">{p.nama}</span>}
    </div>
  );
  return p.pautan ? (
    <a href={p.pautan} target="_blank" rel="noopener noreferrer sponsored" title={p.nama}>{inner}</a>
  ) : inner;
}
