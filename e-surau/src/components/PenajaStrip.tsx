import { supabase, supabaseConfigured } from "@/lib/supabaseClient";

// pratonton = true → tunjuk contoh logo jika belum ada penaja (untuk admin lihat hasil).
export default async function PenajaStrip({ pratonton = false }: { pratonton?: boolean }) {
  let penaja: any[] = [];
  if (supabaseConfigured) {
    const { data } = await supabase.from("v_penaja_aktif").select("*");
    penaja = (data as any[]) ?? [];
  }

  let contoh = false;
  if (penaja.length === 0) {
    if (!pratonton) return null;
    contoh = true;
    penaja = [
      { id: "c1", nama: "Kedai Runcit Pak Mat" },
      { id: "c2", nama: "Restoran Nasi Kandar EcoM" },
      { id: "c3", nama: "Klinik Ar-Rahman" },
      { id: "c4", nama: "Bakeri Manis Sdn Bhd" },
      { id: "c5", nama: "Enterprise Barakah" },
    ];
  }

  // Gandakan supaya gelung berjalan tanpa jurang
  const senarai = [...penaja, ...penaja];

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Laman ini dikuasakan oleh:</h2>
        <span className="text-xs text-slate-400">
          {pratonton ? "👁️ Pratonton staf — orang ramai tak nampak" : contoh ? "Contoh" : "Tajaan"}
        </span>
      </div>

      <div className="penaja-marquee">
        <div className="penaja-track">
          {senarai.map((p, i) => (
            <PenajaItem key={i} p={p} />
          ))}
        </div>
      </div>

      <style>{`
        .penaja-marquee { overflow: hidden; position: relative; -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
        .penaja-track { display: flex; align-items: center; gap: 2rem; width: max-content; animation: penaja-scroll 28s linear infinite; }
        .penaja-marquee:hover .penaja-track { animation-play-state: paused; }
        @keyframes penaja-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>
    </section>
  );
}

function PenajaItem({ p }: { p: any }) {
  const inner = (
    <div className="flex h-16 w-36 shrink-0 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 p-2">
      {p.logo_url
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.logo_url} alt={p.nama} className="max-h-12 max-w-full object-contain" />
        : <span className="text-center text-xs font-semibold text-slate-600">{p.nama}</span>}
    </div>
  );
  return p.pautan ? (
    <a href={p.pautan} target="_blank" rel="noopener noreferrer sponsored" title={p.nama}>{inner}</a>
  ) : inner;
}
