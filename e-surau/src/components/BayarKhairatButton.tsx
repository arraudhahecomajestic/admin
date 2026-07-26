"use client";

import { useState } from "react";
import { mulaBayaranKhairat } from "@/app/ahli/khairat/actions";

export default function BayarKhairatButton({ label = "Bayar Yuran Khairat RM60 (Online)" }: { label?: string }) {
  const [sedang, setSedang] = useState(false);
  const [ralat, setRalat] = useState("");

  async function bayar() {
    setRalat("");
    setSedang(true);
    const res = await mulaBayaranKhairat();
    if (!res.ok) { setSedang(false); setRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  return (
    <div>
      <button
        type="button"
        onClick={bayar}
        disabled={sedang}
        className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
      >
        {sedang ? "Menyambung ke gerbang bayaran…" : label}
      </button>
      {ralat && <p className="mt-2 text-sm text-red-600">{ralat}</p>}
    </div>
  );
}
