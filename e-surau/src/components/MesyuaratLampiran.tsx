"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { tambahLampiran, padamLampiran, bacaLampiranAI, tambahKeMinit } from "@/app/admin/su/mesyuarat/actions";

type Lampiran = { id: string; tajuk: string; nama_fail: string | null; signedUrl: string | null };

export default function MesyuaratLampiran({ mesyuaratId, lampiran }: { mesyuaratId: string; lampiran: Lampiran[] }) {
  const router = useRouter();
  const [tajuk, setTajuk] = useState("");
  const [urlFail, setUrlFail] = useState("");
  const [namaFail, setNamaFail] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");
  const [padamId, setPadamId] = useState("");
  // AI ekstrak lampiran
  const [aiId, setAiId] = useState("");        // lampiran sedang diproses/pratonton
  const [aiSibuk, setAiSibuk] = useState(false);
  const [aiTeks, setAiTeks] = useState("");
  const [aiRalat, setAiRalat] = useState("");
  const [tambahSibuk, setTambahSibuk] = useState(false);

  async function ekstrakAI(id: string) {
    setAiRalat(""); setAiTeks(""); setAiId(id); setAiSibuk(true);
    const res = await bacaLampiranAI(id);
    setAiSibuk(false);
    if (!res.ok) { setAiRalat(res.msg ?? "AI gagal membaca lampiran."); return; }
    setAiTeks(res.teks || "");
  }
  async function masukkanMinit() {
    if (!aiTeks.trim()) return;
    setTambahSibuk(true);
    const res = await tambahKeMinit(mesyuaratId, aiTeks.trim());
    setTambahSibuk(false);
    if (!res.ok) { setAiRalat(res.msg ?? "Gagal tambah ke minit."); return; }
    setAiId(""); setAiTeks("");
    router.refresh();
  }

  async function naik(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setRalat(""); setMuat(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "pdf";
    const path = `mesyuarat-lampiran/${mesyuaratId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail, { contentType: fail.type || undefined });
    setMuat(false);
    if (error) { setRalat("Gagal muat naik: " + error.message); return; }
    setUrlFail(`salinan-kp/${path}`);
    setNamaFail(fail.name);
    if (!tajuk) setTajuk(fail.name.replace(/\.[^.]+$/, ""));
  }

  async function simpan() {
    setRalat("");
    if (!urlFail) { setRalat("Sila muat naik fail dahulu."); return; }
    if (!tajuk.trim()) { setRalat("Sila isi tajuk lampiran."); return; }
    setHantar(true);
    const res = await tambahLampiran({ mesyuaratId, tajuk: tajuk.trim(), url_fail: urlFail, nama_fail: namaFail });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setTajuk(""); setUrlFail(""); setNamaFail("");
    router.refresh();
  }

  async function buang(id: string) {
    setPadamId(id);
    await padamLampiran(id, mesyuaratId);
    setPadamId("");
    router.refresh();
  }

  return (
    <section className="print-hide rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-1 font-semibold text-slate-900">Lampiran (Slide / Dokumen)</h2>
      <p className="mb-3 text-xs text-slate-500">Muat naik slide pembentangan, kertas kerja atau gambar. Ia akan tersenarai dalam minit sebagai rujukan.</p>

      <div className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
        <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} placeholder="Tajuk lampiran (cth: Slide Pembentangan Bajet 2026)" className="inp sm:col-span-2" />
        <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-white p-2.5 text-sm hover:border-surau sm:col-span-2">
          <input type="file" accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/*,.ppt,.pptx,.doc,.docx" className="hidden" onChange={naik} />
          {urlFail ? <span className="font-medium text-green-600">✓ {namaFail || "Fail dimuat naik"}</span> : muat ? <span className="text-amber-600">Memuat naik…</span> : <span className="text-slate-600">Pilih fail (PDF / PPT / gambar)</span>}
        </label>
        {ralat && <p className="text-sm text-red-600 sm:col-span-2">{ralat}</p>}
        <div className="sm:col-span-2">
          <button onClick={simpan} disabled={hantar || muat} className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {hantar ? "Menyimpan…" : "Tambah Lampiran"}
          </button>
        </div>
      </div>

      <div className="space-y-1">
        {lampiran.length === 0 && <p className="text-sm text-slate-400">Tiada lampiran lagi.</p>}
        {lampiran.map((l, i) => (
          <div key={l.id} className="rounded-lg border border-slate-100 p-2.5 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="font-medium text-slate-800">Lampiran {String.fromCharCode(65 + i)}: {l.tajuk}</span>
                {l.nama_fail && <span className="ml-1 text-xs text-slate-400">({l.nama_fail})</span>}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => ekstrakAI(l.id)} disabled={aiSibuk && aiId === l.id} className="rounded-lg border border-surau/40 bg-surau/5 px-2.5 py-1 text-xs font-semibold text-surau hover:bg-surau/10 disabled:opacity-60">
                  {aiSibuk && aiId === l.id ? "AI membaca…" : "AI: Ekstrak poin"}
                </button>
                {l.signedUrl && <a href={l.signedUrl} target="_blank" rel="noreferrer" className="font-medium text-surau hover:underline">Lihat →</a>}
                <button onClick={() => buang(l.id)} disabled={padamId === l.id} className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">{padamId === l.id ? "…" : "Padam"}</button>
              </div>
            </div>

            {aiId === l.id && (aiSibuk || aiTeks || aiRalat) && (
              <div className="mt-2 rounded-lg border border-surau/20 bg-surau/5 p-3">
                {aiSibuk && <p className="text-xs text-amber-600">AI sedang membaca dokumen & menyusun poin… (mungkin ambil beberapa saat)</p>}
                {aiRalat && <p className="text-xs text-red-600">{aiRalat}</p>}
                {aiTeks && (
                  <>
                    <p className="mb-1 text-xs font-semibold text-slate-600">Poin dicadang AI (boleh edit sebelum masuk minit):</p>
                    <textarea value={aiTeks} onChange={(e) => setAiTeks(e.target.value)} rows={8} className="inp text-xs" />
                    <div className="mt-2 flex items-center gap-2">
                      <button onClick={masukkanMinit} disabled={tambahSibuk} className="rounded-lg bg-surau px-3 py-1.5 text-xs font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
                        {tambahSibuk ? "Menambah…" : "Tambah ke Minit"}
                      </button>
                      <button onClick={() => { setAiId(""); setAiTeks(""); setAiRalat(""); }} className="text-xs text-slate-500 hover:underline">Tutup</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </section>
  );
}
