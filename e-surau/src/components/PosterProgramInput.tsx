"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAKS = 4;

async function muatPoster(f: File): Promise<{ url: string | null; ralat?: string }> {
  try {
    const supabase = createClient();
    const ext = (f.name.split(".").pop() || "png").toLowerCase();
    // Muat naik ke ROOT bucket (sama seperti buletin) — polisi storage RLS
    // hanya benarkan authenticated insert ke bucket "kandungan" tanpa subfolder.
    const path = `poster-${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("kandungan").upload(path, f, { contentType: f.type || undefined, upsert: true });
    if (error) return { url: null, ralat: error.message };
    return { url: supabase.storage.from("kandungan").getPublicUrl(path).data.publicUrl };
  } catch (e: any) {
    return { url: null, ralat: e?.message || "ralat tidak diketahui" };
  }
}

// Pengurus poster program: muat naik sehingga 4 keping, susun semula, buang.
// Senarai URL akhir dihantar sebagai medan tersembunyi "poster_urls" (JSON)
// dalam borang kemasProgram.
export default function PosterProgramInput({ awal }: { awal: string[] }) {
  const [poster, setPoster] = useState<string[]>(awal || []);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function pilih(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = Array.from(e.target.files || []);
    e.target.value = "";
    if (!fail.length) return;
    setMsg("");
    const ruang = MAKS - poster.length;
    if (ruang <= 0) {
      setMsg(`Maksimum ${MAKS} poster sahaja.`);
      return;
    }
    setBusy(true);
    const baharu: string[] = [];
    let ralatAkhir = "";
    for (const f of fail.slice(0, ruang)) {
      if (f.size > 5 * 1024 * 1024) {
        ralatAkhir = `"${f.name}" melebihi 5MB — dilangkau.`;
        continue;
      }
      const r = await muatPoster(f);
      if (r.url) baharu.push(r.url);
      else ralatAkhir = r.ralat ? `Gagal muat naik: ${r.ralat}` : "Gagal muat naik poster.";
    }
    setBusy(false);
    if (baharu.length) { setPoster((p) => [...p, ...baharu].slice(0, MAKS)); if (!ralatAkhir) setMsg(""); else setMsg(ralatAkhir); }
    else setMsg(ralatAkhir || "Gagal muat naik poster.");
  }

  function buang(i: number) {
    setPoster((p) => p.filter((_, idx) => idx !== i));
  }
  function alih(i: number, arah: -1 | 1) {
    setPoster((p) => {
      const j = i + arah;
      if (j < 0 || j >= p.length) return p;
      const s = [...p];
      [s[i], s[j]] = [s[j], s[i]];
      return s;
    });
  }

  return (
    <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <span className="mb-1 block text-xs font-medium text-slate-600">
        Poster / Iklan Program (PNG/JPG, maks 5MB · sehingga {MAKS} keping) — kariah boleh swipe di atas borang RSVP
      </span>
      <input type="hidden" name="poster_urls" value={JSON.stringify(poster)} />

      {poster.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {poster.map((u, i) => (
            <div key={u} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Poster ${i + 1}`} className="h-28 w-auto rounded-lg border border-slate-200 object-cover" />
              <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">{i + 1}</span>
              <button type="button" onClick={() => buang(i)} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white" title="Buang poster">×</button>
              <div className="absolute bottom-1 left-1 flex gap-1">
                {i > 0 && <button type="button" onClick={() => alih(i, -1)} className="rounded bg-white/90 px-1.5 text-xs font-bold text-slate-700 shadow" title="Ke kiri">‹</button>}
                {i < poster.length - 1 && <button type="button" onClick={() => alih(i, 1)} className="rounded bg-white/90 px-1.5 text-xs font-bold text-slate-700 shadow" title="Ke kanan">›</button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {poster.length < MAKS && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-sm text-slate-600 hover:border-surau">
          <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={pilih} />
          {busy ? "Memuat naik…" : poster.length ? "+ Tambah poster lagi" : "Muat naik poster (boleh banyak)"}
        </label>
      )}
      {poster.length >= MAKS && <p className="text-xs text-slate-400">Sudah cukup {MAKS} poster. Buang satu untuk tambah yang lain.</p>}
      {msg && <p className="mt-1 text-xs text-red-600">{msg}</p>}
    </div>
  );
}
