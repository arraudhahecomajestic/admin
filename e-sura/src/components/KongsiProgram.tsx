"use client";

import { useState } from "react";

export default function KongsiProgram({
  id,
  tajuk,
  tarikhLabel,
  masa,
  lokasi,
}: {
  id: string;
  tajuk: string;
  tarikhLabel: string;
  masa?: string | null;
  lokasi?: string | null;
}) {
  const [salin, setSalin] = useState<"" | "pautan">("");

  function pautan(): string {
    const asal = typeof window !== "undefined" ? window.location.origin : "https://arraudhahecomajestic.com";
    return `${asal}/program/${id}`;
  }

  function teksHebahan(): string {
    const baris = [
      "*JEMPUTAN — Surau Ar-Raudhah, Eco Majestic*",
      "",
      `*${tajuk}*`,
      `${tarikhLabel}${masa ? ` · ${masa}` : ""}`,
    ];
    if (lokasi) baris.push(`${lokasi}`);
    baris.push("", "Sila sahkan kehadiran (RSVP) di pautan ini:", pautan());
    return baris.join("\n");
  }

  async function salinPautan() {
    try {
      await navigator.clipboard.writeText(pautan());
      setSalin("pautan");
      setTimeout(() => setSalin(""), 1800);
    } catch {
      window.prompt("Salin pautan RSVP:", pautan());
    }
  }

  function whatsapp() {
    window.open(`https://wa.me/?text=${encodeURIComponent(teksHebahan())}`, "_blank");
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={salinPautan}
        className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
      >
        {salin === "pautan" ? "✓ Pautan disalin" : "Salin pautan RSVP"}
      </button>
      <button
        type="button"
        onClick={whatsapp}
        className="rounded-lg bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
      >
        Hebahan WhatsApp
      </button>
    </div>
  );
}
