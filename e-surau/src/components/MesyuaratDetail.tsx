"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { simpanMesyuarat, padamMesyuarat, tambahTindakan, ubahStatusTindakan, padamTindakan, kemasMinitAI, senaraiAjkKehadiran } from "@/app/admin/su/mesyuarat/actions";
import { JENIS_MESYUARAT, STATUS_TINDAKAN, labelStatusTindakan } from "@/lib/su";
import { NAMA_SURAU, ALAMAT_SURAU, EMEL_SURAU, LOGO_SURAU } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";

export default function MesyuaratDetail({ mesyuarat: m0, tindakan }: { mesyuarat: any; tindakan: any[] }) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState<any>({ ...m0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [ai, setAi] = useState(false);
  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));

  async function isiAjk() {
    const res = await senaraiAjkKehadiran();
    if (res.ok && res.teks) {
      set("kehadiran", f.kehadiran?.trim() ? `${f.kehadiran.trim()}\n${res.teks}` : res.teks);
    } else {
      setMsg("Tiada nama AJK dalam carta organisasi.");
    }
  }
  async function kemasAI() {
    setMsg(""); setAi(true);
    const res = await kemasMinitAI({ tajuk: f.tajuk, jenis: f.jenis, agenda: f.agenda, kehadiran: f.kehadiran, nota: f.minit || "" });
    setAi(false);
    if (!res.ok) { setMsg(res.msg ?? "AI gagal."); return; }
    set("minit", res.teks || "");
  }

  async function simpan() {
    setBusy(true); setMsg("");
    const res = await simpanMesyuarat(m0.id, {
      tajuk: f.tajuk, jenis: f.jenis, bil: f.bil, tarikh: f.tarikh, masa: f.masa, tempat: f.tempat,
      pengerusi: f.pengerusi, pencatat: f.pencatat, kehadiran: f.kehadiran, tidak_hadir: f.tidak_hadir, agenda: f.agenda, minit: f.minit,
    });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setEdit(false); router.refresh();
  }
  async function tukarStatus() {
    const baru = m0.status === "selesai" ? "draf" : "selesai";
    await simpanMesyuarat(m0.id, { status: baru }); router.refresh();
  }
  async function padam() {
    if (!confirm("Padam mesyuarat ini? Tindakan berkaitan juga akan dipadam.")) return;
    await padamMesyuarat(m0.id); router.push("/admin/su/mesyuarat");
  }

  const pisah = (blok: string) => (blok || "").split("\n").map((s: string) => s.trim()).filter(Boolean).map((line: string) => {
    const mm = line.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    return mm ? { nama: mm[1].trim(), jawatan: mm[2].trim() } : { nama: line, jawatan: "" };
  });
  const hadir = pisah(f.kehadiran);
  const tidakHadir = pisah(f.tidak_hadir);

  return (
    <div className="space-y-5">
      {/* Kawalan */}
      <div className="print-hide flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/su/mesyuarat" className="text-sm text-surau hover:underline">← Senarai Mesyuarat</Link>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${m0.status === "selesai" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{m0.status === "selesai" ? "Selesai" : "Draf"}</span>
          {!edit && <button onClick={() => setEdit(true)} className="rounded-lg bg-surau px-4 py-1.5 text-sm font-semibold text-white hover:bg-surau-dark">Edit</button>}
          {!edit && <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cetak Minit</button>}
          {!edit && <button onClick={tukarStatus} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">{m0.status === "selesai" ? "Tanda Draf" : "Tanda Selesai"}</button>}
          {!edit && <button onClick={padam} className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Padam</button>}
        </div>
      </div>

      {edit ? (
        /* ---- MOD EDIT ---- */
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600 sm:col-span-2">Tajuk<input value={f.tajuk ?? ""} onChange={(e) => set("tajuk", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Jenis
              <select value={f.jenis ?? "AJK"} onChange={(e) => set("jenis", e.target.value)} className="inp">{JENIS_MESYUARAT.map((j) => <option key={j} value={j}>{j}</option>)}</select>
            </label>
            <label className="text-sm text-slate-600">Bilangan (cth 1/2025)<input value={f.bil ?? ""} onChange={(e) => set("bil", e.target.value)} className="inp" placeholder="1/2025" /></label>
            <label className="text-sm text-slate-600">Tarikh<input type="date" value={f.tarikh ?? ""} onChange={(e) => set("tarikh", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Masa<input value={f.masa ?? ""} onChange={(e) => set("masa", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Tempat<input value={f.tempat ?? ""} onChange={(e) => set("tempat", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Pengerusi<input value={f.pengerusi ?? ""} onChange={(e) => set("pengerusi", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Pencatat<input value={f.pencatat ?? ""} onChange={(e) => set("pencatat", e.target.value)} className="inp" /></label>
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600">Kehadiran (satu nama satu baris)</span>
                <button type="button" onClick={isiAjk} className="rounded-lg border border-surau/40 bg-surau/5 px-3 py-1 text-xs font-semibold text-surau hover:bg-surau/10">Isi nama AJK</button>
              </div>
              <textarea rows={4} value={f.kehadiran ?? ""} onChange={(e) => set("kehadiran", e.target.value)} className="inp" placeholder="Cth: Ahmad bin Ali (Pengerusi)&#10;— atau tekan 'Isi nama AJK'" />
            </div>
            <label className="text-sm text-slate-600 sm:col-span-2">Tidak Hadir Bersebab (satu nama satu baris)
              <textarea rows={3} value={f.tidak_hadir ?? ""} onChange={(e) => set("tidak_hadir", e.target.value)} className="inp" placeholder="Cth: Ali bin Abu (Bendahari)" />
            </label>
            <label className="text-sm text-slate-600 sm:col-span-2">Agenda (satu perkara satu baris)<textarea rows={4} value={f.agenda ?? ""} onChange={(e) => set("agenda", e.target.value)} className="inp" /></label>
            <div className="sm:col-span-2">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="text-sm text-slate-600">Minit / Perbincangan</span>
                <button type="button" onClick={kemasAI} disabled={ai || busy} className="rounded-lg border border-surau/40 bg-surau/5 px-3 py-1 text-xs font-semibold text-surau hover:bg-surau/10 disabled:opacity-60" title="Tukar nota kasar jadi minit kemas">
                  {ai ? "AI sedang mengemas…" : "Kemas dengan AI"}
                </button>
              </div>
              <textarea rows={10} value={f.minit ?? ""} onChange={(e) => set("minit", e.target.value)} className="inp" placeholder="Taip nota kasar semasa mesyuarat di sini, kemudian tekan 'Kemas dengan AI' untuk susun jadi minit rasmi." />
              <p className="mt-1 text-xs text-slate-400">Tip: taip poin kasar semasa mesyuarat, tekan "Kemas dengan AI", kemudian semak & simpan.</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={simpan} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Simpan"}</button>
            <button onClick={() => { setF({ ...m0 }); setEdit(false); }} className="text-sm text-slate-500">Batal</button>
            {msg && <span className="text-sm text-red-600">{msg}</span>}
          </div>
        </section>
      ) : (
        /* ---- MOD PAPAR / CETAK ---- */
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-center gap-3 border-b pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SURAU} alt={NAMA_SURAU} className="h-12 w-auto" />
            <div className="text-xs text-slate-600">
              <div className="text-sm font-bold text-slate-900">{NAMA_SURAU}</div>
              <div>{ALAMAT_SURAU}</div>
              <div>{EMEL_SURAU}</div>
            </div>
          </div>

          <h1 className="mt-5 text-center text-base font-bold uppercase tracking-wide text-slate-900">Minit Mesyuarat</h1>
          <div className="mx-auto mt-1 text-center text-base font-bold uppercase leading-snug text-slate-900">
            {f.tajuk}{f.bil ? ` Bil. ${f.bil}` : ""}
          </div>

          <div className="mx-auto mt-4 max-w-md space-y-0.5 text-sm">
            <BarisMeta k="Tarikh" v={f.tarikh ? tarikhMs(f.tarikh) : "—"} />
            <BarisMeta k="Masa" v={f.masa || "—"} />
            <BarisMeta k="Tempat" v={f.tempat || "—"} />
          </div>

          <hr className="my-5 border-slate-300" />

          {hadir.length > 0 && (
            <div className="mt-2">
              <h2 className="font-bold uppercase text-slate-900">Kehadiran</h2>
              <ol className="mt-2 space-y-1 text-sm text-slate-800">
                {hadir.map((o: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 shrink-0 text-right">{i + 1}.</span>
                    <span className="flex-1">{o.nama}</span>
                    <span className="w-52 shrink-0">{o.jawatan ? `—  ${o.jawatan}` : ""}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {tidakHadir.length > 0 && (
            <div className="mt-5">
              <h2 className="font-bold uppercase text-slate-900">Tidak Hadir Bersebab</h2>
              <ol className="mt-2 space-y-1 text-sm text-slate-800">
                {tidakHadir.map((o: any, i: number) => (
                  <li key={i} className="flex gap-2">
                    <span className="w-6 shrink-0 text-right">{i + 1}.</span>
                    <span className="flex-1">{o.nama}</span>
                    <span className="w-52 shrink-0">{o.jawatan ? `—  ${o.jawatan}` : ""}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          <hr className="my-5 border-slate-300" />

          {f.minit ? (
            <div className="mt-2 space-y-1 text-sm leading-relaxed text-slate-800">
              {renderMinit(f.minit)}
            </div>
          ) : f.agenda ? (
            <div className="mt-2">
              <h2 className="font-bold text-slate-900">Agenda</h2>
              <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-slate-700">
                {(f.agenda || "").split("\n").map((s: string) => s.trim()).filter(Boolean).map((a: string, i: number) => <li key={i}>{a}</li>)}
              </ol>
            </div>
          ) : null}

          {tindakan.length > 0 && (
            <div className="mt-6">
              <h2 className="font-bold text-slate-900">Ringkasan Jejak Tindakan</h2>
              <table className="mt-1 w-full border-collapse text-sm">
                <thead><tr className="border-y text-left text-xs uppercase text-slate-500"><th className="py-1 pr-2">Perkara</th><th className="py-1 pr-2">Tanggungjawab</th><th className="py-1 pr-2">Sasaran</th><th className="py-1">Status</th></tr></thead>
                <tbody>
                  {tindakan.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 align-top">
                      <td className="py-1.5 pr-2 text-slate-700">{t.perkara}</td>
                      <td className="py-1.5 pr-2 text-slate-600">{t.tanggungjawab || "—"}</td>
                      <td className="py-1.5 pr-2 text-slate-600">{t.tarikh_sasar ? tarikhMs(t.tarikh_sasar) : "—"}</td>
                      <td className="py-1.5 text-slate-600">{labelStatusTindakan(t.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-10 grid grid-cols-2 gap-8 text-sm">
            <div><div className="h-10 border-b border-slate-400" /><div className="mt-1 text-slate-600">Dicatat oleh</div><div className="text-xs text-slate-500">{f.pencatat || "Setiausaha"}</div></div>
            <div><div className="h-10 border-b border-slate-400" /><div className="mt-1 text-slate-600">Disahkan oleh</div><div className="text-xs text-slate-500">{f.pengerusi || "Pengerusi"}</div></div>
          </div>
        </div>
      )}

      {/* Pengurusan tindakan (tidak dicetak) */}
      {!edit && <TindakanPanel mesyuaratId={m0.id} tindakan={tindakan} onDone={() => router.refresh()} />}

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}

function BarisMeta({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1">
      <span className="w-20 shrink-0 font-semibold text-slate-800">{k}</span>
      <span>:</span>
      <span className="flex-1 text-slate-900">{v}</span>
    </div>
  );
}

// Render badan minit ikut gaya SAR: perkara "N." tebal, baris "Tindakan:" kanan.
function renderMinit(teks: string) {
  return (teks || "").split("\n").map((raw, i) => {
    const line = raw.replace(/\s+$/, "");
    if (!line.trim()) return <div key={i} className="h-1.5" />;
    if (/^\s*Tindakan\s*:/i.test(line)) {
      return <p key={i} className="text-right text-xs font-semibold text-slate-600">{line.trim()}</p>;
    }
    const utama = /^\d+\.\s/.test(line.trim());
    return <p key={i} className={`whitespace-pre-wrap ${utama ? "mt-2 font-bold text-slate-900" : ""}`}>{line}</p>;
  });
}

function TindakanPanel({ mesyuaratId, tindakan, onDone }: { mesyuaratId: string; tindakan: any[]; onDone: () => void }) {
  const [perkara, setPerkara] = useState("");
  const [tj, setTj] = useState("");
  const [sasar, setSasar] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function tambah() {
    setBusy(true); setMsg("");
    const res = await tambahTindakan({ mesyuaratId, perkara, tanggungjawab: tj, tarikhSasar: sasar || undefined });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setPerkara(""); setTj(""); setSasar(""); onDone();
  }
  return (
    <section className="print-hide rounded-xl bg-white p-5 shadow-sm">
      <h2 className="mb-3 font-semibold text-slate-900">Jejak Tindakan</h2>
      <div className="mb-4 grid gap-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-4">
        <input value={perkara} onChange={(e) => setPerkara(e.target.value)} placeholder="Perkara / tindakan" className="inp sm:col-span-2" />
        <input value={tj} onChange={(e) => setTj(e.target.value)} placeholder="Tanggungjawab" className="inp" />
        <input type="date" value={sasar} onChange={(e) => setSasar(e.target.value)} className="inp" />
        <div className="sm:col-span-4">
          <button onClick={tambah} disabled={busy} className="rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">Tambah Tindakan</button>
          {msg && <span className="ml-3 text-sm text-red-600">{msg}</span>}
        </div>
      </div>
      <div className="space-y-1">
        {tindakan.length === 0 && <p className="text-sm text-slate-400">Tiada tindakan direkod.</p>}
        {tindakan.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 p-2 text-sm">
            <div>
              <span className="font-medium text-slate-800">{t.perkara}</span>
              <span className="ml-2 text-xs text-slate-500">{t.tanggungjawab || "—"}{t.tarikh_sasar ? ` · ${tarikhMs(t.tarikh_sasar)}` : ""}</span>
            </div>
            <div className="flex items-center gap-2">
              <select defaultValue={t.status} onChange={async (e) => { await ubahStatusTindakan(t.id, mesyuaratId, e.target.value); onDone(); }} className="rounded border border-slate-300 px-2 py-1 text-xs">
                {STATUS_TINDAKAN.map((s) => <option key={s.kod} value={s.kod}>{s.label}</option>)}
              </select>
              <button onClick={async () => { await padamTindakan(t.id, mesyuaratId); onDone(); }} className="text-xs font-semibold text-red-600 hover:underline">Padam</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
