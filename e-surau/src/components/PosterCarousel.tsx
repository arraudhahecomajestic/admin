"use client";

import { useRef, useState } from "react";

// Galeri poster program yang boleh swipe (mobile) / klik anak panah (desktop).
// Dipapar di atas borang RSVP. Kalau 1 poster sahaja, papar biasa tanpa kawalan.
export default function PosterCarousel({ poster, tajuk }: { poster: string[]; tajuk?: string }) {
  const senarai = (poster || []).filter(Boolean);
  const [idx, setIdx] = useState(0);
  const jalur = useRef<HTMLDivElement>(null);

  if (senarai.length === 0) return null;

  const pergi = (n: number) => {
    const b = Math.min(Math.max(0, n), senarai.length - 1);
    setIdx(b);
    const el = jalur.current;
    if (el) el.scrollTo({ left: b * el.clientWidth, behavior: "smooth" });
  };

  // Kemas kini penunjuk bila pengguna swipe sendiri
  const bilaScroll = () => {
    const el = jalur.current;
    if (!el) return;
    const n = Math.round(el.scrollLeft / el.clientWidth);
    if (n !== idx) setIdx(n);
  };

  if (senarai.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={senarai[0]} alt={`Poster ${tajuk ?? ""}`} className="mt-2 w-full rounded-xl border border-slate-200 object-cover" />
    );
  }

  return (
    <div className="relative mt-2">
      <div
        ref={jalur}
        onScroll={bilaScroll}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto scroll-smooth rounded-xl border border-slate-200"
        style={{ scrollbarWidth: "none" }}
      >
        {senarai.map((u, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={u}
            alt={`Poster ${i + 1} ${tajuk ?? ""}`}
            className="w-full flex-none snap-center object-cover"
          />
        ))}
      </div>

      {/* Anak panah (desktop) */}
      {idx > 0 && (
        <button
          type="button"
          onClick={() => pergi(idx - 1)}
          aria-label="Poster sebelum"
          className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-slate-700 shadow hover:bg-white"
        >
          ‹
        </button>
      )}
      {idx < senarai.length - 1 && (
        <button
          type="button"
          onClick={() => pergi(idx + 1)}
          aria-label="Poster seterusnya"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-lg font-bold text-slate-700 shadow hover:bg-white"
        >
          ›
        </button>
      )}

      {/* Titik penunjuk */}
      <div className="pointer-events-none absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
        {senarai.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${i === idx ? "w-5 bg-white" : "w-2 bg-white/60"} shadow`}
          />
        ))}
      </div>

      {/* Kiraan */}
      <span className="absolute right-2 top-2 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-semibold text-white">
        {idx + 1} / {senarai.length}
      </span>
    </div>
  );
}
