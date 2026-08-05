"use client";

import { useState } from "react";
import { simpanJadual, padamJadual, janaJadualBulan } from "@/app/admin/staf/actions";

type Jadual = { id: string; tarikh: string; shift: string; catatan: string | null };

const SHIFT = [
  { kod: "pagi", label: "Pagi (8:00 – 5:00)", cls: "bg-amber-100 text-amber-700" },
  { kod: "petang", label: "Petang (2:00 – 10:00)", cls: "bg-indigo-100 text-indigo-700" },
  { kod: "rehat", label: "Rehat", cls: "bg-slate-100 text-slate-600" },
  { kod: "cuti", label: "Cuti", cls: "bg-red-100 text-red-700" },
];
const labelShift = (k: string) => SHIFT.find((s) => s.kod === k)?.label ?? k;
const clsShift = (k: string) => SHIFT.find((s) => s.kod === k)?.cls ?? "bg-slate-100 text-slate-600";
const HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
function papar(tarikh: string) {
  const d = new Date(tarikh + "T00:00:00");
  return `${HARI[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

export default function JadualKerjaStaf({ awal }: { awal: Jadual[] }) {
  const [senarai, setSenarai] = useState<Jadual[]>(awal);
  const [tarikh, setTarikh] = useState("");
  const [shift, setShift] = useState("pagi");
  const [catatan, setCatatan] = useState("");
  const [proses, setProses] = useState(false);
  const [ralat, setRalat] = useState("");

  // Penjana bulanan
  const [bulan, setBulan] = useState("");
  const [jana, setJana] = useState(false);
  // Lalai: satu hari cuti mingguan (Rabu). Boleh ubah sebelum jana.
  const [corak, setCorak] = useState<Record<string, string>>({ "1": "pagi", "2": "pagi", "3": "cuti", "4": "petang", "5": "pagi", "6": "petang", "0": "petang" });
  const setHariCorak = (wd: string, v: string) => setCorak((c) => ({ ...c, [wd]: v }));

  async function janaBulanan() {
    if (!bulan) { setRalat("Sila pilih bulan untuk dijana."); return; }
    setRalat(""); setJana(true);
    const res = await janaJadualBulan(bulan, corak);
    setJana(false);
    if (!res.ok) { setRalat(res.msg || "Ralat menjana."); return; }
    window.location.reload();
  }

  async function simpan(e: React.FormEvent) {
    e.preventDefault(); setRalat(""); setProses(true);
    const res = await simpanJadual({ tarikh, shift, catatan });
    setProses(false);
    if (!res.ok) { setRalat(res.msg || "Ralat."); return; }
    // Kemas kini senarai tempatan (ganti jika tarikh sama)
    const baru: Jadual = { id: crypto.randomUUID(), tarikh, shift, catatan: catatan || null };
    setSenarai((s) => [...s.filter((x) => x.tarikh !== tarikh), baru].sort((a, b) => a.tarikh.localeCompare(b.tarikh)));
    setCatatan("");
  }

  async function padam(id: string, t: string) {
    setSenarai((s) => s.filter((x) => x.id !== id && x.tarikh !== t));
    await padamJadual(id);
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold text-slate-900">Jadual Kerja Staf</h2>
      <p className="mb-3 text-sm text-slate-500">Jana sebulan ikut corak, kemudian ubah hari Cuti jika perlu. Atau tambah satu-satu tarikh di bawah.</p>

      {/* Penjana bulanan */}
      <div className="rounded-lg border border-surau/20 bg-surau/5 p-3">
        <div className="text-sm font-semibold text-slate-800">Jana Jadual Bulanan</div>
        <p className="mb-2 text-xs text-slate-500">Tetapkan shift lalai untuk setiap hari, pilih bulan, tekan Jana. Hari Cuti berpusing boleh diubah selepas itu.</p>
        <div className="flex flex-wrap gap-1.5">
          {[["1", "Isnin"], ["2", "Selasa"], ["3", "Rabu"], ["4", "Khamis"], ["5", "Jumaat"], ["6", "Sabtu"], ["0", "Ahad"]].map(([wd, nama]) => (
            <div key={wd} className="flex flex-col">
              <span className="text-[11px] text-slate-500">{nama}</span>
              <select value={corak[wd]} onChange={(e) => setHariCorak(wd, e.target.value)} className="rounded border border-slate-300 px-1.5 py-1 text-xs">
                {SHIFT.map((s) => <option key={s.kod} value={s.kod}>{s.kod === "pagi" ? "Pagi" : s.kod === "petang" ? "Petang" : s.kod === "rehat" ? "Rehat" : "Cuti"}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <button onClick={janaBulanan} disabled={jana} className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {jana ? "Menjana…" : "Jana Jadual Bulan"}
          </button>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Nota: menjana akan tulis-ganti shift bagi tarikh dalam bulan itu.</p>
      </div>

      <div className="my-3 text-sm font-medium text-slate-600">Tambah / ubah satu tarikh</div>

      <form onSubmit={simpan} className="grid gap-2 sm:grid-cols-4">
        <input type="date" required value={tarikh} onChange={(e) => setTarikh(e.target.value)} className="inp" />
        <select value={shift} onChange={(e) => setShift(e.target.value)} className="inp">
          {SHIFT.map((s) => <option key={s.kod} value={s.kod}>{s.label}</option>)}
        </select>
        <input placeholder="Catatan (pilihan)" value={catatan} onChange={(e) => setCatatan(e.target.value)} className="inp" />
        <button disabled={proses} className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {proses ? "Menyimpan…" : "Simpan"}
        </button>
      </form>
      {ralat && <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{ralat}</div>}

      <div className="mt-4 divide-y">
        {senarai.length === 0 && <p className="py-4 text-center text-sm text-slate-400">Belum ada jadual. Tambah di atas.</p>}
        {senarai.map((j) => (
          <div key={j.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div>
              <span className="text-sm font-medium text-slate-800">{papar(j.tarikh)}</span>
              {j.catatan && <span className="ml-2 text-xs text-slate-500">— {j.catatan}</span>}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clsShift(j.shift)}`}>{labelShift(j.shift)}</span>
              <button onClick={() => padam(j.id, j.tarikh)} className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b}`}</style>
    </section>
  );
}
