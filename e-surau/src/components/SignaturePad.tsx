"use client";

import { useEffect, useRef } from "react";

// Papan tandatangan mudah (canvas) — lukis guna jari/tetikus.
// Nota: canvas ini mungkin bermula dalam keadaan tersembunyi (display:none,
// cth langkah borang berbilang). Kita guna ResizeObserver supaya canvas
// disediakan/diukur semula apabila ia mula kelihatan (lebar 0 → sebenar).
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const kosong = useRef(true);
  const wRef = useRef(0);
  const hRef = useRef(180);
  const sedia = useRef(false);

  function setup() {
    const c = ref.current;
    if (!c) return;
    const w = c.clientWidth;
    if (!w) return; // masih tersembunyi / belum ada lebar
    // Sudah disediakan pada lebar sama → jangan set semula (elak padam lukisan).
    if (sedia.current && Math.abs(w - wRef.current) < 1) return;
    // Sudah ada lukisan & cuma saiz berubah → kekalkan, jangan padam.
    if (sedia.current && !kosong.current) return;

    const dpr = window.devicePixelRatio || 1;
    const h = 180;
    wRef.current = w;
    hRef.current = h;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
    kosong.current = true;
    sedia.current = true;
  }

  useEffect(() => {
    setup();
    const c = ref.current;
    if (!c) return;
    const ro = new ResizeObserver(() => setup());
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  function titik(e: any) {
    const r = ref.current!.getBoundingClientRect();
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }
  function mula(e: any) {
    if (!sedia.current) setup();       // jaga-jaga jika belum disediakan
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    e.preventDefault();
    drawing.current = true;
    const p = titik(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function gerak(e: any) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const p = titik(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    kosong.current = false;
  }
  function henti() {
    if (!drawing.current) return;
    drawing.current = false;
    if (!kosong.current && ref.current) onChange(ref.current.toDataURL("image/png"));
  }
  function padam() {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, wRef.current, hRef.current);
    kosong.current = true;
    onChange(null);
  }

  return (
    <div>
      <canvas
        ref={ref}
        onMouseDown={mula}
        onMouseMove={gerak}
        onMouseUp={henti}
        onMouseLeave={henti}
        onTouchStart={mula}
        onTouchMove={gerak}
        onTouchEnd={henti}
        style={{
          width: "100%",
          height: 180,
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          touchAction: "none",
          background: "#fff",
          cursor: "crosshair",
          display: "block",
        }}
      />
      <button
        type="button"
        onClick={padam}
        className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
      >
        ✕ Padam & tandatangan semula
      </button>
    </div>
  );
}
