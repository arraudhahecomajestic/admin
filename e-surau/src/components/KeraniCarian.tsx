"use client";

import { useState } from "react";
import { cariAhliKerani, type AhliKerani } from "@/app/kerani/actions";

export default function KeraniCarian() {
  const [q, setQ] = useState("");
  const [sedang, setSedang] = useState(false);
  const [dicari, setDicari] = useState(false);
  const [senarai, setSenarai] = useState<AhliKerani[]>([]);
  const [ralat, setRalat] = useState("");

  async function cari(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 2) {
      setRalat("Taip sekurang-kurangnya 2 aksara (nama, No. Ahli, atau No. KP).");
      return;
    }
    setRalat("");
    setSedang(true);
    const res = await cariAhliKerani(q);
    setSedang(false);
    setDicari(true);
    if (!res.ok) { setRalat(res.msg ?? "Ralat carian."); setSenarai([]); return; }
    setSenarai(res.senarai);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={cari} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 Cari nama, No. Ahli atau No. KP…"
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-surau"
        />
        <button
          disabled={sedang}
          className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
        >
          {sedang ? "Mencari…" : "Cari"}
        </button>
      </form>

      {ralat && <p className="text-sm text-red-600">{ralat}</p>}

      {dicari && !ralat && (
        <p className="text-sm text-slate-500">
          {senarai.length === 0
            ? "Tiada rekod sepadan. Cuba ejaan lain atau No. KP."
            : `Menunjukkan ${senarai.length} rekod sepadan.`}
        </p>
      )}

      {senarai.length > 0 && (
        <div className="space-y-3">
          {senarai.map((a, i) => (
            <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-slate-900">
                    {a.gelaran ? `${a.gelaran} ` : ""}{a.nama || "—"}
                  </div>
                  <div className="text-xs text-slate-400">No. Ahli: {a.no_ahli || "—"}</div>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${
                    a.maklumat_disahkan ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {a.maklumat_disahkan ? "Disahkan" : "Belum"}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
                <Baris label="No. KP" nilai={a.no_kp} />
                <Baris label="Telefon" nilai={a.telefon} />
                <Baris label="Tel. Rumah" nilai={a.no_telefon_rumah} />
                <Baris label="Taraf" nilai={a.status_perkahwinan} />
                <Baris label="Alamat (KP)" nilai={a.alamat_kp} />
                <Baris label="Alamat Semasa" nilai={a.alamat} />
              </dl>
            </div>
          ))}
        </div>
      )}

      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
        🔒 Paparan carian sahaja untuk tujuan menyemak/tally dengan borang hardcopy. Senarai penuh tidak
        dipaparkan dan tiada fungsi muat turun/eksport.
      </p>
    </div>
  );
}

function Baris({ label, nilai }: { label: string; nilai: string | null }) {
  return (
    <div className="flex gap-2">
      <dt className="w-28 shrink-0 text-slate-400">{label}:</dt>
      <dd className="font-medium text-slate-800">{nilai || "—"}</dd>
    </div>
  );
}
