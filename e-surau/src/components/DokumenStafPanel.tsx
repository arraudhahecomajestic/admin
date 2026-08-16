"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { simpanDokumen, padamDokumen } from "@/app/admin/staf/dokumen/actions";
import { JENIS_DOKUMEN, labelJenisDok, clsJenisDok } from "@/lib/dokumen";

type Staf = { profil_id: string; nama: string | null; jawatan?: string | null };
type Dok = {
  id: string;
  jenis: string;
  tajuk: string;
  nama_fail: string | null;
  tarikh_dokumen: string | null;
  catatan: string | null;
  dimuat_naik_oleh: string | null;
  dicipta: string;
  signedUrl: string | null;
};

export default function DokumenStafPanel({
  senarai,
  staf,
  namaStaf,
  dokumen,
}: {
  senarai: Staf[];
  staf: string;
  namaStaf: string;
  dokumen: Dok[];
}) {
  const router = useRouter();
  const [jenis, setJenis] = useState("tawaran");
  const [tajuk, setTajuk] = useState("");
  const [tarikh, setTarikh] = useState("");
  const [catatan, setCatatan] = useState("");
  const [urlFail, setUrlFail] = useState("");
  const [namaFail, setNamaFail] = useState("");
  const [muat, setMuat] = useState(false);
  const [hantar, setHantar] = useState(false);
  const [ralat, setRalat] = useState("");
  const [padamId, setPadamId] = useState("");

  function pilihStaf(id: string) {
    router.push(`/admin/staf/dokumen?staf=${id}`);
  }

  async function naik(e: React.ChangeEvent<HTMLInputElement>) {
    const fail = e.target.files?.[0];
    if (!fail) return;
    setRalat("");
    setMuat(true);
    const supabase = createClient();
    const ext = fail.name.split(".").pop() || "pdf";
    const path = `dokumen-staf/${staf}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("salinan-kp").upload(path, fail, {
      contentType: fail.type || undefined,
    });
    setMuat(false);
    if (error) { setRalat("Gagal muat naik: " + error.message); return; }
    setUrlFail(`salinan-kp/${path}`);
    setNamaFail(fail.name);
    if (!tajuk) setTajuk(labelJenisDok(jenis));
  }

  async function simpan() {
    setRalat("");
    if (!staf) { setRalat("Sila pilih staf."); return; }
    if (!urlFail) { setRalat("Sila muat naik fail dokumen."); return; }
    if (!tajuk.trim()) { setRalat("Sila isi tajuk dokumen."); return; }
    setHantar(true);
    const res = await simpanDokumen({
      profil_id: staf,
      nama_staf: namaStaf,
      jenis,
      tajuk: tajuk.trim(),
      url_fail: urlFail,
      nama_fail: namaFail,
      tarikh_dokumen: tarikh,
      catatan: catatan.trim(),
    });
    setHantar(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setTajuk(""); setTarikh(""); setCatatan(""); setUrlFail(""); setNamaFail("");
    router.refresh();
  }

  async function buang(id: string) {
    setPadamId(id);
    const res = await padamDokumen(id);
    setPadamId("");
    if (!res.ok) { setRalat(res.msg ?? "Gagal padam."); return; }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Pilih staf */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="mb-3 font-semibold text-slate-900">Pilih Staf</h2>
        {senarai.length === 0 ? (
          <p className="text-sm text-slate-400">Tiada staf. Sila daftar staf di modul Gaji dahulu.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {senarai.map((s) => (
              <button
                key={s.profil_id}
                onClick={() => pilihStaf(s.profil_id)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  s.profil_id === staf
                    ? "border-surau bg-surau text-white"
                    : "border-surau/40 text-surau hover:bg-surau/10"
                }`}
              >
                {s.nama ?? "—"}
              </button>
            ))}
          </div>
        )}
      </section>

      {staf && (
        <>
          {/* Muat naik dokumen baru */}
          <section className="rounded-xl bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-semibold text-slate-900">Tambah Dokumen — {namaStaf}</h2>
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-600">Jenis dokumen</span>
                  <select value={jenis} onChange={(e) => setJenis(e.target.value)} className="inp">
                    {JENIS_DOKUMEN.map((j) => (
                      <option key={j.kod} value={j.kod}>{j.label}</option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  <span className="mb-1 block font-medium text-slate-600">Tarikh dokumen (pilihan)</span>
                  <input type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)} className="inp" />
                </label>
              </div>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Tajuk dokumen</span>
                <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} placeholder="cth Surat Tawaran Kerja PPS 2026" className="inp" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block font-medium text-slate-600">Catatan (pilihan)</span>
                <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="cth Slip gaji bulan Julai 2026" className="inp" />
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-3 text-sm hover:border-surau">
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={naik} />
                {urlFail ? (
                  <span className="font-medium text-green-600">✓ {namaFail || "Fail dimuat naik"}</span>
                ) : muat ? (
                  <span className="text-amber-600">Memuat naik…</span>
                ) : (
                  <span className="text-slate-600">Muat naik fail (PDF / gambar)</span>
                )}
              </label>
              {ralat && <p className="text-sm text-red-600">{ralat}</p>}
              <div>
                <button onClick={simpan} disabled={hantar || muat} className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
                  {hantar ? "Menyimpan…" : "Simpan Dokumen"}
                </button>
              </div>
            </div>
          </section>

          {/* Senarai dokumen */}
          <section className="rounded-xl bg-white shadow-sm">
            <h2 className="border-b px-5 py-3 font-semibold text-slate-900">Dokumen {namaStaf} ({dokumen.length})</h2>
            <div className="divide-y">
              {dokumen.length === 0 && <p className="px-5 py-6 text-center text-slate-400">Tiada dokumen lagi.</p>}
              {dokumen.map((d) => (
                <div key={d.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded px-2 py-0.5 text-xs font-semibold ${clsJenisDok(d.jenis)}`}>{labelJenisDok(d.jenis)}</span>
                      <span className="font-semibold text-slate-900">{d.tajuk}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {d.tarikh_dokumen ? `Tarikh: ${d.tarikh_dokumen} · ` : ""}
                      {d.nama_fail ? `${d.nama_fail}` : ""}
                    </div>
                    {d.catatan && <div className="mt-0.5 text-xs text-slate-600">{d.catatan}</div>}
                    {d.dimuat_naik_oleh && <div className="mt-0.5 text-xs text-slate-400">Dimuat naik oleh {d.dimuat_naik_oleh}</div>}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {d.signedUrl ? (
                      <a href={d.signedUrl} target="_blank" rel="noreferrer" className="text-sm font-medium text-surau hover:underline">Lihat →</a>
                    ) : (
                      <span className="text-xs text-slate-400">Pautan tiada</span>
                    )}
                    <button onClick={() => buang(d.id)} disabled={padamId === d.id} className="text-xs font-semibold text-red-500 hover:underline disabled:opacity-50">
                      {padamId === d.id ? "…" : "Padam"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </div>
  );
}
