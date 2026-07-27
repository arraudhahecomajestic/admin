"use client";

import type { Bahasa } from "@/lib/i18n";

// Suis BM / EN — simpan pilihan dalam cookie & muat semula halaman.
export default function ToggleBahasa({ lang }: { lang: Bahasa }) {
  function tukar(b: Bahasa) {
    if (b === lang) return;
    document.cookie = `bahasa=${b}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }
  return (
    <div className="flex items-center overflow-hidden rounded-full border border-white/30 text-xs">
      {(["ms", "en"] as Bahasa[]).map((b) => (
        <button
          key={b}
          type="button"
          onClick={() => tukar(b)}
          aria-pressed={lang === b}
          className={`px-2.5 py-1 font-semibold transition ${
            lang === b ? "bg-surau text-white" : "text-slate-300 hover:text-white"
          }`}
        >
          {b === "ms" ? "BM" : "EN"}
        </button>
      ))}
    </div>
  );
}
