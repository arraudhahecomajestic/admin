"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { simpanVisiMisi, tambahCarta, padamCarta, tambahBuletin, padamBuletin, toggleBuletin } from "@/app/admin/kandungan/actions";
import { tarikhMs } from "@/lib/format";

type Carta = { id: string; jawatan: string; nama: string | null; gambar_url: string | null; susunan: number };
type Buletin = { id: string; tajuk: string; keterangan: string | null; url_fail: string | null; jenis_fail: string | null; tarikh: string; diterbitkan: boolean };

async function muatFail(f: File): Promise<{ url: string; jenis: string } | null> {
  try {
    const supabase = createClient();
    const ext = (f.name.split(".").pop() || "dat").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("kandungan").upload(path, f, { contentType: f.type || undefined, upsert: true });
    if (error) return null;
    const url = supabase.storage.from("kandungan").getPublicUrl(path).data.publicUrl;
    const jenis = f.type.includes("pdf") || ext === "pdf" ? "pdf" : "imej";
    return { url, jenis };
  } catch { return null; }
}

export default function KandunganAdmin({ visi, misi, carta, buletin }: { visi: string; misi: string; carta: Carta[]; buletin: Buletin[] }) {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <VisiMisi visi={visi} misi={misi} onDone={() => router.refresh()} />
      <CartaSeksyen carta={carta} onDone={() => router.refresh()} />
      <BuletinSeksyen buletin={buletin} onDone={() => router.refresh()} />
      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}

function VisiMisi({ visi, misi, onDone }: { visi: string; misi: string; onDone: () => void }) {
  const [v, setV] = useState(visi);
  const [m, setM] = useState(misi);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function simpan() {
    setBusy(true); setMsg("");
    const res = await simpanVisiMisi({ visi: v, misi: m });
    setBusy(false);
    setMsg(res.ok ? "✓ Disimpan." : (res.msg ?? "Ralat."));
    if (res.ok) onDone();
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Visi & Misi</h2>
      <div className="space-y-3">
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Visi</span>
          <textarea value={v} onChange={(e) => setV(e.target.value)} rows={2} className="inp" placeholder="Visi surau…" /></label>
        <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Misi</span>
          <textarea value={m} onChange={(e) => setM(e.target.value)} rows={4} className="inp" placeholder="Misi surau… (setiap baris satu poin)" /></label>
        <div className="flex items-center gap-3">
          <button onClick={simpan} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Simpan Visi & Misi"}</button>
          {msg && <span className={`text-sm ${msg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>{msg}</span>}
        </div>
      </div>
    </section>
  );
}

function CartaSeksyen({ carta, onDone }: { carta: Carta[]; onDone: () => void }) {
  const [jawatan, setJawatan] = useState("");
  const [nama, setNama] = useState("");
  const [susunan, setSusunan] = useState<number>((carta.at(-1)?.susunan ?? 0) + 10);
  const [gambarUrl, setGambarUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function pilihGambar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const res = await muatFail(f);
    setBusy(false);
    if (res) setGambarUrl(res.url); else setMsg("Gagal muat naik gambar.");
  }
  async function tambah() {
    setMsg("");
    const res = await tambahCarta({ jawatan, nama, gambarUrl: gambarUrl || undefined, susunan });
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setJawatan(""); setNama(""); setGambarUrl(""); setSusunan((s) => s + 10);
    onDone();
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Carta Organisasi</h2>
      <div className="mb-4 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
        <input value={jawatan} onChange={(e) => setJawatan(e.target.value)} placeholder="Jawatan (cth: Pengerusi)" className="inp" />
        <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama" className="inp uppercase" />
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-2 text-sm text-slate-600 hover:border-surau">
          <input type="file" accept="image/*" className="hidden" onChange={pilihGambar} />
          {gambarUrl ? "✓ Gambar dilampir" : busy ? "Memuat naik…" : "Gambar (pilihan)"}
        </label>
        <input type="number" value={susunan} onChange={(e) => setSusunan(Number(e.target.value) || 0)} placeholder="Susunan" className="inp" />
        <div className="sm:col-span-2">
          <button onClick={tambah} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">Tambah ke Carta</button>
          {msg && <span className="ml-3 text-sm text-red-600">{msg}</span>}
        </div>
      </div>
      <div className="space-y-1">
        {carta.length === 0 && <p className="text-sm text-slate-400">Tiada lagi. Tambah AJK di atas.</p>}
        {carta.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-2 text-sm">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {c.gambar_url ? <img src={c.gambar_url} alt={c.nama ?? c.jawatan} className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-400">—</div>}
              <div><span className="font-medium text-slate-800">{c.jawatan}</span> {c.nama && <span className="text-slate-500">· {c.nama}</span>}</div>
            </div>
            <button onClick={async () => { await padamCarta(c.id); onDone(); }} className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
          </div>
        ))}
      </div>
    </section>
  );
}

function BuletinSeksyen({ buletin, onDone }: { buletin: Buletin[]; onDone: () => void }) {
  const [tajuk, setTajuk] = useState("");
  const [ket, setKet] = useState("");
  const [tarikh, setTarikh] = useState("");
  const [urlFail, setUrlFail] = useState("");
  const [jenisFail, setJenisFail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function pilihFail(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setBusy(true);
    const res = await muatFail(f);
    setBusy(false);
    if (res) { setUrlFail(res.url); setJenisFail(res.jenis); } else setMsg("Gagal muat naik fail.");
  }
  async function tambah() {
    setMsg("");
    const res = await tambahBuletin({ tajuk, keterangan: ket, urlFail: urlFail || undefined, jenisFail: jenisFail || undefined, tarikh: tarikh || undefined });
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setTajuk(""); setKet(""); setTarikh(""); setUrlFail(""); setJenisFail("");
    onDone();
  }
  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Buletin Surau</h2>
      <div className="mb-4 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
        <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} placeholder="Tajuk buletin" className="inp sm:col-span-2" />
        <textarea value={ket} onChange={(e) => setKet(e.target.value)} rows={2} placeholder="Keterangan ringkas (pilihan)" className="inp sm:col-span-2" />
        <label className="text-sm text-slate-600">Tarikh<input type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)} className="inp" /></label>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 p-2 text-sm text-slate-600 hover:border-surau">
          <input type="file" accept="application/pdf,image/*" className="hidden" onChange={pilihFail} />
          {urlFail ? `✓ Fail dilampir (${jenisFail})` : busy ? "Memuat naik…" : "Lampir PDF / Gambar"}
        </label>
        <div className="sm:col-span-2">
          <button onClick={tambah} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">Terbit Buletin</button>
          {msg && <span className="ml-3 text-sm text-red-600">{msg}</span>}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {buletin.length === 0 && <p className="text-sm text-slate-400">Tiada buletin lagi.</p>}
        {buletin.map((b) => (
          <div key={b.id} className="flex items-center justify-between gap-3 py-2 text-sm">
            <div>
              <div className="font-medium text-slate-800">{b.tajuk} {!b.diterbitkan && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">Draf</span>}</div>
              <div className="text-xs text-slate-500">{tarikhMs(b.tarikh)}{b.url_fail ? ` · ${b.jenis_fail === "pdf" ? "PDF" : "Gambar"}` : ""}</div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={async () => { await toggleBuletin(b.id, !b.diterbitkan); onDone(); }} className="text-xs font-semibold text-surau hover:underline">{b.diterbitkan ? "Sorok" : "Terbit"}</button>
              <button onClick={async () => { await padamBuletin(b.id); onDone(); }} className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
