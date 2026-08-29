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

  // Jana QR resolusi tinggi → buka poster A4 bersih → cetak.
  async function cetakPoster() {
    const w = window.open("", "_blank", "width=800,height=1000");
    if (!w) { window.alert("Sila benarkan pop-up untuk cetak poster QR."); return; }
    w.document.write('<html><head><title>QR Check-in</title></head><body style="margin:0;font-family:Georgia,serif;text-align:center;color:#14140f;display:flex;align-items:center;justify-content:center;height:100vh"><p style="color:#888">Menjana QR…</p></body></html>');

    let dataUrl = "";
    try {
      const QRCode = await muatQR();
      const tmp = document.createElement("div");
      tmp.style.position = "fixed"; tmp.style.left = "-9999px"; tmp.style.top = "0";
      document.body.appendChild(tmp);
      // eslint-disable-next-line new-cap
      new QRCode(tmp, { text: pautan(), width: 600, height: 600, correctLevel: 2 });
      await new Promise((r) => setTimeout(r, 120));
      const canvas = tmp.querySelector("canvas");
      const img = tmp.querySelector("img");
      dataUrl = canvas ? (canvas as HTMLCanvasElement).toDataURL("image/png") : (img ? (img as HTMLImageElement).src : "");
      document.body.removeChild(tmp);
    } catch { /* biar */ }

    if (!dataUrl) { w.document.body.innerHTML = '<p style="color:#c00;font-family:sans-serif">Gagal menjana QR. Sila cuba lagi.</p>'; return; }

    const html = `<!doctype html><html><head><meta charset="utf-8"><title>Check-in QR — ${tajuk.replace(/</g, "")}</title>
<style>
  @page{size:A4;margin:14mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Georgia,'Times New Roman',serif;color:#14140f;text-align:center}
  .wrap{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:20px}
  .k{font-family:system-ui,Arial,sans-serif;font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#8B6914;font-weight:700}
  h1{font-size:34px;line-height:1.15;margin:12px 0 4px}
  .meta{font-family:system-ui,Arial,sans-serif;color:#475569;font-size:15px;margin-bottom:22px}
  .qrbox{border:3px solid #B8860B;border-radius:18px;padding:22px;display:inline-block}
  .qrbox img{display:block;width:360px;height:360px;image-rendering:pixelated}
  .cta{margin-top:26px;font-size:22px;font-weight:700}
  .steps{font-family:system-ui,Arial,sans-serif;color:#334155;font-size:15px;margin-top:10px;line-height:1.9}
  .foot{font-family:system-ui,Arial,sans-serif;margin-top:30px;color:#8B6914;font-weight:700}
  .url{font-family:system-ui,Arial,sans-serif;margin-top:6px;color:#94a3b8;font-size:12px;word-break:break-all}
  @media print{.noprint{display:none!important}}
</style></head><body>
<div class="wrap">
  <div class="k">Check-in Kehadiran</div>
  <h1>${tajuk.replace(/</g, "")}</h1>
  <div class="meta">Surau Ar-Raudhah, Eco Majestic</div>
  <div class="qrbox"><img src="${dataUrl}" alt="QR Check-in"></div>
  <div class="cta">Imbas untuk sahkan kehadiran</div>
  <div class="steps">1. Buka kamera telefon &amp; imbas QR &nbsp;·&nbsp; 2. Masuk no. telefon anda &nbsp;·&nbsp; 3. Selesai</div>
  <div class="foot">Jazakumullah khairan atas kehadiran anda.</div>
  <div class="url">${pautan()}</div>
  <button class="noprint" onclick="window.print()" style="margin-top:24px;padding:10px 20px;font-size:14px;font-family:system-ui;background:#B8860B;color:#fff;border:none;border-radius:8px;cursor:pointer">Cetak / Simpan PDF</button>
</div>
<script>window.onload=function(){setTimeout(function(){window.print()},300)}</script>
</body></html>`;
    w.document.open();
    w.document.write(html);
    w.document.close();
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
        <button type="button" onClick={() => setTunjukQR((v) => !v)} className="rounded-lg border border-surau/40 px-3 py-1.5 text-xs font-semibold text-surau hover:bg-surau/10">
          {tunjukQR ? "Sorok QR" : "Papar QR Pintu"}
        </button>
        <button type="button" onClick={cetakPoster} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark">
          Cetak Poster QR
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
