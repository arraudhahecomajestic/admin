"use client";

export default function ButangCetak() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark"
    >
      Cetak Semua
    </button>
  );
}
