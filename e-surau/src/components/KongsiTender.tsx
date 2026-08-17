"use client";

import { useState } from "react";

export default function KongsiTender({ id, tajuk, noRuj, tarikhTutup }: { id: string; tajuk: string; noRuj?: string | null; tarikhTutup?: string | null }) {
  const [salin, setSalin] = useState(false);

  function pautan(): string {
    const asal = typeof window !== "undefined" ? window.location.origin : "https://arraudhahecomajestic.com";
    return `${asal}/tender/${id}`;
  }
  function teks(): string {
    const baris = [
      "*IKLAN TENDER — Surau Ar-Raudhah, Eco Majestic*",
      "",
      `*${tajuk}*`,
      noRuj ? `Rujukan: ${noRuj}` : "",
      tarikhTutup ? `Tarikh tutup: ${tarikhTutup}` : "",
      "",
      "Maklumat penuh & dokumen:",
      pautan(),
    ].filter(Boolean);
    return baris.join("\n");
  }
  async function salinPautan() {
    try { await navigator.clipboard.writeText(pautan()); setSalin(true); setTimeout(() => setSalin(false), 1800); }
    catch { window.prompt("Salin pautan tender:", pautan()); }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(teks())}`, "_blank")}
        className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">Kongsi WhatsApp</button>
      <button type="button" onClick={salinPautan}
        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">{salin ? "✓ Pautan disalin" : "Salin pautan"}</button>
    </div>
  );
}
