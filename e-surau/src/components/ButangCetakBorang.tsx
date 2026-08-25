"use client";

export default function ButangCetakBorang({ label = "Muat Turun / Cetak Borang (PDF)" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="print-hide rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark"
    >
      {label}
    </button>
  );
}
