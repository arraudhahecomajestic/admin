"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { kemasArwah, padamArwah } from "@/app/admin/tahlil/actions";

export default function ArwahEditRow({
  id,
  nama,
  jantina,
  pemohon,
}: {
  id: string;
  nama: string;
  jantina: string;
  pemohon?: string | null;
}) {
  const router = useRouter();
  const [edit, setEdit] = useState(false);
  const [n, setN] = useState(nama);
  const [j, setJ] = useState(jantina || "tidak_pasti");
  const [sedang, setSedang] = useState(false);
  const [ralat, setRalat] = useState("");

  async function simpan() {
    setSedang(true);
    setRalat("");
    const res = await kemasArwah({ id, nama: n, jantina: j });
    setSedang(false);
    if (!res.ok) { setRalat(res.msg ?? "Ralat."); return; }
    setEdit(false);
    router.refresh();
  }

  async function padam() {
    if (!confirm(`Padam "${nama}"?`)) return;
    const fd = new FormData();
    fd.set("id", id);
    await padamArwah(fd);
    router.refresh();
  }

  if (edit) {
    return (
      <li className="list-none rounded-lg bg-slate-50 p-2 no-print">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={n}
            onChange={(e) => setN(e.target.value)}
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-sm uppercase outline-none focus:border-surau"
          />
          <select value={j} onChange={(e) => setJ(e.target.value)} className="rounded border border-slate-300 px-2 py-1 text-sm">
            <option value="lelaki">Lelaki</option>
            <option value="perempuan">Perempuan</option>
            <option value="tidak_pasti">Belum pasti</option>
          </select>
          <button onClick={simpan} disabled={sedang} className="rounded bg-surau px-3 py-1 text-xs font-semibold text-white hover:bg-surau-dark disabled:opacity-60">
            {sedang ? "…" : "Simpan"}
          </button>
          <button onClick={() => { setEdit(false); setN(nama); setJ(jantina); setRalat(""); }} className="text-xs text-slate-500 hover:underline">Batal</button>
        </div>
        {ralat && <div className="mt-1 text-xs text-red-600">{ralat}</div>}
      </li>
    );
  }

  return (
    <li className="group">
      {nama}
      {pemohon && <span className="text-xs text-slate-400"> · {pemohon}</span>}
      <span className="ml-2 inline-flex gap-2 no-print">
        <button onClick={() => setEdit(true)} className="text-xs text-surau opacity-0 hover:underline group-hover:opacity-100">edit</button>
        <button onClick={padam} className="text-xs text-red-500 opacity-0 hover:underline group-hover:opacity-100">padam</button>
      </span>
    </li>
  );
}
