"use client";

import { useEffect, useRef, useState } from "react";

let qrJanji: Promise<any> | null = null;
function muatQR(): Promise<any> {
  if (typeof window !== "undefined" && (window as any).QRCode) return Promise.resolve((window as any).QRCode);
  if (qrJanji) return qrJanji;
  qrJanji = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js";
    s.async = true;
    s.onload = () => resolve((window as any).QRCode);
    s.onerror = () => { qrJanji = null; reject(new Error("Gagal memuat QR.")); };
    document.head.appendChild(s);
  });
  return qrJanji;
}

export default function KongsiCheckIn({
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
    return `${asal}/program/${programId}/hadir`;
  }

  useEffect(() => {
    if (!tunjukQR || !qrRef.current) return;
    let batal = false;
    muatQR().then((QRCode) => {
      if (batal || !qrRef.current) return;
      qrRef.current.innerHTML = "";
      // eslint-disable-next-line new-cap
      new QRCode(qrRef.current, { text: pautan(), width: 220, height: 220, correctLevel: 2 });
    }).catch(() => {});
    return () => { batal = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tunjukQR]);

  async function salinPautan() {
    try {
      await navigator.clipboard.writeText(pautan());
      setSalin(true);
      setTimeout(() => setSalin(false), 1800);
    } catch {
      window.prompt("Salin pautan check-in:", pautan());
    }
  }

  function whatsapp() {
    const teks = [`*Check-in — ${tajuk}*`, "Surau Ar-Raudhah, Eco Majestic", "", "Imbas / buka pautan ini untuk sahkan kehadiran:", pautan()].join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(teks)}`, "_blank");
  }

  return (
    <div className="space-y-3">
      {!dibuka && (
        <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
          <b>Nota:</b> Check-in masih <b>ditutup</b>. Tanda &quot;Buka check-in kehadiran&quot; di atas &amp; Simpan sebelum pamer QR ini di pintu.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <input readOnly value={pautan()} className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs text-slate-600" />
        <button type="button" onClick={salinPautan} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
          {salin ? "✓ Disalin" : "Salin pautan"}
        </button>
        <button type="button" onClick={whatsapp} className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700">WhatsApp</button>
        <button type="button" onClick={() => setTunjukQR((v) => !v)} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">
          {tunjukQR ? "Sorok QR" : "Papar QR Pintu"}
        </button>
      </div>
      {tunjukQR && (
        <div className="flex flex-col items-center gap-2 rounded-lg border bg-white p-5">
          <div ref={qrRef} />
          <p className="text-sm font-semibold text-slate-700">Imbas untuk check-in</p>
          <p className="text-xs text-slate-500">{tajuk}</p>
          <p className="text-xs text-slate-400">Pamer / cetak QR ini di pintu masuk.</p>
        </div>
      )}
    </div>
  );
}
