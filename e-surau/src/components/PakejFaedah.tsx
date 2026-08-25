import { PAKEJ_PENAJA } from "@/lib/tetapan";
import { FAEDAH_PENAJA } from "@/lib/penaja";
import { rm } from "@/lib/format";

// Jadual perbandingan faedah pakej penaja (statik).
export default function PakejFaedah() {
  const kol = ["direktori", "gangsa", "perak", "emas"];
  const harga: Record<string, number> = Object.fromEntries(PAKEJ_PENAJA.map((p) => [p.kod, p.harga_bulan]));
  const nama: Record<string, string> = Object.fromEntries(PAKEJ_PENAJA.map((p) => [p.kod, p.nama]));

  const sel = (v: boolean | string) =>
    typeof v === "string"
      ? <span className="text-xs font-bold text-surau-dark">{v}</span>
      : v
      ? <span className="font-bold text-emerald-600">&#10003;</span>
      : <span className="text-slate-300">&mdash;</span>;

  return (
    <div className="overflow-x-auto rounded-2xl bg-white p-4 shadow-sm sm:p-5">
      <h2 className="text-base font-bold text-slate-900">Pakej Rakan Surau &mdash; Apa Anda Dapat</h2>
      <p className="mb-3 mt-0.5 text-xs text-slate-500">Semua bayaran menyokong kos operasi sistem e-Surau &amp; pembangunan surau.</p>
      <table className="w-full min-w-[520px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="p-2 text-left text-slate-700">Faedah</th>
            {kol.map((k) => (
              <th key={k} className={`p-2 text-center ${k === "emas" ? "rounded-t-lg bg-surau text-white" : "text-slate-900"}`}>
                {nama[k]?.replace(" Rakan Surau", "")}
                <span className={`block text-[11px] font-bold ${k === "emas" ? "text-amber-100" : "text-surau-dark"}`}>{rm(harga[k])}/bln</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FAEDAH_PENAJA.map((f, i) => (
            <tr key={i} className="border-t border-slate-100">
              <td className="p-2 text-slate-700">{f.label}</td>
              {kol.map((k) => (
                <td key={k} className={`p-2 text-center ${k === "emas" ? "bg-surau/5" : ""}`}>{sel(f.nilai[k])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
