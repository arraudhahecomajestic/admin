"use client";

import { useEffect, useRef } from "react";

// Papan tandatangan mudah (canvas) — lukis guna jari/tetikus.
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const kosong = useRef(true);
  const wRef = useRef(0);
  const hRef = useRef(180);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = c.clientWidth;
    const h = 180;
    wRef.current = w;
    hRef.current = h;
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111827";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, w, h);
  }, []);

  function titik(e: any) {
    const r = ref.current!.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }
  function mula(e: any) {
    e.preventDefault();
    drawing.current = true;
    const ctx = ref.current!.getContext("2d")!;
    const p = titik(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }
  function gerak(e: any) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = ref.current!.getContext("2d")!;
    const p = titik(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    kosong.current = false;
  }
  function henti() {
    if (!drawing.current) return;
    drawing.current = false;
    if (!kosong.current) onChange(ref.current!.toDataURL("image/png"));
  }
  function padam() {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
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
        }}
      />
      <button type="button" onClick={padam} className="mt-1 text-xs text-slate-500 hover:underline">
        Padam & tandatangan semula
      </button>
    </div>
  );
}
