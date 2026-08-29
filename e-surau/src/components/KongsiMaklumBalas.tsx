"use client";

import { useEffect, useRef, useState } from "react";
import { qrSvg } from "@/lib/qrArase";

export default function KongsiMaklumBalas({
  programId,
  tajuk,
  dibuka,
}: {
  programId: string;
  tajuk: string;
  dibuka: boolean;
}) {
  const [salin, setSalin] = useState(false);
  const [tunjukQR, setTunjukQR] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  function pautan(): string {
    const asal = typeof window !== "undefined" ? window.location.origin : "https://arraudhahecomajestic.com";
    return `${asal}/program/${programId}/maklum-balas`;
  }

  useEffect(() => {
    if (!tunjukQR || !qrRef.current) return;
    try {
      qrRef.current.innerHTML = qrSvg(pautan(), { margin: 4 });
    } catch {
      qrRef.current.textContent = "Gagal menjana QR.";
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tunjukQR]);

  async function salinPautan() {
    try {
      await navigator.clipboard.writeText(pautan());
      setSalin(true);
      setTimeout(() => setSalin(false), 1800);
    } catch {
      window.prompt("Salin pautan maklum balas:", pautan());
    }
  }

  function whatsapp() {
    const teks = [`*Maklum Balas — ${tajuk}*`, "Surau Ar-Raudhah, Eco Majestic", "", "Terima kasih kerana menyertai program kami. Sudi luangkan seminit untuk beri maklum balas di pautan ini:", pautan()].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(teks)}`, "_blank");
  }

  return (
    <div className="space-y-3">
      {!dibuka && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          <b>Nota:</b> Borang maklum balas masih <b>ditutup</b>. Tanda &quot;Buka borang maklum balas&quot; di atas &amp; Simpan sebelum kongsi pautan ini.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input readOnly value={pautan()} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-600" />
        <button type="button" onClick={salinPautan} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {salin ? "✓ Disalin" : "Salin pautan"}
        </button>
        <button type="button" onClick={whatsapp} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</button>
        <button type="button" onClick={() => setTunjukQR((v) => !v)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {tunjukQR ? "Sorok QR" : "Tunjuk QR"}
        </button>
      </div>
      {tunjukQR && (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-white p-4">
          <div ref={qrRef} className="h-44 w-44" />
          <p className="text-xs text-slate-500">Imbas untuk beri maklum balas · {tajuk}</p>
        </div>
      )}
    </div>
  );
}
