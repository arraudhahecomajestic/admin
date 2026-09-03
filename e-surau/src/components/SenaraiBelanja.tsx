"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { luluskanBelanja, tolakBelanja, tandaBayarBelanja, padamBelanjaId } from "@/app/admin/kewangan/actions";
import { rm, tarikhMs } from "@/lib/format";

type Belanja = {
  id: string; no_baucer: string | null; jumlah: number; keterangan: string; tarikh: string;
  dari_khairat: boolean; status: string; bayar_kepada: string | null; diluluskan_oleh: string | null;
  tarikh_bayar: string | null; sebab_tolak: string | null; url_slip?: string | null; kategori?: { nama?: string } | null;
  bank?: string | null; no_akaun?: string | null; nama_akaun?: string | null;
};

const CARA_BAYAR = ["Pindahan Atas Talian", "Tunai", "Cek"];

function BadgeStatus({ s }: { s: string }) {
  const map: Record<string, [string, string]> = {
    menunggu: ["Menunggu Kelulusan", "bg-amber-100 text-amber-700"],
    lulus: ["Diluluskan · belum bayar", "bg-blue-100 text-blue-700"],
    dibayar: ["Dibayar", "bg-green-100 text-green-700"],
    tolak: ["Ditolak", "bg-red-100 text-red-700"],
  };
  const [t, c] = map[s] ?? [s, "bg-slate-100 text-slate-600"];
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${c}`}>{t}</span>;
}

export default function SenaraiBelanja({ belanja, bolehLulus, slipUrls = {} }: { belanja: Belanja[]; bolehLulus: boolean; slipUrls?: Record<string, string | null> }) {
  const router = useRouter();
  const [bayarId, setBayarId] = useState<string | null>(null);
  const [cara, setCara] = useState(CARA_BAYAR[0]);
  const [ruj, setRuj] = useState("");
  const [tkh, setTkh] = useState(new Date().toISOString().slice(0, 10));
  const [slip, setSlip] = useState("");
  const [muat, setMuat] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function naikSlip(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return;
    setMuat(true); setMsg("");
    const supabase = createClient();
    const ext = f.name.split(".").pop() || "jpg";
    const path = `slip/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, f);
    setMuat(false);
    if (error) { setMsg("Gagal muat naik slip: " + error.message); return; }
    setSlip(`salinan-kp/${path}`);
  }

  async function lulus(id: string) {
    setBusy(true); setMsg("");
    const r = await luluskanBelanja(id); setBusy(false);
    if (!r.ok) setMsg(r.msg || "Ralat."); else router.refresh();
  }
  async function tolak(id: string) {
    const sebab = window.prompt("Sebab tolak (pilihan):") ?? "";
    setBusy(true); setMsg("");
    const r = await tolakBelanja(id, sebab); setBusy(false);
    if (!r.ok) setMsg(r.msg || "Ralat."); else router.refresh();
  }
  async function bayar(id: string) {
    setBusy(true); setMsg("");
    const r = await tandaBayarBelanja(id, { cara_bayar: cara, no_rujukan_bayar: ruj, tarikh_bayar: tkh, url_slip: slip || undefined });
    setBusy(false);
    if (!r.ok) { setMsg(r.msg || "Ralat."); return; }
    setBayarId(null); setRuj(""); setSlip(""); router.refresh();
  }
  function bukaBayar(id: string) {
    setBayarId(bayarId === id ? null : id); setSlip(""); setRuj(""); setMsg("");
  }
  async function padam(id: string) {
    if (!window.confirm("Padam baucer ini?")) return;
    await padamBelanjaId(id); router.refresh();
  }

  return (
    <section className="rounded-xl bg-white shadow-sm">
      <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Baucer & Perbelanjaan</h2>
      {msg && <div className="mx-5 mt-3 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{msg}</div>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2">Baucer</th>
              <th className="px-4 py-2">Tarikh</th>
              <th className="px-4 py-2">Butiran</th>
              <th className="px-4 py-2">Bayar Kepada</th>
              <th className="px-4 py-2 text-right">Jumlah</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {belanja.slice(0, 30).map((b) => (
              <Fragment key={b.id}>
                <tr className="border-b last:border-0 align-top">
                  <td className="px-4 py-2 font-mono text-xs">{b.no_baucer || "—"}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{tarikhMs(b.tarikh)}</td>
                  <td className="px-4 py-2">
                    <div className="text-slate-800">{b.keterangan}</div>
                    <div className="text-xs text-slate-400">{b.kategori?.nama}{b.dari_khairat ? " · Khairat" : " · Am"}</div>
                    {b.status === "tolak" && b.sebab_tolak && <div className="text-xs text-red-500">Sebab: {b.sebab_tolak}</div>}
                    {b.status === "dibayar" && b.tarikh_bayar && <div className="text-xs text-green-600">Dibayar: {tarikhMs(b.tarikh_bayar)}</div>}
                  </td>
                  <td className="px-4 py-2">
                    <div>{b.bayar_kepada || "—"}</div>
                    {b.no_akaun && <div className="mt-0.5 text-xs text-slate-500">{b.bank ? `${b.bank} · ` : ""}<span className="font-mono">{b.no_akaun}</span>{b.nama_akaun && b.nama_akaun !== b.bayar_kepada ? ` · ${b.nama_akaun}` : ""}</div>}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-red-600">{rm(b.jumlah)}</td>
                  <td className="px-4 py-2"><BadgeStatus s={b.status} /></td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <Link href={`/admin/kewangan/baucer/${b.id}`} target="_blank" className="text-xs font-semibold text-surau hover:underline">Cetak Baucer</Link>
                      {b.status === "menunggu" && bolehLulus && (
                        <div className="flex gap-2">
                          <button disabled={busy} onClick={() => lulus(b.id)} className="text-xs font-semibold text-green-700 hover:underline disabled:opacity-50">Luluskan</button>
                          <button disabled={busy} onClick={() => tolak(b.id)} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">Tolak</button>
                        </div>
                      )}
                      {b.status === "menunggu" && !bolehLulus && <span className="text-xs text-slate-400">Menunggu Pengerusi</span>}
                      {b.status === "lulus" && (
                        <button disabled={busy} onClick={() => bukaBayar(b.id)} className="text-xs font-semibold text-blue-700 hover:underline disabled:opacity-50">Tanda Dibayar</button>
                      )}
                      {b.status === "dibayar" && slipUrls[b.id] && (
                        <a href={slipUrls[b.id]!} target="_blank" rel="noreferrer" className="text-xs font-semibold text-green-700 hover:underline">Slip Bayaran</a>
                      )}
                      <button disabled={busy} onClick={() => padam(b.id)} className="text-xs font-semibold text-slate-400 hover:text-red-600 hover:underline disabled:opacity-50">Padam</button>
                    </div>
                  </td>
                </tr>
                {bayarId === b.id && (
                  <tr className="border-b bg-blue-50/40">
                    <td colSpan={7} className="px-4 py-3">
                      <div className="flex flex-wrap items-end gap-2">
                        <label className="text-xs text-slate-600">Cara Bayar
                          <select value={cara} onChange={(e) => setCara(e.target.value)} className="mt-0.5 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
                            {CARA_BAYAR.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </label>
                        <label className="text-xs text-slate-600">No. Rujukan
                          <input value={ruj} onChange={(e) => setRuj(e.target.value)} className="mt-0.5 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm" placeholder="cth: FT2026..." />
                        </label>
                        <label className="text-xs text-slate-600">Tarikh Bayar
                          <input type="date" value={tkh} onChange={(e) => setTkh(e.target.value)} className="mt-0.5 block rounded-lg border border-slate-300 px-2 py-1.5 text-sm" />
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-dashed border-slate-300 px-3 py-2 text-xs text-slate-600 hover:border-surau">
                          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naikSlip} />
                          {slip ? "Slip dimuat naik" : muat ? "Memuat naik…" : "Muat naik slip"}
                        </label>
                        <button disabled={busy || muat} onClick={() => bayar(b.id)} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">Sahkan Dibayar</button>
                        <button onClick={() => setBayarId(null)} className="px-2 py-2 text-sm text-slate-500">Batal</button>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            {belanja.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-400">Tiada baucer lagi.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
