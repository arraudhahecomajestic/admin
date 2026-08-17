"use client";

import { useRef, useState, useTransition } from "react";
import { kemasKeteranganProgramAI } from "@/app/admin/program/actions";

// Textarea keterangan program + butang "Kemaskini dengan AI".
// AI berperanan Setiausaha surau tolong taip semula & kemaskan teks.
export default function KeteranganProgramAI() {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [teks, setTeks] = useState("");
  const [pending, start] = useTransition();
  const [ralat, setRalat] = useState("");

  function ambilNilai(nama: string): string {
    const borang = ref.current?.form;
    const el = borang?.elements.namedItem(nama) as HTMLInputElement | null;
    return el?.value ?? "";
  }

  function kemas() {
    setRalat("");
    start(async () => {
      const r = await kemasKeteranganProgramAI({
        tajuk: ambilNilai("tajuk"),
        kategori: ambilNilai("kategori"),
        lokasi: ambilNilai("lokasi"),
        tarikh: ambilNilai("tarikh"),
        masa: ambilNilai("masa"),
        yuran: ambilNilai("yuran"),
        had_peserta: ambilNilai("had_peserta"),
        keterangan: ref.current?.value ?? "",
      });
      if (r.ok && r.teks) setTeks(r.teks);
      else setRalat(r.msg ?? "AI gagal. Cuba lagi.");
    });
  }

  return (
    <div className="sm:col-span-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">Keterangan / butiran program</span>
        <button
          type="button"
          onClick={kemas}
          disabled={pending}
          className="rounded-lg border border-surau/40 px-3 py-1 text-xs font-semibold text-surau hover:bg-surau/10 disabled:opacity-50"
        >
          {pending ? "SU sedang kemas…" : "✨ Kemaskini dengan AI"}
        </button>
      </div>
      <textarea
        ref={ref}
        name="keterangan"
        rows={5}
        value={teks}
        onChange={(e) => setTeks(e.target.value)}
        placeholder="Taip idea/butiran kasar, tekan ✨ Kemaskini dengan AI — Setiausaha akan tolong taip semula & kemaskan."
        className="inp"
      />
      {ralat && <div className="mt-1 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">{ralat}</div>}
      <p className="mt-1 text-[11px] text-slate-400">Isi tajuk/tarikh/lokasi dahulu untuk hasil yang lebih tepat. Anda boleh sunting hasil AI sebelum simpan.</p>
    </div>
  );
}
