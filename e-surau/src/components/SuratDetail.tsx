"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { simpanSurat, padamSurat, lampiranSurat } from "@/app/admin/su/surat/actions";
import { STATUS_SURAT, labelStatusSurat } from "@/lib/su";
import { NAMA_SURAU, ALAMAT_SURAU, EMEL_SURAU, WEB_SURAU, LOGO_SURAU } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";

export default function SuratDetail({ surat: s0, pencatat }: { surat: any; pencatat: string }) {
  const router = useRouter();
  const keluar = s0.jenis === "keluar";
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState<any>({ ...s0 });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const set = (k: string, v: any) => setF((x: any) => ({ ...x, [k]: v }));

  async function simpan() {
    setBusy(true); setMsg("");
    const res = await simpanSurat(s0.id, { no_rujukan: f.no_rujukan, tarikh: f.tarikh, pihak: f.pihak, perkara: f.perkara, kandungan: f.kandungan, catatan: f.catatan });
    setBusy(false);
    if (!res.ok) { setMsg(res.msg ?? "Ralat."); return; }
    setEdit(false); router.refresh();
  }
  async function tukarStatus(v: string) { await simpanSurat(s0.id, { status: v }); router.refresh(); }
  async function padam() { if (!confirm("Padam surat ini?")) return; await padamSurat(s0.id); router.push("/admin/su/surat"); }
  async function bukaLampiran() {
    const res = await lampiranSurat(s0.url_fail);
    if (res.ok && res.url) window.open(res.url, "_blank");
  }

  return (
    <div className="space-y-5">
      <div className="print-hide flex flex-wrap items-center justify-between gap-2">
        <Link href="/admin/su/surat" className="text-sm text-surau hover:underline">← Daftar Surat</Link>
        <div className="flex flex-wrap items-center gap-2">
          <select value={s0.status} onChange={(e) => tukarStatus(e.target.value)} className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            {STATUS_SURAT.map((s) => <option key={s.kod} value={s.kod}>{s.label}</option>)}
          </select>
          {keluar && !edit && <button onClick={() => setEdit(true)} className="rounded-lg bg-surau px-4 py-1.5 text-sm font-semibold text-white hover:bg-surau-dark">Edit</button>}
          {keluar && !edit && <button onClick={() => window.print()} className="rounded-lg border border-slate-300 px-4 py-1.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">🖨️ Cetak Surat</button>}
          <button onClick={padam} className="rounded-lg border border-red-300 px-4 py-1.5 text-sm font-semibold text-red-600 hover:bg-red-50">Padam</button>
        </div>
      </div>

      {keluar && edit ? (
        <section className="rounded-xl bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-slate-600">No. Rujukan<input value={f.no_rujukan ?? ""} onChange={(e) => set("no_rujukan", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600">Tarikh<input type="date" value={f.tarikh ?? ""} onChange={(e) => set("tarikh", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600 sm:col-span-2">Kepada<input value={f.pihak ?? ""} onChange={(e) => set("pihak", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600 sm:col-span-2">Perkara<input value={f.perkara ?? ""} onChange={(e) => set("perkara", e.target.value)} className="inp" /></label>
            <label className="text-sm text-slate-600 sm:col-span-2">Kandungan<textarea rows={10} value={f.kandungan ?? ""} onChange={(e) => set("kandungan", e.target.value)} className="inp" /></label>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={simpan} disabled={busy} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{busy ? "…" : "Simpan"}</button>
            <button onClick={() => { setF({ ...s0 }); setEdit(false); }} className="text-sm text-slate-500">Batal</button>
            {msg && <span className="text-sm text-red-600">{msg}</span>}
          </div>
        </section>
      ) : keluar ? (
        /* ---- SURAT KELUAR — pratonton/cetak berkepala surat ---- */
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-10 shadow-sm print:border-0 print:shadow-none">
          <div className="flex items-center gap-4 border-b-2 border-surau pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={LOGO_SURAU} alt={NAMA_SURAU} className="h-16 w-auto" />
            <div className="text-xs text-slate-600">
              <div className="text-base font-bold text-slate-900">{NAMA_SURAU}</div>
              <div>{ALAMAT_SURAU}</div>
              <div>{EMEL_SURAU} · {WEB_SURAU}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-between text-sm">
            <div><span className="text-slate-500">Ruj. Kami:</span> <b>{f.no_rujukan || "—"}</b></div>
            <div><span className="text-slate-500">Tarikh:</span> <b>{f.tarikh ? tarikhMs(f.tarikh) : "—"}</b></div>
          </div>

          {f.pihak && (
            <div className="mt-6 text-sm text-slate-800">
              <div className="whitespace-pre-wrap">{f.pihak}</div>
            </div>
          )}

          <div className="mt-6 text-sm">Tuan/Puan,</div>
          <div className="mt-3 text-sm font-bold uppercase text-slate-900">{f.perkara}</div>

          <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{f.kandungan || ""}</div>

          <div className="mt-10 text-sm">
            <div>Sekian, terima kasih.</div>
            <div className="mt-6">Yang menjalankan amanah,</div>
            <div className="mt-12 font-bold">………………………………</div>
            <div className="text-slate-700">{pencatat}</div>
            <div className="text-slate-500">Setiausaha, {NAMA_SURAU}</div>
          </div>
        </div>
      ) : (
        /* ---- SURAT MASUK — rekod ---- */
        <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">Surat Masuk</span>
          <h1 className="mt-2 text-lg font-bold text-slate-900">{s0.perkara}</h1>
          <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div><span className="text-slate-500">No. Rujukan:</span> <b>{s0.no_rujukan || "—"}</b></div>
            <div><span className="text-slate-500">Tarikh terima:</span> <b>{s0.tarikh ? tarikhMs(s0.tarikh) : "—"}</b></div>
            <div className="col-span-2"><span className="text-slate-500">Daripada:</span> <b>{s0.pihak || "—"}</b></div>
            <div className="col-span-2"><span className="text-slate-500">Status:</span> <b>{labelStatusSurat(s0.status)}</b></div>
          </div>
          {s0.catatan && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{s0.catatan}</p>}
          {s0.url_fail && (
            <button onClick={bukaLampiran} className="mt-4 rounded-lg bg-surau px-4 py-2 text-sm font-semibold text-white hover:bg-surau-dark">📎 Buka Lampiran</button>
          )}
        </div>
      )}

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
