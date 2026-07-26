"use client";

import { useEffect, useRef, useState } from "react";

// Nisbah kad pengenalan Malaysia (ISO ID-1): 85.6mm x 53.98mm
const RATIO = 85.6 / 53.98; // ~1.586

type Kotak = { x: number; y: number; w: number; h: number };

export default function KameraKp({
  label,
  ada,
  sedang,
  onBlob,
}: {
  label: string;
  ada: boolean;
  sedang: boolean;
  onBlob: (blob: Blob) => Promise<void> | void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [buka, setBuka] = useState(false);
  const [box, setBox] = useState<Kotak | null>(null);
  const [ralat, setRalat] = useState("");

  function tutup() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setBuka(false);
    setBox(null);
  }
  useEffect(() => () => tutup(), []);

  async function mula() {
    setRalat("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      setBuka(true);
      setTimeout(() => {
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          v.play().catch(() => {});
        }
      }, 50);
    } catch {
      setRalat("Tidak dapat buka kamera. Benarkan akses kamera, atau guna pilihan muat naik fail di bawah.");
    }
  }

  function kira() {
    const v = videoRef.current;
    if (!v) return;
    const vw = v.videoWidth, vh = v.videoHeight;
    if (!vw || !vh) return;
    let w = vw * 0.9;
    let h = w / RATIO;
    if (h > vh * 0.9) { h = vh * 0.9; w = h * RATIO; }
    setBox({ x: (vw - w) / 2 / vw, y: (vh - h) / 2 / vh, w: w / vw, h: h / vh });
  }

  async function snap() {
    const v = videoRef.current;
    if (!v || !box) return;
    const vw = v.videoWidth, vh = v.videoHeight;
    const sx = box.x * vw, sy = box.y * vh, sw = box.w * vw, sh = box.h * vh;
    const outW = 1000, outH = Math.round(1000 / RATIO);
    const canvas = document.createElement("canvas");
    canvas.width = outW; canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, sx, sy, sw, sh, 0, 0, outW, outH);
    const blob: Blob = await new Promise((res) =>
      canvas.toBlob((b) => res(b as Blob), "image/jpeg", 0.9)
    );
    tutup();
    await onBlob(blob);
  }

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) await onBlob(f);
    e.target.value = "";
  }

  return (
    <div className="rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3">
      <div className="mb-2 text-sm font-medium text-slate-700">{label}</div>

      {buka ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              playsInline
              muted
              onLoadedMetadata={kira}
              onPlaying={kira}
              className="block w-full"
            />
            {box && (
              <div
                className="pointer-events-none absolute rounded-md border-2 border-yellow-400"
                style={{
                  left: `${box.x * 100}%`,
                  top: `${box.y * 100}%`,
                  width: `${box.w * 100}%`,
                  height: `${box.h * 100}%`,
                  boxShadow: "0 0 0 9999px rgba(0,0,0,.45)",
                }}
              />
            )}
            <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center text-xs font-medium text-white drop-shadow">
              Letak kad dalam kotak kuning
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={snap} className="flex-1 rounded-lg bg-surau px-3 py-2 text-sm font-semibold text-white hover:bg-surau-dark">
              📸 Snap
            </button>
            <button type="button" onClick={tutup} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600">
              Batal
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2 text-center">
          {sedang ? (
            <div className="py-3 text-sm text-amber-600">Memuat naik…</div>
          ) : ada ? (
            <div className="py-2 text-sm font-medium text-green-600">✓ {label} sudah diambil</div>
          ) : (
            <div className="py-1 text-2xl">🪪</div>
          )}
          <button type="button" onClick={mula} className="w-full rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700">
            {ada ? "Ambil semula" : "Buka Kamera & Snap"}
          </button>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pilihFail} />
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-slate-500 underline">
              atau muat naik fail
            </button>
          </div>
          {ralat && <p className="text-xs text-red-600">{ralat}</p>}
        </div>
      )}
    </div>
  );
}
