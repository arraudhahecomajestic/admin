"use client";

import { useState } from "react";

// Butang Kongsi untuk artikel buletin.
// Guna Web Share API (mobile) jika ada; jika tidak, papar menu media sosial.
export default function ShareButton({
  tajuk,
  path,
  ringkas = false,
}: {
  tajuk: string;
  path: string; // cth /buletin/<id>
  ringkas?: boolean; // butang kecil (di senarai) vs penuh (di halaman artikel)
}) {
  const [buka, setBuka] = useState(false);
  const [salin, setSalin] = useState(false);

  function pautanPenuh(): string {
    if (typeof window !== "undefined") return window.location.origin + path;
    return path;
  }

  async function kongsi() {
    const url = pautanPenuh();
    const teks = `${tajuk} — Buletin Surau Ar Raudhah`;
    // Cuba Web Share API dulu (paling baik di telefon)
    if (typeof navigator !== "undefined" && (navigator as any).share) {
      try {
        await (navigator as any).share({ title: tajuk, text: teks, url });
        return;
      } catch {
        // pengguna batal / tak disokong → tunjuk menu
      }
    }
    setBuka((b) => !b);
  }

  async function salinPautan() {
    const url = pautanPenuh();
    try {
      await navigator.clipboard.writeText(url);
      setSalin(true);
      setTimeout(() => setSalin(false), 1800);
    } catch {
      /* abai */
    }
  }

  const url = pautanPenuh();
  const teksKongsi = encodeURIComponent(`${tajuk} — Buletin Surau Ar Raudhah\n${url}`);
  const urlEnc = encodeURIComponent(url);
  const tajukEnc = encodeURIComponent(tajuk);

  const wa = `https://wa.me/?text=${teksKongsi}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${urlEnc}`;
  const tg = `https://t.me/share/url?url=${urlEnc}&text=${tajukEnc}`;

  return (
    <div className="relative inline-block">
      <button
        onClick={kongsi}
        className={
          ringkas
            ? "rounded-lg border border-surau/40 px-3 py-1.5 text-xs font-semibold text-surau hover:bg-surau/5"
            : "rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark"
        }
      >
        Kongsi
      </button>

      {buka && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
          <a href={wa} target="_blank" rel="noreferrer" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setBuka(false)}>WhatsApp</a>
          <a href={fb} target="_blank" rel="noreferrer" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setBuka(false)}>Facebook</a>
          <a href={tg} target="_blank" rel="noreferrer" className="block rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setBuka(false)}>Telegram</a>
          <button onClick={salinPautan} className="block w-full rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50">
            {salin ? "Pautan disalin" : "Salin pautan"}
          </button>
        </div>
      )}
    </div>
  );
}
