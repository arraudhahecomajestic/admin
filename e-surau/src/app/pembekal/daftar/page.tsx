"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NAMA_SURAU, SENARAI_BANK } from "@/lib/tetapan";
import { JENIS_PEMBEKAL } from "@/lib/pembekal";
import { simpanPembekal, semakKpPembekal } from "./actions";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function DaftarPembekalPage() {
  const [peringkat, setPeringkat] = useState<"pilih" | "borang">("pilih");
  const [entiti, setEntiti] = useState<"" | "individu" | "syarikat">("");
  const [semakKp, setSemakKp] = useState("");
  const [ssm, setSsm] = useState("");
  const [namaSyarikatGate, setNamaSyarikatGate] = useState("");
  const [gateSedang, setGateSedang] = useState(false);
  const [gateRalat, setGateRalat] = useState("");
  const [nota, setNota] = useState("");

  const [f, setF] = useState<any>({
    jenis: "Vendor", nama: "", syarikat: "", no_ssm: "", no_kp: "", telefon: "", emel: "",
    bank: "Maybank", no_akaun: "", nama_akaun: "",
  });
  const [urlDepan, setUrlDepan] = useState("");
  const [urlBelakang, setUrlBelakang] = useState("");
  const [urlProfil, setUrlProfil] = useState("");
  const [urlKatalog, setUrlKatalog] = useState("");
  const [kl, setKl] = useState("");
  const [kl2, setKl2] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);
  const set = (k: string, v: string) => setF((s: any) => ({ ...s, [k]: v }));

  async function upload(fail: File): Promise<string | null> {
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "dat";
    const path = `pembekal/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    if (error) { setSelesai({ ok: false, msg: "Gagal muat naik: " + error.message }); return null; }
    return `salinan-kp/${path}`;
  }

  // Gate individu: semak No. KP
  async function teruskanIndividu(e: React.FormEvent) {
    e.preventDefault();
    setGateRalat("");
    const kp = semakKp.replace(/\D/g, "");
    if (kp.length < 6) { setGateRalat("Sila masukkan No. KP yang sah."); return; }
    setGateSedang(true);
    const res = await semakKpPembekal(kp);
    setGateSedang(false);
    if (!res.ok) { setGateRalat(res.msg ?? "Ralat."); return; }
    setF((s: any) => ({ ...s, no_kp: kp, nama: res.nama ?? s.nama, telefon: res.telefon ?? s.telefon, emel: res.emel ?? s.emel }));
    setNota(res.wujud ? "✓ Rekod ahli kariah dijumpai — maklumat anda telah diisi automatik." : "");
    setPeringkat("borang");
  }

  // Gate syarikat
  function teruskanSyarikat(e: React.FormEvent) {
    e.preventDefault();
    setGateRalat("");
    if (!namaSyarikatGate.trim()) { setGateRalat("Sila isi nama syarikat."); return; }
    if (!ssm.trim()) { setGateRalat("Sila isi No. SSM."); return; }
    setF((s: any) => ({ ...s, syarikat: namaSyarikatGate.trim(), no_ssm: ssm.trim(), nama: namaSyarikatGate.trim() }));
    setPeringkat("borang");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSelesai(null);
    if (!configured) { setSelesai({ ok: false, msg: "Sistem belum disambung." }); return; }
    if (!f.emel) { setSelesai({ ok: false, msg: "Sila isi e-mel." }); return; }
    if (!f.bank || !f.no_akaun) { setSelesai({ ok: false, msg: "Sila lengkapkan butiran bank." }); return; }
    if (entiti === "individu") {
      if (!f.nama) { setSelesai({ ok: false, msg: "Sila isi nama." }); return; }
      if (!urlDepan || !urlBelakang) { setSelesai({ ok: false, msg: "Sila muat naik IC depan & belakang." }); return; }
    } else {
      if (!f.syarikat || !f.no_ssm) { setSelesai({ ok: false, msg: "Sila isi nama syarikat & No. SSM." }); return; }
    }
    if (kl.length < 6) { setSelesai({ ok: false, msg: "Kata laluan minimum 6 aksara." }); return; }
    if (kl !== kl2) { setSelesai({ ok: false, msg: "Kata laluan tidak sepadan." }); return; }
    if (!setuju) { setSelesai({ ok: false, msg: "Sila bersetuju dengan Dasar Privasi & Terma." }); return; }

    setHantar(true);
    const res = await simpanPembekal({
      jenis_entiti: entiti, jenis: f.jenis, nama: f.nama, syarikat: f.syarikat, no_ssm: f.no_ssm,
      no_kp: f.no_kp, telefon: f.telefon, emel: f.emel, bank: f.bank, no_akaun: f.no_akaun, nama_akaun: f.nama_akaun,
      url_kp_depan: urlDepan, url_kp_belakang: urlBelakang, url_profil_syarikat: urlProfil, url_katalog: urlKatalog,
    });
    if (!res.ok) { setHantar(false); setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: f.emel.trim().toLowerCase(), password: kl,
      options: { data: { nama: f.nama }, emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/selamat-datang` : undefined },
    });
    setHantar(false);
    if (error) {
      const dah = error.message?.toLowerCase().includes("already");
      setSelesai({ ok: false, msg: dah ? "E-mel ini sudah ada akaun. Sila log masuk." : "Ralat cipta akaun: " + error.message });
      return;
    }
    setSelesai({ ok: true, msg: "Pendaftaran berjaya! Sila semak e-mel untuk pengesahan. Akaun akan diaktifkan selepas disahkan oleh AJK surau." });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ---------- Berjaya ----------
  if (selesai?.ok) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h1 className="text-xl font-bold text-slate-900">Terima kasih!</h1>
        <p className="mt-2 text-slate-600">{selesai.msg}</p>
        <Link href="/masuk" className="mt-5 inline-block rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark">Ke Log Masuk</Link>
      </div>
    );
  }

  // ---------- PERINGKAT 1: Gate ----------
  if (peringkat === "pilih") {
    return (
      <div className="mx-auto max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Pendaftaran Pembekal</h1>
          <p className="mt-1 text-sm text-slate-600">{NAMA_SURAU} · vendor, imam, bilal & supplier</p>
        </div>

        {!entiti ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <button onClick={() => setEntiti("individu")} className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center hover:border-surau">
              <div className="text-3xl">👤</div>
              <div className="mt-2 font-semibold text-slate-900">Individu</div>
              <div className="mt-1 text-xs text-slate-500">Perseorangan (imam, bilal, penjaja, dll)</div>
            </button>
            <button onClick={() => setEntiti("syarikat")} className="rounded-xl border-2 border-slate-200 bg-white p-6 text-center hover:border-surau">
              <div className="text-3xl">🏢</div>
              <div className="mt-2 font-semibold text-slate-900">Syarikat</div>
              <div className="mt-1 text-xs text-slate-500">Perniagaan berdaftar (SSM)</div>
            </button>
          </div>
        ) : entiti === "individu" ? (
          <form onSubmit={teruskanIndividu} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Pendaftaran Individu</div>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-slate-700">No. Kad Pengenalan</span>
              <input className="inp" value={semakKp} onChange={(e) => setSemakKp(e.target.value)} placeholder="cth: 850505015123" inputMode="numeric" autoFocus />
              <span className="mt-1 block text-xs text-slate-500">Jika anda ahli kariah, maklumat akan diisi automatik.</span>
            </label>
            {gateRalat && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{gateRalat}</div>}
            <div className="flex gap-2">
              <button disabled={gateSedang} className="flex-1 rounded-lg bg-surau px-6 py-2.5 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">{gateSedang ? "Menyemak…" : "Seterusnya →"}</button>
              <button type="button" onClick={() => setEntiti("")} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600">← Kembali</button>
            </div>
          </form>
        ) : (
          <form onSubmit={teruskanSyarikat} className="space-y-4 rounded-xl bg-white p-6 shadow-sm">
            <div className="text-sm font-semibold text-slate-700">Pendaftaran Syarikat</div>
            <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">Nama Syarikat</span>
              <input className="inp" value={namaSyarikatGate} onChange={(e) => setNamaSyarikatGate(e.target.value)} autoFocus /></label>
            <label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">No. Pendaftaran SSM</span>
              <input className="inp" value={ssm} onChange={(e) => setSsm(e.target.value)} placeholder="cth: 202301012345 / 1234567-A" /></label>
            {gateRalat && <div className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">{gateRalat}</div>}
            <div className="flex gap-2">
              <button className="flex-1 rounded-lg bg-surau px-6 py-2.5 font-semibold text-white hover:bg-surau-dark">Seterusnya →</button>
              <button type="button" onClick={() => setEntiti("")} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-600">← Kembali</button>
            </div>
          </form>
        )}

        <p className="text-center text-sm text-slate-500">Sudah ada akaun? <Link href="/masuk" className="font-medium text-surau hover:underline">Log masuk</Link></p>
        <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
      </div>
    );
  }

  // ---------- PERINGKAT 2: Borang penuh ----------
  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pendaftaran {entiti === "syarikat" ? "Syarikat" : "Individu"}</h1>
        <button type="button" onClick={() => setPeringkat("pilih")} className="mt-1 text-xs text-slate-500 hover:underline">← Tukar jenis</button>
      </div>
      {nota && <div className="rounded-lg border border-green-200 bg-green-50 p-2 text-sm text-green-700">{nota}</div>}
      {selesai && !selesai.ok && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>}

      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <F l="Kategori Pembekal *">
          <select className="inp" value={f.jenis} onChange={(e) => set("jenis", e.target.value)}>
            {JENIS_PEMBEKAL.map((j) => <option key={j} value={j}>{j}</option>)}
          </select>
        </F>
        {entiti === "syarikat" ? (
          <>
            <F l="Nama Syarikat *"><input className="inp" value={f.syarikat} onChange={(e) => set("syarikat", e.target.value)} /></F>
            <F l="No. SSM *"><input className="inp" value={f.no_ssm} onChange={(e) => set("no_ssm", e.target.value)} /></F>
            <F l="Nama Pegawai Untuk Dihubungi"><input className="inp" value={f.nama} onChange={(e) => set("nama", e.target.value)} /></F>
          </>
        ) : (
          <>
            <F l="Nama Penuh *"><input className="inp" value={f.nama} onChange={(e) => set("nama", e.target.value)} /></F>
            <F l="No. Kad Pengenalan"><input className="inp" value={f.no_kp} onChange={(e) => set("no_kp", e.target.value)} /></F>
          </>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <F l="No. Telefon"><input className="inp" value={f.telefon} onChange={(e) => set("telefon", e.target.value)} /></F>
          <F l="E-mel *"><input className="inp" type="email" value={f.emel} onChange={(e) => set("emel", e.target.value)} /></F>
        </div>
      </section>

      {/* Lampiran */}
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">Dokumen</h2>
        {entiti === "syarikat" ? (
          <Muat label="Profil Syarikat (PDF/gambar)" url={urlProfil} onPick={async (fl) => { const u = await upload(fl); if (u) setUrlProfil(u); }} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <Muat label="IC Depan *" url={urlDepan} onPick={async (fl) => { const u = await upload(fl); if (u) setUrlDepan(u); }} />
            <Muat label="IC Belakang *" url={urlBelakang} onPick={async (fl) => { const u = await upload(fl); if (u) setUrlBelakang(u); }} />
          </div>
        )}
        <Muat label="Katalog Produk / Menu Makanan (pilihan)" url={urlKatalog} onPick={async (fl) => { const u = await upload(fl); if (u) setUrlKatalog(u); }} />
      </section>

      {/* Bank */}
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">Butiran Bank (untuk pembayaran)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <F l="Bank *">
            <select className="inp" value={f.bank} onChange={(e) => set("bank", e.target.value)}>
              {SENARAI_BANK.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </F>
          <F l="No. Akaun *"><input className="inp" value={f.no_akaun} onChange={(e) => set("no_akaun", e.target.value)} inputMode="numeric" /></F>
        </div>
        <F l="Nama Pemegang Akaun"><input className="inp" value={f.nama_akaun} onChange={(e) => set("nama_akaun", e.target.value)} /></F>
      </section>

      {/* Akaun */}
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">Akaun Portal</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="inp" type="password" placeholder="Kata laluan (min. 6 aksara)" value={kl} onChange={(e) => setKl(e.target.value)} />
          <input className="inp" type="password" placeholder="Sahkan kata laluan" value={kl2} onChange={(e) => setKl2(e.target.value)} />
        </div>
      </section>

      <label className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm text-slate-700 shadow-sm">
        <input type="checkbox" className="mt-1" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
        <span>
          Saya bersetuju dengan{" "}
          <a href="/dasar-privasi" target="_blank" className="font-medium text-surau hover:underline">Dasar Privasi</a> dan{" "}
          <a href="/terma" target="_blank" className="font-medium text-surau hover:underline">Terma Penggunaan</a>,
          serta membenarkan pengumpulan data mengikut PDPA. *
        </span>
      </label>

      <button type="submit" disabled={hantar} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Mendaftar…" : "Daftar Pembekal"}
      </button>

      <style jsx global>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </form>
  );
}

function F({ l, children }: { l: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{l}</span>{children}</label>);
}

function Muat({ label, url, onPick }: { label: string; url: string; onPick: (f: File) => void }) {
  const [muat, setMuat] = useState(false);
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs hover:border-surau">
      <input type="file" accept="image/*,application/pdf" className="hidden" onChange={async (e) => { const fl = e.target.files?.[0]; if (fl) { setMuat(true); await onPick(fl); setMuat(false); } }} />
      {url ? <span className="font-medium text-green-600">✓ {label} dimuat naik</span>
        : muat ? <span className="text-amber-600">Memuat naik…</span>
        : <><span className="text-lg">📎</span><span className="mt-1 font-medium text-slate-700">{label}</span></>}
    </label>
  );
}
