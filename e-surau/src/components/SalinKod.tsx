"use client";

import { useState } from "react";

export default function SalinKod({ kod }: { kod: string }) {
  const [ok, setOk] = useState(false);
  async function salin() {
    try {
      await navigator.clipboard.writeText(kod);
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch {
      /* abaikan */
    }
  }
  return (
    <button
      type="button"
      onClick={salin}
      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-surau/50 bg-surau/5 px-3 py-1.5 font-mono text-sm font-bold text-surau-dark hover:bg-surau/10"
      title="Klik untuk salin kod"
    >
      {ok ? "✓ Disalin" : `${kod} ⧉`}
    </button>
  );
}
