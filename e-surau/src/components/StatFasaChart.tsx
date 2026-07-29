// Graf bar bilangan ahli kariah berdaftar ikut fasa (server-rendered, tiada JS).
export default function StatFasaChart({
  data, total, tajuk, nota,
}: {
  data: { nama: string; bil: number }[];
  total: number;
  tajuk: string;
  nota: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.bil));
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold text-slate-900">{tajuk}</h2>
        <div className="text-right">
          <div className="text-2xl font-extrabold text-surau">{total}</div>
          <div className="text-xs text-slate-500">jumlah ahli berdaftar</div>
        </div>
      </div>
      <div className="mt-4 space-y-2.5">
        {data.map((d) => {
          const pct = d.bil ? Math.max((d.bil / max) * 100, 5) : 0;
          return (
            <div key={d.nama} className="flex items-center gap-3">
              <div className="w-28 shrink-0 text-sm font-medium text-slate-700 sm:w-32">{d.nama}</div>
              <div className="relative h-6 flex-1 overflow-hidden rounded-md bg-slate-100">
                <div
                  className="flex h-full items-center justify-end rounded-md bg-gradient-to-r from-surau to-surau-dark pr-2 transition-all"
                  style={{ width: `${pct}%` }}
                >
                  {d.bil > 0 && pct > 18 && <span className="text-xs font-bold text-white">{d.bil}</span>}
                </div>
                {(d.bil === 0 || pct <= 18) && (
                  <span className="absolute inset-y-0 right-2 flex items-center text-xs font-bold text-slate-500">{d.bil}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-4 text-xs text-slate-400">{nota}</p>
    </section>
  );
}
