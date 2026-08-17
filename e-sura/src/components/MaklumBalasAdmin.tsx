"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tindakMaklumBalas, padamMaklumBalas } from "@/app/admin/maklum-balas/actions";
import { tarikhMs } from "@/lib/format";

type M = { id: string; jenis: string; nama: string | null; hubungan: string | null; mesej: string; status: string; tindakan: string | null; dicipta: string };

const JENIS: Record<string, { t: string; c: string }> = {
  komplen: { t: "Komplen", c: "bg-red-100 text-red-700" },
  cadangan: { t: "Cadangan", c: "bg-blue-100 text-blue-700" },
  pertanyaan: { t: "Pertanyaan", c: "bg-amber-100 text-amber-700" },
  lain: { t: "Lain-lain", c: "bg-slate-100 text-slate-600" },
};

export default function MaklumBalasAdmin({ senarai }: { senarai: M[] }) {
  const router = useRouter();
  const [tapis, setTapis] = useState<"semua" | "baru" | "selesai">("semua");
  const ditapis = senarai.filter((m) => tapis === "semua" || (tapis === "baru" ? m.status !== "selesai" : m.status === "selesai"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["semua", "baru", "selesai"] as const).map((t) => (
          <button key={t} onClick={() => setTapis(t)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${tapis === t ? "bg-surau text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
            {t === "semua" ? "Semua" : t === "baru" ? "Belum Selesai" : "Selesai"}
          </button>
        ))}
        <span className="ml-auto self-center text-xs text-slate-500">{ditapis.length} rekod</span>
      </div>

      {ditapis.length === 0 && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-400 shadow-sm">Tiada maklum balas.</p>}

      <div className="space-y-3">
        {ditapis.map((m) => <Baris key={m.id} m={m} onDone={() => router.refresh()} />)}
      </div>
    </div>
  );
}

function Baris({ m, onDone }: { m: M; onDone: () => void }) {
  const [tindakan, setTindakan] = useState(m.tindakan ?? "");
  const [busy, setBusy] = useState(false);
  const j = JENIS[m.jenis] ?? JENIS.lain;
  const warna = m.status === "selesai" ? "border-green-200" : m.status === "dibaca" ? "border-amber-200" : "border-slate-200";

  async function simpan(status: string) {
    setBusy(true);
    await tindakMaklumBalas({ id: m.id, status, tindakan });
    setBusy(false); onDone();
  }

  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm ${warna}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-semibold ${j.c}`}>{j.t}</span>
          {m.status === "baru" && <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Baru</span>}
          {m.status === "selesai" && <span className="rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">Selesai</span>}
        </div>
        <span className="text-xs text-slate-400">{tarikhMs(m.dicipta)}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{m.mesej}</p>
      <div className="mt-1 text-xs text-slate-500">
        {m.nama || "Tanpa nama"}{m.hubungan ? ` · ${m.hubungan}` : ""}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input value={tindakan} onChange={(e) => setTindakan(e.target.value)} placeholder="Catatan tindakan (pilihan)" className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm" />
        <select defaultValue={m.status} onChange={(e) => simpan(e.target.value)} disabled={busy} className="rounded border border-slate-300 px-2 py-1 text-sm">
          <option value="baru">Baru</option>
          <option value="dibaca">Dibaca</option>
          <option value="selesai">Selesai</option>
        </select>
        <button onClick={async () => { if (confirm("Padam maklum balas ini?")) { await padamMaklumBalas(m.id); onDone(); } }} className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
      </div>
    </div>
  );
}
