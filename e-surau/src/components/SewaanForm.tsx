"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { rm, dataURLtoBlob } from "@/lib/format";
import { RUANG, PERALATAN, STATUS_PEMOHON, JENIS_ACARA, KAEDAH_BAYAR, SYARAT_SEWAAN } from "@/lib/sewaan";
import { BANK_SURAU } from "@/lib/tetapan";
import { mohonSewaan, mulaBayaranSewaan } from "@/app/sewaan/actions";
import SignaturePad from "@/components/SignaturePad";

export default function SewaanForm({ bayaranDibuka = false }: { bayaranDibuka?: boolean }) {
  const [f, setF] = useState<any>({
    nama_pemohon: "", no_kp: "", status_pemohon: "Ahli Kariah SAR", alamat: "", telefon: "", whatsapp: "", emel: "",
    nama_program: "", jenis_acara: "Majlis Akad Nikah", tarikh_acara: "", masa_mula: "", masa_tamat: "",
    anggaran_kehadiran: "", butiran: "", kaedah_bayar: "Tunai",
  });
  const [ruangSel, setRuangSel] = useState<Set<string>>(new Set());
  const [pQty, setPQty] = useState<Record<string, number>>({});
  const [akujanji, setAkujanji] = useState(false);
  const [ttd, setTtd] = useState<string | null>(null);
  const [hantar, setHantar] = useState(false);
  const [langkah, setLangkah] = useState(1);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);
  const [sewaanId, setSewaanId] = useState<string>("");
  const [bayarEmel, setBayarEmel] = useState<string>("");
  const [bayarSedang, setBayarSedang] = useState(false);
  const [bayarRalat, setBayarRalat] = useState("");

  const set = (k: string, v: any) => setF((s: any) => ({ ...s, [k]: v }));
  const toggleRuang = (nama: string) => setRuangSel((s) => { const n = new Set(s); n.has(nama) ? n.delete(nama) : n.add(nama); return n; });

  const jumlahRuang = RUANG.filter((r) => ruangSel.has(r.nama)).reduce((s, r) => s + r.kadar, 0);
  const jumlahPeralatan = PERALATAN.reduce((s, p) => s + (pQty[p.nama] || 0) * p.kadar, 0);
  const keseluruhan = jumlahRuang + jumlahPeralatan;
  const deposit = keseluruhan * 0.5;

  async function uploadTtd(dataUrl: string): Promise<string> {
    const supabase = createClient();
    const blob = dataURLtoBlob(dataUrl);
    const path = `${crypto.randomUUID()}-sewaan-ttd.png`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, blob, { contentType: "image/png" });
    if (error) throw new Error(error.message);
    return `salinan-kp/${path}`;
  }

  function keSeterusnya() {
    if (!f.nama_pemohon.trim()) { setSelesai({ ok: false, msg: "Sila isi Nama Penuh dahulu." }); return; }
    if (!f.telefon.trim() && !f.emel.trim()) { setSelesai({ ok: false, msg: "Sila isi sekurang-kurangnya No. Bimbit atau E-mel." }); return; }
    setSelesai(null);
    setLangkah(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function keSebelum() {
    setSelesai(null);
    setLangkah(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.nama_pemohon || !f.tarikh_acara) { setSelesai({ ok: false, msg: "Sila isi Nama & Tarikh Acara." }); return; }
    if (ruangSel.size === 0) { setSelesai({ ok: false, msg: "Sila pilih sekurang-kurangnya satu ruang/tempat." }); return; }
    if (!akujanji) { setSelesai({ ok: false, msg: "Sila tandakan akujanji." }); return; }
    if (!ttd) { setSelesai({ ok: false, msg: "Sila turunkan tandatangan." }); return; }
    setHantar(true);
    let urlTtd = "";
    try { urlTtd = await uploadTtd(ttd); } catch (err: any) { setHantar(false); setSelesai({ ok: false, msg: "Gagal simpan tandatangan: " + err.message }); return; }
    const res = await mohonSewaan({
      ...f,
      ruang: RUANG.filter((r) => ruangSel.has(r.nama)).map((r) => ({ nama: r.nama, kadar: r.kadar })),
      peralatan: PERALATAN.filter((p) => (pQty[p.nama] || 0) > 0).map((p) => ({ nama: p.nama, unit: p.unit, kuantiti: pQty[p.nama], kadar: p.kadar })),
      jumlah_ruang: jumlahRuang, jumlah_peralatan: jumlahPeralatan, jumlah_keseluruhan: keseluruhan, deposit,
      url_tandatangan: urlTtd,
    });
    setHantar(false);
    if (!res.ok) { setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    setSewaanId(res.id ?? "");
    setBayarEmel(f.emel || "");
    setSelesai({ ok: true, msg: `Permohonan berjaya dihantar! No. Rujukan: ${res.no}. AJK akan proses dalam 3–5 hari bekerja.` });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function bayarSekarang() {
    setBayarRalat("");
    if (!bayarEmel || !bayarEmel.includes("@")) { setBayarRalat("Sila isi e-mel yang sah untuk pembayaran & resit."); return; }
    setBayarSedang(true);
    const res = await mulaBayaranSewaan(sewaanId, bayarEmel);
    if (!res.ok) { setBayarSedang(false); setBayarRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  if (selesai?.ok) {
    const perluBayar = keseluruhan + deposit;
    return (
      <div className="space-y-4">
        <div className="rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
          <h2 className="text-xl font-bold text-slate-900">Terima kasih!</h2>
          <p className="mt-2 text-slate-600">{selesai.msg}</p>
        </div>

        {sewaanId && perluBayar > 0 && !bayaranDibuka && (
          <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5 text-sm">
            <h3 className="font-semibold text-surau">Cara Pembayaran</h3>
            <div className="mt-2 flex justify-between font-bold text-slate-900"><span>Jumlah Perlu Dibayar</span><span>{rm(perluBayar)}</span></div>
            <p className="mt-2 text-xs text-slate-500">Bayaran online sedang diselenggara buat sementara waktu. Sila bayar melalui:</p>
            <div className="mt-2 rounded-lg bg-white p-3 leading-relaxed">
              <div><span className="text-slate-500">Pindahan bank:</span> <b>{BANK_SURAU.bank}</b> · <b className="font-mono">{BANK_SURAU.no_akaun}</b> · {BANK_SURAU.nama_akaun}</div>
              <div className="mt-1 text-slate-600">Atau bayar <b>tunai di pejabat surau</b>.</div>
            </div>
            <p className="mt-2 text-xs text-slate-500">Sila simpan resit &amp; kemukakan kepada AJK. Rujuk <a href="/polisi-bayaran-balik" target="_blank" className="text-surau underline">Polisi Bayaran Balik</a>.</p>
          </div>
        )}
        {sewaanId && perluBayar > 0 && bayaranDibuka && (
          <div className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
            <h3 className="font-semibold text-surau">Bayar Sekarang (Online)</h3>
            <div className="mt-2 space-y-1 text-sm text-slate-700">
              <div className="flex justify-between"><span>Sewaan</span><span>{rm(keseluruhan)}</span></div>
              <div className="flex justify-between"><span>Deposit (50%)</span><span>{rm(deposit)}</span></div>
              <div className="flex justify-between border-t pt-1 font-bold text-slate-900"><span>Jumlah Perlu Dibayar</span><span>{rm(perluBayar)}</span></div>
            </div>
            <label className="mt-3 block">
              <span className="mb-1 block text-sm font-medium text-slate-700">E-mel (untuk resit)</span>
              <input className="inp" type="email" value={bayarEmel} onChange={(e) => setBayarEmel(e.target.value)} placeholder="emel@contoh.com" />
            </label>
            {bayarRalat && <p className="mt-2 text-sm text-red-600">{bayarRalat}</p>}
            <button
              type="button"
              onClick={bayarSekarang}
              disabled={bayarSedang}
              className="mt-3 w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60"
            >
              {bayarSedang ? "Menyambung ke gerbang bayaran…" : `Bayar ${rm(perluBayar)} (FPX / Kad / e-Wallet)`}
            </button>
            <p className="mt-2 text-center text-xs text-slate-500">Bayaran diproses oleh CHIP. Atau anda boleh bayar tunai di pejabat surau.</p>
            <p className="text-center text-xs text-slate-500">Dengan membayar, anda bersetuju dengan <a href="/polisi-bayaran-balik" target="_blank" className="text-surau underline">Polisi Bayaran Balik & Pembatalan</a>.</p>
          </div>
        )}
        <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {/* Penunjuk langkah */}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 ${langkah === 1 ? "bg-surau text-white" : "bg-green-100 text-green-700"}`}>
          {langkah > 1 ? "✓" : "1"} Maklumat Pemohon
        </span>
        <span className="h-px flex-1 bg-slate-200" />
        <span className={`rounded-full px-3 py-1 ${langkah === 2 ? "bg-surau text-white" : "bg-slate-100 text-slate-400"}`}>
          2 Butiran &amp; Bayaran
        </span>
      </div>

      {selesai && !selesai.ok && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>}

      <section className={`space-y-3 rounded-xl bg-white p-5 shadow-sm ${langkah === 1 ? "" : "hidden"}`}>
        <h2 className="font-semibold text-surau">A. Maklumat Pemohon</h2>
        <F l="Nama Penuh *"><input className="inp" value={f.nama_pemohon} onChange={(e) => set("nama_pemohon", e.target.value)} /></F>
        <F l="No. Kad Pengenalan"><input className="inp" value={f.no_kp} onChange={(e) => set("no_kp", e.target.value)} /></F>
        <F l="Status Pemohon">
          <select className="inp" value={f.status_pemohon} onChange={(e) => set("status_pemohon", e.target.value)}>
            {STATUS_PEMOHON.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </F>
        <F l="Alamat"><textarea className="inp" rows={2} value={f.alamat} onChange={(e) => set("alamat", e.target.value)} /></F>
        <div className="grid gap-3 sm:grid-cols-3">
          <F l="No. Bimbit"><input className="inp" value={f.telefon} onChange={(e) => set("telefon", e.target.value)} /></F>
          <F l="WhatsApp"><input className="inp" value={f.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></F>
          <F l="E-mel"><input className="inp" type="email" value={f.emel} onChange={(e) => set("emel", e.target.value)} /></F>
        </div>
      </section>

      {langkah === 1 && (
        <button type="button" onClick={keSeterusnya} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark">
          Seterusnya →
        </button>
      )}

      <div className={langkah === 2 ? "space-y-6" : "hidden"}>
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">B. Maklumat Acara / Program</h2>
        <F l="Nama Program"><input className="inp" value={f.nama_program} onChange={(e) => set("nama_program", e.target.value)} /></F>
        <F l="Jenis Acara">
          <select className="inp" value={f.jenis_acara} onChange={(e) => set("jenis_acara", e.target.value)}>
            {JENIS_ACARA.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </F>
        <div className="grid gap-3 sm:grid-cols-2">
          <F l="Tarikh Acara *"><input className="inp" type="date" value={f.tarikh_acara} onChange={(e) => set("tarikh_acara", e.target.value)} /></F>
          <F l="Anggaran Kehadiran"><input className="inp" type="number" min="0" value={f.anggaran_kehadiran} onChange={(e) => set("anggaran_kehadiran", e.target.value)} /></F>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <F l="Masa Mula"><input className="inp" type="time" value={f.masa_mula} onChange={(e) => set("masa_mula", e.target.value)} /></F>
          <F l="Masa Tamat"><input className="inp" type="time" value={f.masa_tamat} onChange={(e) => set("masa_tamat", e.target.value)} /></F>
        </div>
        <F l="Butiran Program"><textarea className="inp" rows={3} value={f.butiran} onChange={(e) => set("butiran", e.target.value)} /></F>
      </section>

      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">C1. Ruang / Tempat</h2>
        {RUANG.map((r) => (
          <label key={r.nama} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <span className="flex items-center gap-2">
              <input type="checkbox" checked={ruangSel.has(r.nama)} onChange={() => toggleRuang(r.nama)} />
              <span><b>{r.nama}</b> <span className="text-slate-400">· {r.kapasiti}</span></span>
            </span>
            <span className="font-semibold text-slate-700">{rm(r.kadar)}</span>
          </label>
        ))}

        <h2 className="pt-2 font-semibold text-surau">C2. Peralatan</h2>
        {PERALATAN.map((p) => (
          <div key={p.nama} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 text-sm">
            <span><b>{p.nama}</b> <span className="text-slate-400">· {p.unit} · {rm(p.kadar)}</span></span>
            <input type="number" min="0" placeholder="0" className="w-20 rounded border border-slate-300 px-2 py-1 text-right"
              value={pQty[p.nama] || ""} onChange={(e) => setPQty((s) => ({ ...s, [p.nama]: Number(e.target.value) || 0 }))} />
          </div>
        ))}
      </section>

      <section className="space-y-2 rounded-xl border-2 border-surau/30 bg-surau/5 p-5 text-sm">
        <h2 className="font-semibold text-surau">D. Pengiraan Kos</h2>
        <Baris k="Jumlah Sewaan Ruang" v={rm(jumlahRuang)} />
        <Baris k="Jumlah Sewaan Peralatan" v={rm(jumlahPeralatan)} />
        <Baris k="JUMLAH KESELURUHAN" v={rm(keseluruhan)} tebal />
        <Baris k="Deposit Keselamatan (50%)" v={rm(deposit)} />
        <F l="Kaedah Pembayaran">
          <select className="inp" value={f.kaedah_bayar} onChange={(e) => set("kaedah_bayar", e.target.value)}>
            {KAEDAH_BAYAR.map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </F>
      </section>

      <section className="rounded-xl bg-white p-5 text-sm shadow-sm">
        <h2 className="mb-2 font-semibold text-surau">E. Syarat-Syarat Sewaan</h2>
        <ol className="list-decimal space-y-1 pl-5 text-slate-600">
          {SYARAT_SEWAAN.map((s, i) => <li key={i}>{s}</li>)}
        </ol>
        <p className="mt-2 text-xs text-slate-500">
          Rujuk <a href="/polisi-bayaran-balik" target="_blank" className="font-medium text-surau underline">Polisi Bayaran Balik & Pembatalan</a> untuk terma refund deposit & pembatalan.
        </p>
      </section>

      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">F. Akujanji Pemohon</h2>
        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" className="mt-1" checked={akujanji} onChange={(e) => setAkujanji(e.target.checked)} />
          <span>Saya mengaku telah membaca & bersetuju dengan semua syarat sewaan, dan bertanggungjawab sepenuhnya terhadap keselamatan & kebersihan sepanjang penggunaan. Maklumat yang diberikan adalah benar.</span>
        </label>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Tandatangan Pemohon *</span>
          <SignaturePad onChange={setTtd} />
        </div>
      </section>

      <div className="flex gap-3">
        <button type="button" onClick={keSebelum} className="rounded-lg border border-slate-300 px-6 py-3 font-semibold text-slate-600 hover:bg-slate-50">
          ← Kembali
        </button>
        <button type="submit" disabled={hantar} className="flex-1 rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
          {hantar ? "Menghantar…" : "Hantar Permohonan Sewaan"}
        </button>
      </div>
      </div>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{l}</span>{children}</label>);
}
function Baris({ k, v, tebal }: { k: string; v: string; tebal?: boolean }) {
  return (<div className={`flex justify-between ${tebal ? "border-t pt-1 font-bold text-slate-900" : "text-slate-600"}`}><span>{k}</span><span>{v}</span></div>);
}
