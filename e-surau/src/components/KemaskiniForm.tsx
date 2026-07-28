"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { simpanKemaskini, cariAhliIkutKp } from "@/app/ahli/kemaskini/actions";
import { layakKhairat, umurDari, tarikhLahirDariKp } from "@/lib/khairat";
import { GELARAN } from "@/lib/tetapan";
import SignaturePad from "@/components/SignaturePad";
import KameraKp from "@/components/KameraKp";

type Tgg = {
  nama: string;
  no_kp: string;
  hubungan: string;
  tarikh_lahir: string;
  oku: boolean;
  masih_belajar: boolean;
  dilindungi_khairat: boolean;
};

export default function KemaskiniForm({ awal }: { awal: any }) {
  const router = useRouter();
  const [gelaran, setGelaran] = useState(awal.gelaran ?? "");
  const [nama, setNama] = useState(awal.nama ?? "");
  const [noKp, setNoKp] = useState(awal.no_kp ?? "");
  const [alamatKp, setAlamatKp] = useState(awal.alamat_kp ?? "");
  const [alamat, setAlamat] = useState(awal.alamat ?? "");
  const [telRumah, setTelRumah] = useState(awal.no_telefon_rumah ?? "");
  const [hp, setHp] = useState(awal.telefon ?? "");
  const [emel, setEmel] = useState(awal.emel ?? "");
  const [statusKahwin, setStatusKahwin] = useState(awal.status_perkahwinan ?? "berkahwin");
  const [tempohNilai, setTempohNilai] = useState(awal.tempoh_menetap_nilai?.toString() ?? "");
  const [tempohUnit, setTempohUnit] = useState(awal.tempoh_menetap_unit ?? "tahun");
  const [urlDepan, setUrlDepan] = useState(awal.url_kp_depan ?? "");
  const [urlBelakang, setUrlBelakang] = useState(awal.url_kp_belakang ?? "");
  const [muatNaik, setMuatNaik] = useState<"" | "depan" | "belakang">("");
  const [urlSelfie, setUrlSelfie] = useState(awal.url_selfie ?? "");
  const [muatSelfie, setMuatSelfie] = useState(false);
  const [urlTtd, setUrlTtd] = useState(awal.url_tandatangan ?? "");
  const [ttdBaru, setTtdBaru] = useState<string | null>(null);
  const [alamatSama, setAlamatSama] = useState<boolean>(
    !!awal.alamat_kp && awal.alamat_kp === awal.alamat
  );
  const [tanggungan, setTanggungan] = useState<Tgg[]>(
    (awal.tanggungan ?? []).map((t: any) => ({
      nama: t.nama ?? "", no_kp: t.no_kp ?? "", hubungan: t.hubungan ?? "anak",
      tarikh_lahir: t.tarikh_lahir ?? "", oku: t.oku ?? false, masih_belajar: t.masih_belajar ?? false,
      dilindungi_khairat: t.dilindungi_khairat ?? true,
    }))
  );
  const [hantar, setHantar] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);
  const [setuju, setSetuju] = useState(false);

  function ubahT(i: number, k: keyof Tgg, v: any) {
    setTanggungan((t) => t.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  }

  // Bila No. KP tanggungan diubah — auto-kira tarikh lahir dari IC/MyKid.
  function ubahKpTgg(i: number, val: string) {
    setTanggungan((t) =>
      t.map((r, idx) =>
        idx === i ? { ...r, no_kp: val, tarikh_lahir: tarikhLahirDariKp(val) ?? r.tarikh_lahir } : r
      )
    );
  }

  // Bila No. KP tanggungan dimasukkan & dia juga ahli kariah — auto-isi nama.
  async function cariNamaT(i: number, kp: string) {
    if (kp.replace(/\D/g, "").length < 6) return;
    const res = await cariAhliIkutKp(kp);
    if (res.ok && res.nama) ubahT(i, "nama", res.nama);
  }

  async function naikKp(sisi: "depan" | "belakang", fail: Blob) {
    setMuatNaik(sisi);
    const supabase = createClient();
    const path = `${crypto.randomUUID()}-${sisi}.jpg`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail, { contentType: (fail as any).type || "image/jpeg" });
    setMuatNaik("");
    if (error) { setSelesai({ ok: false, msg: `Gagal muat naik IC (${sisi}): ${error.message}` }); return; }
    if (sisi === "depan") setUrlDepan(`salinan-kp/${path}`); else setUrlBelakang(`salinan-kp/${path}`);
  }

  async function snapSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setMuatSelfie(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}-selfie.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuatSelfie(false);
    if (error) { setSelesai({ ok: false, msg: `Gagal muat naik swafoto: ${error.message}` }); return; }
    setUrlSelfie(`salinan-kp/${path}`);
  }

  async function uploadTtd(dataUrl: string): Promise<string> {
    const supabase = createClient();
    const blob = await (await fetch(dataUrl)).blob();
    const path = `${crypto.randomUUID()}-ttd.png`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, blob, { contentType: "image/png" });
    if (error) throw new Error(error.message);
    return `salinan-kp/${path}`;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nama || !noKp || !hp) { setSelesai({ ok: false, msg: "Sila lengkapkan Nama, No. KP dan No. H/P." }); return; }
    if (!urlDepan || !urlBelakang) { setSelesai({ ok: false, msg: "Sila muat naik gambar Kad Pengenalan (depan & belakang)." }); return; }
    if (!ttdBaru && !urlTtd) { setSelesai({ ok: false, msg: "Sila turunkan e-tandatangan anda." }); return; }
    if (!urlSelfie) { setSelesai({ ok: false, msg: "Sila ambil swafoto (selfie) untuk pengesahan." }); return; }
    if (!setuju) { setSelesai({ ok: false, msg: "Sila bersetuju dengan Dasar Privasi & Terma Penggunaan sebelum menghantar." }); return; }
    setHantar(true);
    let ttdPath = urlTtd;
    if (ttdBaru) {
      try { ttdPath = await uploadTtd(ttdBaru); }
      catch (err: any) { setHantar(false); setSelesai({ ok: false, msg: `Gagal simpan tandatangan: ${err.message}` }); return; }
    }
    const UP = (s: string) => (s || "").toUpperCase();
    const res = await simpanKemaskini({
      gelaran, nama: UP(nama), no_kp: noKp,
      alamat_kp: UP(alamatKp), alamat: UP(alamatSama ? alamatKp : alamat), no_telefon_rumah: telRumah,
      telefon: hp, emel: emel.trim().toLowerCase(), status_perkahwinan: statusKahwin,
      tempoh_menetap_nilai: tempohNilai, tempoh_menetap_unit: tempohUnit,
      url_kp_depan: urlDepan, url_kp_belakang: urlBelakang,
      url_tandatangan: ttdPath, url_selfie: urlSelfie,
      tanggungan: tanggungan.filter((t) => t.nama.trim()).map((t) => ({ ...t, nama: UP(t.nama) })),
    });
    setHantar(false);
    if (!res.ok) { setSelesai({ ok: false, msg: res.msg ?? "Ralat." }); return; }
    setSelesai({ ok: true, msg: "Maklumat anda telah dikemas kini & disahkan. Terima kasih!" });
    window.scrollTo({ top: 0, behavior: "smooth" });
    router.refresh();
  }

  if (selesai?.ok) {
    return (
      <div className="rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h1 className="text-xl font-bold text-slate-900">Berjaya!</h1>
        <p className="mt-2 text-slate-600">{selesai.msg}</p>
        <a href="/ahli" className="mt-5 inline-block rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark">Kembali ke Portal</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {selesai && !selesai.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>
      )}

      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">Maklumat Diri</h2>
        <F label="Gelaran">
          <select className="inp" value={gelaran} onChange={(e) => setGelaran(e.target.value)}>
            <option value="">— Tiada —</option>
            {GELARAN.map((g) => (<option key={g} value={g}>{g}</option>))}
          </select>
        </F>
        <F label="Nama Penuh *"><input className="inp uppercase" value={nama} onChange={(e) => setNama(e.target.value.toUpperCase())} /></F>
        <F label="No. Kad Pengenalan *"><input className="inp" value={noKp} onChange={(e) => setNoKp(e.target.value)} /></F>
        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Gambar Kad Pengenalan (letak kad dalam kotak, kemudian snap)</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <KameraKp label="IC Depan" ada={!!urlDepan} sedang={muatNaik === "depan"} onBlob={(b) => naikKp("depan", b)} />
            <KameraKp label="IC Belakang" ada={!!urlBelakang} sedang={muatNaik === "belakang"} onBlob={(b) => naikKp("belakang", b)} />
          </div>
        </div>
        <F label="Alamat Dalam KP / Passport"><textarea className="inp uppercase" rows={2} value={alamatKp} onChange={(e) => setAlamatKp(e.target.value.toUpperCase())} /></F>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={alamatSama}
            onChange={(e) => { setAlamatSama(e.target.checked); if (e.target.checked) setAlamat(alamatKp); }}
          />
          Alamat tempat tinggal sama seperti alamat dalam KP
        </label>
        {!alamatSama && (
          <F label="Alamat Tempat Tinggal Sekarang"><textarea className="inp uppercase" rows={2} value={alamat} onChange={(e) => setAlamat(e.target.value.toUpperCase())} /></F>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <F label="No. Telefon Rumah"><input className="inp" value={telRumah} onChange={(e) => setTelRumah(e.target.value)} /></F>
          <F label="No. H/P *"><input className="inp" value={hp} onChange={(e) => setHp(e.target.value)} /></F>
          <F label="E-mel"><input className="inp" type="email" value={emel} onChange={(e) => setEmel(e.target.value)} /></F>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <F label="Status Perkahwinan">
            <select className="inp" value={statusKahwin} onChange={(e) => setStatusKahwin(e.target.value)}>
              <option value="bujang">Bujang</option>
              <option value="berkahwin">Sudah Berkahwin</option>
              <option value="duda">Duda</option>
              <option value="janda">Janda</option>
            </select>
          </F>
          <F label="Tempoh Masa Menetap">
            <div className="flex gap-2">
              <input className="inp" type="number" min="0" value={tempohNilai} onChange={(e) => setTempohNilai(e.target.value)} />
              <select className="inp w-28" value={tempohUnit} onChange={(e) => setTempohUnit(e.target.value)}>
                <option value="tahun">Tahun</option>
                <option value="bulan">Bulan</option>
              </select>
            </div>
          </F>
        </div>
      </section>

      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Tanggungan / Isi Rumah</h2>
          <button type="button" onClick={() => setTanggungan((t) => [...t, { nama: "", no_kp: "", hubungan: "anak", tarikh_lahir: "", oku: false, masih_belajar: false, dilindungi_khairat: true }])} className="rounded-lg bg-surau/10 px-3 py-1.5 text-sm font-semibold text-surau hover:bg-surau/20">+ Tambah</button>
        </div>
        <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
          <b>Penting untuk khairat:</b> senaraikan pasangan & anak (21 tahun ke bawah).
          Layak juga: anak OKU (tanpa had umur) & anak masih belajar (hingga 25 tahun), serta
          ibu/bapa yang ditanggung. Isi <b>Nama penuh</b> & <b>No. KP / MyKid</b> setiap anak.
          Jika pasangan/anak sudah ahli kariah, masukkan No. KP mereka — nama akan diisi automatik.
        </p>
        {tanggungan.length === 0 && <p className="text-sm text-slate-500">Tiada tanggungan.</p>}
        {tanggungan.map((t, i) => {
          const status = layakKhairat(t);
          return (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="inp" value={t.hubungan} onChange={(e) => ubahT(i, "hubungan", e.target.value)}>
                <option value="pasangan">Pasangan</option><option value="anak">Anak</option>
                <option value="ibu">Ibu</option><option value="bapa">Bapa</option><option value="lain">Lain-lain</option>
              </select>
              <input
                className="inp"
                placeholder="No. KP / MyKid"
                value={t.no_kp}
                onChange={(e) => ubahKpTgg(i, e.target.value)}
                onBlur={(e) => cariNamaT(i, e.target.value)}
              />
            </div>
            <input className="inp uppercase" placeholder="Nama penuh" value={t.nama} onChange={(e) => ubahT(i, "nama", e.target.value.toUpperCase())} />
            {(() => {
              const dob = tarikhLahirDariKp(t.no_kp);
              const umur = umurDari(t.tarikh_lahir, t.no_kp);
              if (dob || umur !== null) {
                return (
                  <div className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
                    Tarikh lahir (auto dari No. KP): <b>{dob ?? t.tarikh_lahir}</b>
                    {umur !== null ? <> · <b>{umur} tahun</b></> : null}
                  </div>
                );
              }
              return (
                <label className="block">
                  <span className="mb-1 block text-xs text-slate-500">Tarikh lahir (No. KP tidak lengkap — isi manual)</span>
                  <input className="inp" type="date" value={t.tarikh_lahir} onChange={(e) => ubahT(i, "tarikh_lahir", e.target.value)} />
                </label>
              );
            })()}
            {t.hubungan === "anak" && (
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={t.oku} onChange={(e) => ubahT(i, "oku", e.target.checked)} /> Anak OKU
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={t.masih_belajar} onChange={(e) => ubahT(i, "masih_belajar", e.target.checked)} /> Masih belajar sepenuh masa
                </label>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${status.layak ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                {status.layak ? `✓ Dilindungi khairat · ${status.sebab}` : `Tidak dilindungi · ${status.sebab}`}
              </span>
              <button type="button" onClick={() => setTanggungan((t) => t.filter((_, idx) => idx !== i))} className="text-sm font-medium text-red-600 hover:underline">Padam</button>
            </div>
          </div>
          );
        })}
      </section>

      {/* Pengesahan: e-tandatangan + swafoto */}
      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">Pengesahan Identiti</h2>
        <p className="text-xs text-slate-500">
          Menggantikan borang hardcopy. Sila turunkan tandatangan & ambil swafoto sebagai bukti
          pengesahan diri.
        </p>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">e-Tandatangan *</span>
          {urlTtd && !ttdBaru ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
              ✓ Tandatangan sedia ada.{" "}
              <button type="button" onClick={() => setUrlTtd("")} className="font-medium underline">Tandatangan semula</button>
            </div>
          ) : (
            <SignaturePad onChange={setTtdBaru} />
          )}
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Swafoto (Selfie) *</span>
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-surau">
            <input type="file" accept="image/*" capture="user" className="hidden" onChange={snapSelfie} />
            {urlSelfie ? <span className="text-sm font-medium text-green-600">✓ Swafoto ada — ketik untuk ambil semula</span>
              : muatSelfie ? <span className="text-sm text-amber-600">Memuat naik…</span>
              : <><span className="text-2xl">🤳</span><span className="mt-1 text-sm font-medium text-slate-700">Ambil Swafoto</span><span className="text-xs text-slate-400">Kamera hadapan akan terbuka</span></>}
          </label>
        </div>
      </section>

      {/* Persetujuan PDPA — wajib sebelum hantar */}
      <label className="flex items-start gap-3 rounded-xl border-2 border-surau/30 bg-surau/5 p-4 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={setuju} onChange={(e) => setSetuju(e.target.checked)} />
        <span>
          Saya telah membaca &amp; bersetuju dengan{" "}
          <a href="/dasar-privasi" target="_blank" className="font-medium text-surau hover:underline">Dasar Privasi</a> dan{" "}
          <a href="/terma" target="_blank" className="font-medium text-surau hover:underline">Terma Penggunaan</a>,
          serta memberi persetujuan pengumpulan data peribadi (termasuk swafoto &amp; salinan IC) mengikut PDPA. <span className="text-red-500">*</span>
        </span>
      </label>

      <button type="submit" disabled={hantar || muatNaik !== "" || muatSelfie} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menyimpan…" : "Simpan & Sahkan Maklumat"}
      </button>

      <style jsx global>{`
        .inp { width: 100%; border-radius: .5rem; border: 1px solid #cbd5e1; padding: .5rem .75rem; font-size: .875rem; outline: none; }
        .inp:focus { border-color: #b8860b; box-shadow: 0 0 0 2px rgba(184,134,11,.2); }
      `}</style>
    </form>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>{children}</label>);
}

