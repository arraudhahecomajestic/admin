"use client";

import { useState } from "react";

function topeng(v: string, jenis: "kp" | "tel"): string {
  const d = (v || "").toString().trim();
  if (!d) return "—";
  if (jenis === "tel") return d.length <= 3 ? "•••" : "•".repeat(d.length - 3) + d.slice(-3);
  return d.length <= 4 ? "••••" : "•".repeat(d.length - 4) + d.slice(-4);
}

// Teks sensitif (IC / telefon) — ditopeng sehingga admin tekan .
export default function SulitTeks({ nilai, jenis = "kp" }: { nilai?: string | null; jenis?: "kp" | "tel" }) {
  const [show, setShow] = useState(false);
  if (!nilai) return <span className="text-slate-400">—</span>;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="font-mono">{show ? nilai : topeng(nilai, jenis)}</span>
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="text-xs text-slate-400 hover:text-surau"
        title="Papar / sorok"
      >
        {show ? "" : ""}
      </button>
    </span>
  );
}
