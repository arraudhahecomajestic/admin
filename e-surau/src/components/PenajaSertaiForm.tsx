"use client";

import { useRef, useState } from "react";
import { PAKEJ_PENAJA, TEMPOH_PENAJA } from "@/lib/tetapan";
import { hargaPenaja } from "@/lib/penaja";
import { mulaTajaanPenaja } from "@/app/rakan/sertai/actions";
import { rm } from "@/lib/format";

export default function PenajaSertaiForm() {
  const [kod, setKod] = useState<string>("emas");
  const [bulan, setBulan] = useState<number>(3);
  const [nama, setNama] = useState("");
  const [emel, setEmel] = useState("");
  const [telefon, setTelefon] = useState("");
  const [pautan, setPautan] = useState("");
  const [kategori, setKategori] = useState("");
  const logoRef = useRef<HTMLInputElement>(null);
  const [logoPrev, setLogoPrev] = useState("");
  const [setuju, setSetuju] = useState(false);
  const [sedang, setSedang] = useState(false);
  const [ralat, setRalat] = useState("");

  const harga = hargaPenaja(kod, bulan);
  const pakejNama = PAKEJ_PENAJA.find((p) => p.kod === kod)?.nama ?? "";
  const isDir = kod === "direktori";

  async function hantar() {
    setRalat("");
    if (nama.trim().length < 2) { setRalat("Sila isi nama syarikat / perniagaan."); return; }
    if (!emel.includes("@")) { setRalat("Sila isi e-mel yang sah untuk resit."); return; }
    if (!setuju) { setRalat("Sila baca & tanda setuju dengan akad penajaan dahulu."); return; }
    setSedang(true);
    const fd = new FormData();
    fd.set("pakej", kod);
    fd.set("bulan", String(bulan));
    fd.set("setuju", "1");
    fd.set("nama", nama);
    fd.set("emel", emel);
    fd.set("telefon", telefon);
    fd.set("pautan", pautan);
    fd.set("kategori", kategori);
    const f = logoRef.current?.files?.[0];
    if (f) fd.set("logo", f);
    const res = await mulaTajaanPenaja(fd);
    if (!res.ok) { setSedang(false); setRalat(res.msg ?? "Ralat pembayaran."); return; }
    if (res.checkout_url) window.location.href = res.checkout_url;
  }

  return (
    <div className="space-y-5">
      {/* Pilih pakej */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">1. Pilih Pakej Tajaan</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {PAKEJ_PENAJA.map((p) => {
            const dipilih = kod === p.kod;
            const label = `${rm(p.harga_bulan)} / bulan`;
            return (
              <button
                key={p.kod}
                onClick={() => setKod(p.kod)}
                className={`rounded-xl border-2 p-4 text-left transition ${dipilih ? "border-surau bg-surau/5" : "border-slate-200 hover:border-surau/40"}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{p.nama}</span>
                  <span className={`text-sm font-bold ${dipilih ? "text-surau-dark" : "text-slate-600"}`}>{label}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{p.huraian}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tempoh */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">2. Tempoh Tajaan</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {TEMPOH_PENAJA.map((b) => (
            <button
              key={b}
              onClick={() => setBulan(b)}
              className={`rounded-lg border-2 py-3 text-center font-bold ${bulan === b ? "border-surau bg-surau/10 text-surau-dark" : "border-slate-200 text-slate-700 hover:border-surau/40"}`}
            >
              {b} bln
            </button>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between rounded-lg bg-surau/5 px-4 py-3">
          <span className="text-sm text-slate-600">Jumlah bayaran</span>
          <span className="text-2xl font-extrabold text-surau">{rm(harga)}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Logo & tersenarai untuk tempoh dipilih. Tamat tempoh, ia akan luput automatik.</p>
      </div>

      {/* Butiran penaja */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">3. Maklumat Penaja</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Nama Syarikat / Perniagaan *</span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">E-mel (untuk resit) *</span>
            <input type="email" value={emel} onChange={(e) => setEmel(e.target.value)} placeholder="emel@syarikat.com" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">No. Telefon / WhatsApp</span>
            <input value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="0123456789" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Pautan Laman / Media Sosial</span>
            <input value={pautan} onChange={(e) => setPautan(e.target.value)} placeholder="https://…" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">Jenis Perniagaan (untuk direktori)</span>
            <input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="cth: Makanan, Kesihatan, Runcit" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-surau" />
          </label>
          <label className="block sm:col-span-2">
            <span className="mb-1 block text-sm font-medium text-slate-700">Logo (PNG/JPG, maks 3MB)</span>
            <input ref={logoRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => { const f = e.target.files?.[0]; setLogoPrev(f ? URL.createObjectURL(f) : ""); }} className="w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-surau/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-surau" />
            <span className="mt-1 block text-xs text-slate-400">Logo akan dipapar automatik selepas bayaran disahkan.</span>
          </label>
        </div>
      </div>

      {/* Contoh paparan langsung — ikut pakej & logo dipilih */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="flex flex-wrap items-center gap-2 font-semibold text-slate-900">
          Contoh Paparan
          {pakejNama && <span className="rounded-md bg-surau px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">Pakej {pakejNama}</span>}
        </h2>
        <p className="mb-3 mt-0.5 text-xs text-slate-500">Beginilah rupa brand anda selepas bayaran — ikut pakej &amp; logo yang dipilih.</p>
        {isDir ? (
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">Di direktori /rakan</div>
            <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 text-sm">
              <span className="font-medium text-slate-700">{nama || "Nama Perniagaan Anda"}{kategori ? <span className="ml-2 text-xs text-slate-400">{kategori}</span> : null}</span>
              <span className="font-semibold text-surau">Lihat &rarr;</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">Pakej Direktori papar nama sahaja &mdash; tiada logo.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">Di laman utama (strip)</div>
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-amber-50/60 p-3">
                <Slot big={kod === "emas"} logo={logoPrev} />
                <div className="flex h-12 w-24 items-center justify-center rounded-lg border border-slate-200 bg-white text-[11px] text-slate-300">Penaja lain</div>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-amber-700/80">Di direktori /rakan</div>
              <div className="mt-2 max-w-xs rounded-xl border border-slate-200 p-3">
                <div className="flex items-center gap-3">
                  <Slot logo={logoPrev} />
                  <div className="font-semibold text-slate-900">{nama || "Nama Perniagaan Anda"}</div>
                </div>
                {pakejNama && <span className="mt-2 inline-block rounded bg-surau/10 px-2 py-0.5 text-[10px] font-bold text-surau-dark">{pakejNama}</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      <label className="flex items-start gap-3 rounded-xl bg-white p-4 text-sm shadow-sm">
        <input type="checkbox" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} className="mt-0.5 h-4 w-4 flex-none accent-surau" />
        <span className="text-slate-700">
          Saya telah membaca &amp; bersetuju dengan{" "}
          <a href="/rakan/akad" target="_blank" rel="noreferrer" className="font-semibold text-surau underline">Akad Penajaan</a>
          {" "}Rakan Surau. Akad rasmi akan dijana automatik selepas bayaran.
        </span>
      </label>

      {ralat && <p className="text-sm text-red-600">{ralat}</p>}

      <button onClick={hantar} disabled={sedang || !setuju} className="w-full rounded-lg bg-surau px-6 py-3.5 text-base font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {sedang ? "Menyambung ke gerbang bayaran…" : `Bayar Tajaan ${rm(harga)} (FPX / Kad / e-Wallet)`}
      </button>
      <p className="text-center text-xs text-slate-400">Logo & penyenaraian akan aktif automatik sebaik bayaran disahkan, dan luput automatik bila tamat tempoh.</p>
    </div>
  );
}

function Slot({ big, logo }: { big?: boolean; logo?: string }) {
  const cls = big ? "h-14 w-28" : "h-12 w-24";
  return (
    <div className={`flex ${cls} flex-none items-center justify-center rounded-lg border-2 border-surau bg-white p-1`}>
      {logo
        ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt="Logo anda" className="max-h-full max-w-full object-contain" />
        : <span className="text-[11px] font-bold text-surau-dark">LOGO ANDA</span>}
    </div>
  );
}
