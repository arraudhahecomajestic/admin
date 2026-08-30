"use client";

import { useMemo, useState } from "react";
import { namaKemas, telefonPapar, tarikhMs } from "@/lib/format";
import { tandaHadir, padamRsvp } from "@/app/admin/program/actions";
import ButangHantar from "@/components/ButangHantar";

type Baris = {
  id: string;
  nama: string;
  telefon: string | null;
  bil_orang: number | null;
  dicipta: string;
  hadir?: boolean;
  walk_in?: boolean;
  adalah_ahli?: boolean;
  asal?: string | null;
};

const wa = (tel: string | null) => {
  let d = (tel || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("60")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d ? "60" + d : "";
};

const PER_HALAMAN = 25;

export default function SenaraiRsvp({ rows, programId, boleh }: { rows: Baris[]; programId: string; boleh: boolean }) {
  const [carian, setCarian] = useState("");
  const [hlm, setHlm] = useState(1);

  // Tapis ikut carian (nama / telefon)
  const ditapis = useMemo(() => {
    const q = carian.trim().toLowerCase();
    if (!q) return rows;
    const qd = q.replace(/\D/g, "");
    return rows.filter((r) => {
      const nama = (r.nama || "").toLowerCase();
      const tel = (r.telefon || "").replace(/\D/g, "");
      return nama.includes(q) || (qd.length >= 3 && tel.includes(qd));
    });
  }, [rows, carian]);

  const jumHalaman = Math.max(1, Math.ceil(ditapis.length / PER_HALAMAN));
  const hlmSemasa = Math.min(hlm, jumHalaman);
  const mula = (hlmSemasa - 1) * PER_HALAMAN;
  const halaman = ditapis.slice(mula, mula + PER_HALAMAN);

  const tukarHlm = (n: number) => setHlm(Math.min(Math.max(1, n), jumHalaman));

  return (
    <div>
      {/* Bar carian */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-slate-50/60 px-4 py-3">
        <input
          value={carian}
          onChange={(e) => {
            setCarian(e.target.value);
            setHlm(1);
          }}
          placeholder="Cari nama atau no. telefon…"
          className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau"
        />
        <span className="whitespace-nowrap text-xs text-slate-500">
          {ditapis.length} rekod{carian ? ` (ditapis dari ${rows.length})` : ""}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">#</th>
              <th className="px-4 py-2">Nama</th>
              <th className="px-4 py-2">Telefon</th>
              <th className="px-4 py-2 text-center">Bil. Orang</th>
              <th className="px-4 py-2 text-center">Kehadiran</th>
              <th className="px-4 py-2">Tarikh Daftar</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {ditapis.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  {carian ? "Tiada rekod sepadan dengan carian." : "Belum ada pendaftaran kehadiran."}
                </td>
              </tr>
            )}
            {halaman.map((r, i) => {
              const w = wa(r.telefon);
              return (
                <tr key={r.id} className={`border-b last:border-0 ${r.hadir ? "bg-teal-50/40" : ""}`}>
                  <td className="px-4 py-2 text-slate-400">{mula + i + 1}</td>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span>{namaKemas(r.nama)}</span>
                      {r.walk_in && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Walk-in</span>}
                      {r.hadir && (r.adalah_ahli
                        ? <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-bold text-green-700">Ahli</span>
                        : <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">Bukan ahli</span>)}
                      {r.asal === "tempatan" && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">Tempatan</span>}
                      {r.asal === "luar" && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">Luar</span>}
                    </div>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-600">{telefonPapar(r.telefon)}</td>
                  <td className="px-4 py-2 text-center">{r.bil_orang}</td>
                  <td className="px-4 py-2 text-center">
                    {r.hadir
                      ? <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">✓ Hadir</span>
                      : <span className="text-xs text-slate-400">Belum</span>}
                  </td>
                  <td className="px-4 py-2 text-slate-500">{tarikhMs(r.dicipta)}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {boleh && (
                        <form action={tandaHadir}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="program_id" value={programId} />
                          <input type="hidden" name="hadir" value={r.hadir ? "0" : "1"} />
                          <ButangHantar
                            className={`rounded-lg px-3 py-1 text-xs font-semibold disabled:opacity-50 ${r.hadir ? "border border-slate-300 text-slate-500 hover:bg-slate-50" : "bg-teal-600 text-white hover:bg-teal-700"}`}
                            pendingText="…"
                          >
                            {r.hadir ? "Batal" : "Tanda Hadir"}
                          </ButangHantar>
                        </form>
                      )}
                      {w && <a href={`https://wa.me/${w}`} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</a>}
                      {boleh && (
                        <form action={padamRsvp}>
                          <input type="hidden" name="id" value={r.id} />
                          <input type="hidden" name="program_id" value={programId} />
                          <ButangHantar
                            className="rounded-lg px-3 py-1 text-xs font-semibold text-slate-400 hover:text-red-600 disabled:opacity-50"
                            pendingText="…"
                            konfirmasi={`Padam RSVP "${namaKemas(r.nama)}"?\n\nRekod kehadiran ini akan dibuang terus dan tak boleh dikembalikan.`}
                          >
                            Padam
                          </ButangHantar>
                        </form>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Navigasi halaman */}
      {jumHalaman > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3">
          <span className="text-xs text-slate-500">
            Halaman {hlmSemasa} / {jumHalaman} · papar {mula + 1}–{Math.min(mula + PER_HALAMAN, ditapis.length)}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => tukarHlm(hlmSemasa - 1)}
              disabled={hlmSemasa <= 1}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              ← Sebelum
            </button>
            {Array.from({ length: jumHalaman }, (_, k) => k + 1)
              .filter((n) => n === 1 || n === jumHalaman || Math.abs(n - hlmSemasa) <= 1)
              .reduce<(number | "…")[]>((acc, n, idx, arr) => {
                if (idx > 0 && n - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(n);
                return acc;
              }, [])
              .map((n, idx) =>
                n === "…" ? (
                  <span key={`e${idx}`} className="px-1 text-xs text-slate-400">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => tukarHlm(n)}
                    className={`min-w-[2rem] rounded-lg px-2 py-1 text-xs font-semibold ${n === hlmSemasa ? "bg-surau text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                  >
                    {n}
                  </button>
                ),
              )}
            <button
              type="button"
              onClick={() => tukarHlm(hlmSemasa + 1)}
              disabled={hlmSemasa >= jumHalaman}
              className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Seterusnya →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
