"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { NAMA_SURAU } from "@/lib/tetapan";

const namaSurau = NAMA_SURAU;
const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

type Tanggungan = {
  nama: string;
  no_kp: string;
  hubungan: string;
  tarikh_lahir: string;
  dilindungi_khairat: boolean;
};
const kosong = (): Tanggungan => ({
  nama: "", no_kp: "", hubungan: "anak", tarikh_lahir: "", dilindungi_khairat: true,
});

export default function DaftarPage() {
  // Bahagian A
  const [nama, setNama] = useState("");
  const [noKp, setNoKp] = useState("");
  const [alamatKp, setAlamatKp] = useState("");
  const [alamatSekarang, setAlamatSekarang] = useState("");
  const [telRumah, setTelRumah] = useState("");
  const [hp, setHp] = useState("");
  const [emel, setEmel] = useState("");
  const [statusKahwin, setStatusKahwin] = useState("bujang");
  const [tempohNilai, setTempohNilai] = useState("");
  const [tempohUnit, setTempohUnit] = useState("tahun");
  const [pengakuan, setPengakuan] = useState(false);

  // Salinan KP — snap kamera (depan & belakang)
  const [urlDepan, setUrlDepan] = useState("");
  const [urlBelakang, setUrlBelakang] = useState("");
  const [muatNaik, setMuatNaik] = useState<"" | "depan" | "belakang">("");

  // Akaun portal ahli (pilihan)
  const [kataLaluan, setKataLaluan] = useState("");
  const [kataLaluan2, setKataLaluan2] = useState("");

  // Khairat + tanggungan
  const [sertaiKhairat, setSertaiKhairat] = useState(true);
  const [tanggungan, setTanggungan] = useState<Tanggungan[]>([]);

  const [hantar, setHantar] = useState(false);
  const [selesai, setSelesai] = useState<null | { ok: boolean; msg: string }>(null);

  function ubahT(i: number, k: keyof Tanggungan, v: any) {
    setTanggungan((t) => t.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  }

  async function snap(sisi: "depan" | "belakang", e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail || !configured) return;
    setMuatNaik(sisi);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "jpg";
    const path = `${crypto.randomUUID()}-${sisi}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail);
    setMuatNaik("");
    if (error) {
      setSelesai({ ok: false, msg: `Gagal muat naik gambar IC (${sisi}): ` + error.message });
      return;
    }
    if (sisi === "depan") setUrlDepan(`salinan-kp/${path}`);
    else setUrlBelakang(`salinan-kp/${path}`);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSelesai(null);
    if (!configured) {
      setSelesai({ ok: false, msg: "Sistem belum disambung ke pangkalan data." });
      return;
    }
    if (!nama || !noKp || !hp) {
      setSelesai({ ok: false, msg: "Sila isi Nama, No. KP dan No. H/P." });
      return;
    }
    if (!pengakuan) {
      setSelesai({ ok: false, msg: "Sila tandakan pengakuan (Bahagian A, no. 8)." });
      return;
    }
    // Jika nak cipta akaun, sahkan kata laluan
    const nakAkaun = kataLaluan.trim() !== "";
    if (nakAkaun) {
      if (!emel) {
        setSelesai({ ok: false, msg: "Sila isi E-mel untuk cipta akaun portal ahli." });
        return;
      }
      if (kataLaluan.length < 6) {
        setSelesai({ ok: false, msg: "Kata laluan mestilah sekurang-kurangnya 6 aksara." });
        return;
      }
      if (kataLaluan !== kataLaluan2) {
        setSelesai({ ok: false, msg: "Kata laluan tidak sepadan." });
        return;
      }
    }
    setHantar(true);
    const supabase = createClient();
    const payload = {
      kariah: namaSurau,
      nama, no_kp: noKp, alamat_kp: alamatKp, alamat: alamatSekarang,
      no_telefon_rumah: telRumah, telefon: hp, emel,
      status_perkahwinan: statusKahwin,
      tempoh_menetap_nilai: tempohNilai, tempoh_menetap_unit: tempohUnit,
      pengakuan, url_kp_depan: urlDepan, url_kp_belakang: urlBelakang,
      sertai_khairat: sertaiKhairat,
      tanggungan: tanggungan.filter((t) => t.nama.trim() !== ""),
    };
    const { error } = await supabase.rpc("daftar_ahli", { payload });
    if (error) {
      setHantar(false);
      const dup = error.message?.includes("duplicate");
      setSelesai({ ok: false, msg: dup ? "No. KP ini sudah didaftarkan." : "Ralat: " + error.message });
      return;
    }

    // Cipta akaun portal ahli (jika kata laluan diisi). Rekod ahli dicipta
    // dahulu supaya trigger auto-pautkan akaun ikut emel.
    let mesej = "Permohonan berjaya dihantar! Menunggu sokongan & kelulusan Jawatankuasa Surau.";
    if (nakAkaun) {
      const { error: eSignup } = await supabase.auth.signUp({
        email: emel,
        password: kataLaluan,
        options: { data: { nama } },
      });
      if (eSignup) {
        mesej += ` (Nota: akaun portal tidak dapat dicipta — ${eSignup.message}. Anda boleh cuba log masuk atau hubungi admin.)`;
      } else {
        mesej += " Akaun portal ahli anda telah dicipta — sila semak emel untuk pengesahan, kemudian log masuk.";
      }
    }
    setHantar(false);
    setSelesai({ ok: true, msg: mesej });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (selesai?.ok) {
    return (
      <div className="mx-auto max-w-lg rounded-xl bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl">✓</div>
        <h1 className="text-xl font-bold text-slate-900">Terima kasih!</h1>
        <p className="mt-2 text-slate-600">{selesai.msg}</p>
        <Link href="/" className="mt-6 inline-block rounded-lg bg-surau px-5 py-2.5 font-semibold text-white hover:bg-surau-dark">Kembali ke Utama</Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Borang Pendaftaran Ahli Kariah</h1>
        <p className="mt-1 text-sm text-slate-600">Kariah: <b>{namaSurau}</b> · Selaras borang rasmi JAIS. Medan bertanda * wajib.</p>
      </div>

      {selesai && !selesai.ok && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{selesai.msg}</div>
      )}

      {/* BAHAGIAN A */}
      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-surau">BAHAGIAN A · Butiran Ahli Kariah</h2>

        <Field label="1. Nama Pemohon *">
          <input className="inp" value={nama} onChange={(e) => setNama(e.target.value)} />
        </Field>

        <Field label="2. No. Kad Pengenalan *">
          <input className="inp" value={noKp} onChange={(e) => setNoKp(e.target.value)} placeholder="cth: 850505015123" />
        </Field>

        <div>
          <span className="mb-1 block text-sm font-medium text-slate-700">Gambar Kad Pengenalan (snap terus dengan kamera)</span>
          <div className="grid gap-3 sm:grid-cols-2">
            <SnapKad label="IC Depan" sisi="depan" url={urlDepan} sedang={muatNaik === "depan"} onSnap={snap} />
            <SnapKad label="IC Belakang" sisi="belakang" url={urlBelakang} sedang={muatNaik === "belakang"} onSnap={snap} />
          </div>
          <p className="mt-1 text-xs text-slate-500">Di telefon, ia akan buka kamera terus. Pastikan gambar jelas & tidak silau.</p>
        </div>

        <Field label="3. Alamat Dalam Kad Pengenalan / Passport">
          <textarea className="inp" rows={2} value={alamatKp} onChange={(e) => setAlamatKp(e.target.value)} />
        </Field>

        <Field label="4. Alamat Tempat Tinggal Sekarang">
          <textarea className="inp" rows={2} value={alamatSekarang} onChange={(e) => setAlamatSekarang(e.target.value)} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="5. No. Telefon Rumah">
            <input className="inp" value={telRumah} onChange={(e) => setTelRumah(e.target.value)} />
          </Field>
          <Field label="No. H/P *">
            <input className="inp" value={hp} onChange={(e) => setHp(e.target.value)} />
          </Field>
          <Field label="E-mel">
            <input className="inp" type="email" value={emel} onChange={(e) => setEmel(e.target.value)} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="6. Status Perkahwinan">
            <select className="inp" value={statusKahwin} onChange={(e) => setStatusKahwin(e.target.value)}>
              <option value="bujang">Bujang</option>
              <option value="berkahwin">Sudah Berkahwin</option>
            </select>
          </Field>
          <Field label="7. Tempoh Masa Telah Menetap">
            <div className="flex gap-2">
              <input className="inp" type="number" min="0" value={tempohNilai} onChange={(e) => setTempohNilai(e.target.value)} />
              <select className="inp w-28" value={tempohUnit} onChange={(e) => setTempohUnit(e.target.value)}>
                <option value="tahun">Tahun</option>
                <option value="bulan">Bulan</option>
              </select>
            </div>
          </Field>
        </div>
      </section>

      {/* Tanggungan */}
      <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Tanggungan / Isi Rumah</h2>
          <button type="button" onClick={() => setTanggungan((t) => [...t, kosong()])} className="rounded-lg bg-surau/10 px-3 py-1.5 text-sm font-semibold text-surau hover:bg-surau/20">+ Tambah</button>
        </div>
        {tanggungan.length === 0 && <p className="text-sm text-slate-500">Tiada tanggungan ditambah.</p>}
        {tanggungan.map((t, i) => (
          <div key={i} className="space-y-3 rounded-lg border border-slate-200 p-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="inp" placeholder="Nama tanggungan" value={t.nama} onChange={(e) => ubahT(i, "nama", e.target.value)} />
              <input className="inp" placeholder="No. KP (jika ada)" value={t.no_kp} onChange={(e) => ubahT(i, "no_kp", e.target.value)} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <select className="inp" value={t.hubungan} onChange={(e) => ubahT(i, "hubungan", e.target.value)}>
                <option value="pasangan">Pasangan</option>
                <option value="anak">Anak</option>
                <option value="ibu">Ibu</option>
                <option value="bapa">Bapa</option>
                <option value="lain">Lain-lain</option>
              </select>
              <input className="inp" type="date" value={t.tarikh_lahir} onChange={(e) => ubahT(i, "tarikh_lahir", e.target.value)} />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={t.dilindungi_khairat} onChange={(e) => ubahT(i, "dilindungi_khairat", e.target.checked)} /> Dilindungi khairat
              </label>
              <button type="button" onClick={() => setTanggungan((t) => t.filter((_, idx) => idx !== i))} className="text-sm font-medium text-red-600 hover:underline">Buang</button>
            </div>
          </div>
        ))}
      </section>

      {/* Khairat */}
      <section className="rounded-xl border-2 border-surau/30 bg-surau/5 p-5">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" checked={sertaiKhairat} onChange={(e) => setSertaiKhairat(e.target.checked)} />
          <span>
            <span className="font-semibold text-slate-900">Saya ingin menyertai Skim Khairat Kematian</span>
            <span className="mt-1 block text-sm text-slate-600">Yuran <b>RM60 setahun</b>, pampasan tetap <b>RM1,400</b> setiap kematian ahli/tanggungan dilindungi.</span>
          </span>
        </label>
      </section>

      {/* Akaun Portal Ahli (pilihan) */}
      <section className="space-y-3 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-slate-900">Akaun Portal Ahli <span className="text-sm font-normal text-slate-500">(pilihan)</span></h2>
        <p className="text-sm text-slate-600">
          Isi kata laluan untuk cipta akaun portal — anda boleh log masuk semak status keahlian,
          khairat, resit & sumbangan. Akaun guna <b>E-mel</b> yang anda isi di atas.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input className="inp" type="password" placeholder="Kata laluan (min. 6 aksara)" value={kataLaluan} onChange={(e) => setKataLaluan(e.target.value)} />
          <input className="inp" type="password" placeholder="Sahkan kata laluan" value={kataLaluan2} onChange={(e) => setKataLaluan2(e.target.value)} />
        </div>
      </section>

      {/* Pengakuan (Bahagian A no.8) */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-1" checked={pengakuan} onChange={(e) => setPengakuan(e.target.checked)} />
          <span className="text-sm text-slate-700">
            <b>8.</b> Saya mengaku bahawa segala maklumat yang terkandung dalam Bahagian A adalah <b>benar</b>. *
          </span>
        </label>
      </section>

      <button type="submit" disabled={hantar || muatNaik !== ""} className="w-full rounded-lg bg-surau px-6 py-3 font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
        {hantar ? "Menghantar…" : "Hantar Permohonan"}
      </button>

      <style jsx global>{`
        .inp { width: 100%; border-radius: .5rem; border: 1px solid #cbd5e1; padding: .5rem .75rem; font-size: .875rem; outline: none; }
        .inp:focus { border-color: #0f766e; box-shadow: 0 0 0 2px rgba(15,118,110,.2); }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SnapKad({
  label, sisi, url, sedang, onSnap,
}: {
  label: string;
  sisi: "depan" | "belakang";
  url: string;
  sedang: boolean;
  onSnap: (s: "depan" | "belakang", e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center hover:border-surau">
      <input
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => onSnap(sisi, e)}
      />
      {url ? (
        <span className="text-sm font-medium text-green-600">✓ {label} diambil</span>
      ) : sedang ? (
        <span className="text-sm text-amber-600">Memuat naik…</span>
      ) : (
        <>
          <span className="text-2xl">📷</span>
          <span className="mt-1 text-sm font-medium text-slate-700">{label}</span>
          <span className="text-xs text-slate-400">Ketik untuk snap</span>
        </>
      )}
    </label>
  );
}
