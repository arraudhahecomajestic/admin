import { tarikhMs } from "@/lib/format";

type Tempahan = {
  id: string;
  tarikh_acara: string;
  masa_mula: string | null;
  masa_tamat: string | null;
  nama_program: string | null;
  ruang: any;
  status: string;
};

const HARI = ["Ah", "Is", "Se", "Ra", "Kh", "Ju", "Sa"];
const NAMA_BULAN = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

function bulanGrid(tahun: number, bulan: number, ditempah: Set<string>) {
  const pertama = new Date(tahun, bulan, 1);
  const mulaHari = pertama.getDay();
  const jumHari = new Date(tahun, bulan + 1, 0).getDate();
  const sel: (number | null)[] = [];
  for (let i = 0; i < mulaHari; i++) sel.push(null);
  for (let d = 1; d <= jumHari; d++) sel.push(d);
  const kunci = (d: number) => `${tahun}-${String(bulan + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return { sel, kunci };
}

export default function KalendarSewaan({ tempahan }: { tempahan: Tempahan[] }) {
  const ditempah = new Set(tempahan.map((t) => String(t.tarikh_acara)));
  const now = new Date();
  const bulanIni = { t: now.getFullYear(), b: now.getMonth() };
  const depan = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const bulanDepan = { t: depan.getFullYear(), b: depan.getMonth() };
  const bulanList = [bulanIni, bulanDepan];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {bulanList.map(({ t, b }) => {
          const { sel, kunci } = bulanGrid(t, b, ditempah);
          return (
            <div key={`${t}-${b}`} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="mb-2 text-center font-semibold text-slate-900">{NAMA_BULAN[b]} {t}</div>
              <div className="grid grid-cols-7 gap-1 text-center text-xs">
                {HARI.map((h) => <div key={h} className="py-1 font-semibold text-slate-400">{h}</div>)}
                {sel.map((d, i) => {
                  if (d === null) return <div key={i} />;
                  const ada = ditempah.has(kunci(d));
                  return (
                    <div key={i} className={`rounded py-1.5 ${ada ? "bg-surau text-white font-semibold" : "text-slate-600"}`}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <span className="inline-block h-3 w-3 rounded bg-surau"></span> Tarikh telah ada tempahan
      </div>

      <div className="rounded-xl bg-white shadow-sm">
        <h3 className="border-b px-4 py-2 text-sm font-semibold text-slate-900">Tempahan Akan Datang</h3>
        <div className="divide-y">
          {tempahan.length === 0 && <p className="px-4 py-4 text-sm text-slate-400">Tiada tempahan akan datang.</p>}
          {tempahan.map((t) => {
            const ruang = Array.isArray(t.ruang) ? t.ruang.map((r: any) => r.nama).join(", ") : "";
            return (
              <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm">
                <div>
                  <span className="font-medium text-slate-800">{tarikhMs(t.tarikh_acara)}</span>
                  {t.masa_mula ? <span className="text-slate-500"> · {t.masa_mula}{t.masa_tamat ? `–${t.masa_tamat}` : ""}</span> : null}
                  <div className="text-xs text-slate-500">{t.nama_program || "—"}{ruang ? ` · ${ruang}` : ""}</div>
                </div>
                <span className={`rounded px-2 py-0.5 text-xs font-semibold ${t.status === "lulus" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {t.status === "lulus" ? "Disahkan" : "Menunggu"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
