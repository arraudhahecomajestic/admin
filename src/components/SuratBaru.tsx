"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ciptaSurat } from "@/app/admin/su/surat/actions";

export default function SuratBaru({ rujukanCadang }: { rujukanCadang: string }) {
  const router = useRouter();
  const [tab, setTab] = useState<"" | "keluar" | "masuk">("");

  if (!tab) {
    return (
      <div className="flex flex-wrap gap-3">
        <button onClick={() => setTab("keluar")} className="rounded-lg bg-surau px-5 py-2.5 text-sm font-semibold text-white hover:bg-surau-dark">Karang Surat Keluar</button>
        <button onClick={() => setTab("masuk")} className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Rekod Surat Masuk</button>
      </div>
    );
  }
  return tab === "keluar"
    ? <FormKeluar rujukanCadang={rujukanCadang} onTutup={() => setTab("")} onSiap={(id) => router.push(`/admin/su/surat/${id}`)} />
    : <FormMasuk onTutup={() => setTab("")} onSiap={() => router.refresh()} />;
}

function FormKeluar({ rujukanCadang, onTutup, onSiap }: { rujukanCadang: string; onTutup: () => void; onSiap: (id: string) => void }) {
  const [f, setF] = useState({ no_rujukan: rujukanCadang, tarikh: "", pihak: "", perkara: "", kandungan: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));
  async function cipta() {
    setBusy(true); setMsg("");
    const res = await ciptaSurat({ jenis: "keluar", ...f });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    if (res.id) onSiap(res.id);
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Karang Surat Keluar</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">No. Rujukan<input value={f.no_rujukan} onChange={(e) => set("no_rujukan", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600">Tarikh<input type="date" value={f.tarikh} onChange={(e) => set("tarikh", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Kepada (penerima)<input value={f.pihak} onChange={(e) => set("pihak", e.target.value)} placeholder="cth: Pengarah JAIS Selangor" className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Perkara<input value={f.perkara} onChange={(e) => set("perkara", e.target.value)} placeholder="cth: Permohonan Kelulusan Program Ramadhan 2026" className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Kandungan surat<textarea rows={8} value={f.kandungan} onChange={(e) => set("kandungan", e.target.value)} placeholder="Tulis isi surat di sini…" className="inp" /></label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={cipta} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Cipta & Pratonton"}</button>
        <button onClick={onTutup} className="text-sm text-slate-500">Batal</button>
        {msg && <span className="text-sm text-red-600">{msg}</span>}
      </div>
      <Inp />
    </section>
  );
}

function FormMasuk({ onTutup, onSiap }: { onTutup: () => void; onSiap: () => void }) {
  const [f, setF] = useState({ no_rujukan: "", tarikh: "", pihak: "", perkara: "", catatan: "" });
  const [urlFail, setUrlFail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: string) => setF((s) => ({ ...s, [k]: v }));

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true); setMsg("");
    try {
      const supabase = createClient();
      const ext = (file.name.split(".").pop() || "pdf").toLowerCase();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("surat").upload(path, file, { contentType: file.type || undefined, upsert: true });
      if (error) setMsg("Gagal muat naik: " + error.message);
      else setUrlFail(path);
    } catch { setMsg("Gagal muat naik fail."); }
    setBusy(false);
  }
  async function cipta() {
    setBusy(true); setMsg("");
    const res = await ciptaSurat({ jenis: "masuk", ...f, url_fail: urlFail || undefined });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    onSiap(); onTutup();
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Rekod Surat Masuk</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-slate-600">No. Rujukan surat<input value={f.no_rujukan} onChange={(e) => set("no_rujukan", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600">Tarikh terima<input type="date" value={f.tarikh} onChange={(e) => set("tarikh", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Daripada (pengirim)<input value={f.pihak} onChange={(e) => set("pihak", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Perkara<input value={f.perkara} onChange={(e) => set("perkara", e.target.value)} className="inp" /></label>
        <label className="text-sm text-slate-600 sm:col-span-2">Catatan<input value={f.catatan} onChange={(e) => set("catatan", e.target.value)} className="inp" /></label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-2 text-sm text-slate-600 hover:border-surau sm:col-span-2">
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={pilihFail} />
          {urlFail ? "✓ Imbasan dilampir" : busy ? "Memuat naik…" : "Lampir imbasan surat (PDF/gambar)"}
        </label>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={cipta} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Simpan Rekod"}</button>
        <button onClick={onTutup} className="text-sm text-slate-500">Batal</button>
        {msg && <span className="text-sm text-red-600">{msg}</span>}
      </div>
      <Inp />
    </section>
  );
}

function Inp() {
  return <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>;
}
