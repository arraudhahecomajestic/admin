"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { tambahTugasanSu, siapkanTugasanSu, padamTugasanSu } from "@/app/admin/su/actions";

type Tugas = {
  id: string;
  tajuk: string;
  catatan: string | null;
  tarikh_tamat: string | null;
  siap: boolean;
};

export default function SuTugasan({ awal, hariIni }: { awal: Tugas[]; hariIni: string }) {
  const router = useRouter();
  const [tajuk, setTajuk] = useState("");
  const [catatan, setCatatan] = useState("");
  const [tarikh, setTarikh] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [ralat, setRalat] = useState("");

  const belum = awal.filter((t) => !t.siap);
  const siap = awal.filter((t) => t.siap);

  async function tambah(e: React.FormEvent) {
    e.preventDefault();
    setRalat("");
    if (!tajuk.trim()) { setRalat("Sila isi tajuk tugasan."); return; }
    setSibuk(true);
    const res = await tambahTugasanSu({ tajuk, catatan, tarikh_tamat: tarikh });
    setSibuk(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setTajuk(""); setCatatan(""); setTarikh("");
    router.refresh();
  }

  async function toggle(id: string, nilai: boolean) {
    await siapkanTugasanSu(id, nilai);
    router.refresh();
  }

  async function buang(id: string) {
    await padamTugasanSu(id);
    router.refresh();
  }

  function baris(t: Tugas) {
    const lewat = !t.siap && t.tarikh_tamat && t.tarikh_tamat < hariIni;
    const esok = !t.siap && t.tarikh_tamat && t.tarikh_tamat === hariIni;
    return (
      <div key={t.id} className="flex items-start justify-between gap-3 py-2.5">
        <label className="flex flex-1 cursor-pointer items-start gap-2.5">
          <input type="checkbox" checked={t.siap} onChange={(e) => toggle(t.id, e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[#b8860b]" />
          <span className="min-w-0">
            <span className={`text-sm ${t.siap ? "text-slate-400 line-through" : "font-medium text-slate-800"}`}>{t.tajuk}</span>
            {t.catatan && <span className="block text-xs text-slate-500">{t.catatan}</span>}
            {t.tarikh_tamat && (
              <span className={`mt-0.5 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                lewat ? "bg-red-100 text-red-700" : esok ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
              }`}>
                {lewat ? "Lewat: " : esok ? "Hari ini: " : "Tarikh: "}{t.tarikh_tamat}
              </span>
            )}
          </span>
        </label>
        <button onClick={() => buang(t.id)} className="shrink-0 text-xs font-semibold text-slate-300 hover:text-red-500">✕</button>
      </div>
    );
  }

  return (
    <section className="rounded-xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Tugasan Saya</h2>
        {belum.length > 0 && <span className="rounded-full bg-surau/10 px-2.5 py-0.5 text-xs font-semibold text-surau">{belum.length} belum siap</span>}
      </div>

      <form onSubmit={tambah} className="mb-4 grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <input value={tajuk} onChange={(e) => setTajuk(e.target.value)} placeholder="Tugasan baru (cth: Sediakan minit mesyuarat Julai)" className="inp" />
        <div className="grid gap-2 sm:grid-cols-2">
          <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Catatan (pilihan)" className="inp" />
          <input type="date" value={tarikh} onChange={(e) => setTarikh(e.target.value)} className="inp" />
        </div>
        {ralat && <p className="text-xs text-red-600">{ralat}</p>}
        <div>
          <button type="submit" disabled={sibuk} className="rounded-lg bg-surau px-4 py-1.5 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sibuk ? "Menyimpan…" : "Tambah Tugasan"}
          </button>
        </div>
      </form>

      {awal.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">Tiada tugasan lagi. Tambah di atas.</p>
      ) : (
        <div className="divide-y">
          {belum.map(baris)}
          {siap.length > 0 && (
            <details className="pt-2">
              <summary className="cursor-pointer py-1 text-xs font-semibold text-slate-400">Selesai ({siap.length})</summary>
              <div className="divide-y">{siap.map(baris)}</div>
            </details>
          )}
        </div>
      )}

      <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.45rem .7rem;font-size:.85rem;outline:none}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
    </section>
  );
}
