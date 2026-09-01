"use client";

import { useState } from "react";
import { PAKEJ_PENAJA } from "@/lib/tetapan";
import { tarikhMs } from "@/lib/format";
import ButangHantar from "@/components/ButangHantar";
import { kemasPenaja, togglePenaja, padamPenaja } from "@/app/admin/penaja/actions";

export default function PenajaRow({
  p,
  namaPakej,
  statusText,
  statusClass,
}: {
  p: any;
  namaPakej: Record<string, string>;
  statusText: string;
  statusClass: string;
}) {
  const [edit, setEdit] = useState(false);

  if (edit) {
    return (
      <div className="px-5 py-4">
        <form action={kemasPenaja} className="grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="id" value={p.id} />
          <div className="sm:col-span-2 text-xs font-semibold text-surau">Edit penaja</div>

          {/* Logo semasa + tukar */}
          <div className="sm:col-span-2 rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <div className="mb-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {p.logo_url
                ? <img src={p.logo_url} alt={p.nama} className="h-12 w-auto max-w-[100px] rounded border bg-white object-contain" />
                : <div className="flex h-12 w-16 items-center justify-center rounded border bg-white text-xs text-slate-400">Tiada logo</div>}
              <span className="text-xs text-slate-500">Logo semasa</span>
            </div>
            <label className="block text-sm text-slate-600">Logo baharu (PNG/JPG, maks 3MB)
              <input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="inp" />
            </label>
            {p.logo_url && (
              <label className="mt-2 flex items-center gap-2 text-xs text-slate-500"><input type="checkbox" name="buang_logo" /> Buang logo semasa</label>
            )}
          </div>

          <input name="nama" required defaultValue={p.nama ?? ""} placeholder="Nama penaja *" className="inp sm:col-span-2" />
          <label className="text-sm text-slate-600">Pakej
            <select name="pakej" defaultValue={p.pakej ?? ""} className="inp">
              <option value="">— Tiada / manual —</option>
              {PAKEJ_PENAJA.map((pk) => <option key={pk.kod} value={pk.kod}>{pk.nama} (RM{pk.harga_bulan}/bln)</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-600">Tempoh (bulan)<input name="tempoh_bulan" type="number" defaultValue={p.tempoh_bulan ?? ""} className="inp" /></label>
          <input name="emel" defaultValue={p.emel ?? ""} placeholder="E-mel penaja" className="inp" />
          <input name="pautan" defaultValue={p.pautan ?? ""} placeholder="Pautan (https://…)" className="inp" />
          <input name="kategori" defaultValue={p.kategori ?? ""} placeholder="Kategori" className="inp" />
          <input name="telefon" defaultValue={p.telefon ?? ""} placeholder="No. telefon / WhatsApp" className="inp" />
          <input name="keterangan" defaultValue={p.keterangan ?? ""} placeholder="Keterangan ringkas" className="inp" />
          <input name="tawaran" defaultValue={p.tawaran ?? ""} placeholder="Tawaran untuk ahli kariah" className="inp" />
          <input name="kod_promo" defaultValue={p.kod_promo ?? ""} placeholder="Kod promo" className="inp" />
          <label className="text-sm text-slate-600">Tarikh Mula<input name="tarikh_mula" type="date" defaultValue={p.tarikh_mula ?? ""} className="inp" /></label>
          <label className="text-sm text-slate-600">Tarikh Tamat<input name="tarikh_tamat" type="date" defaultValue={p.tarikh_tamat ?? ""} className="inp" /></label>
          <input name="susunan" type="number" defaultValue={p.susunan ?? ""} placeholder="Susunan (kecil = atas)" className="inp" />

          <div className="sm:col-span-2 flex items-center gap-2">
            <ButangHantar className="rounded-lg bg-surau px-5 py-2 text-sm font-semibold text-white hover:bg-surau-dark disabled:opacity-60" pendingText="Menyimpan…">Simpan Perubahan</ButangHantar>
            <button type="button" onClick={() => setEdit(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
          </div>
        </form>
        <style>{`.inp{width:100%;border-radius:.5rem;border:1px solid #cbd5e1;padding:.5rem .75rem;font-size:.875rem;outline:none;margin-top:.25rem}.inp:focus{border-color:#b8860b;box-shadow:0 0 0 2px rgba(184,134,11,.2)}`}</style>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p.logo_url
          ? <img src={p.logo_url} alt={p.nama} className="h-10 w-auto max-w-[80px] rounded border object-contain" />
          : <div className="flex h-10 w-14 items-center justify-center rounded border bg-slate-50 text-xs text-slate-400">Tiada</div>}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-slate-900">{p.nama}</span>
            {p.pakej && <span className="rounded bg-surau/10 px-2 py-0.5 text-xs font-semibold text-surau">{namaPakej[p.pakej] || p.pakej}{p.tempoh_bulan ? ` · ${p.tempoh_bulan} bln` : ""}</span>}
            <span className={`rounded px-2 py-0.5 text-xs font-semibold ${statusClass}`}>{statusText}</span>
            {!p.logo_url && <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Tiada logo</span>}
          </div>
          <div className="text-xs text-slate-500">
            {p.kategori || "—"}
            {p.tarikh_mula || p.tarikh_tamat ? ` · ${p.tarikh_mula ? tarikhMs(p.tarikh_mula) : "?"} → ${p.tarikh_tamat ? tarikhMs(p.tarikh_tamat) : "?"}` : ""}
            {p.emel ? ` · ${p.emel}` : ""}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setEdit(true)} className="text-xs font-semibold text-slate-600 hover:underline">Edit</button>
        <form action={togglePenaja}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="aktif" value={String(p.aktif)} /><ButangHantar className="text-xs font-semibold text-surau hover:underline" pendingText="…">{p.aktif ? "Nyahaktif" : "Aktifkan"}</ButangHantar></form>
        <form action={padamPenaja}><input type="hidden" name="id" value={p.id} /><ButangHantar className="text-xs font-semibold text-red-600 hover:underline" pendingText="…" konfirmasi={`Padam penaja "${p.nama}"? Tindakan ini tak boleh diundur.`}>Padam</ButangHantar></form>
      </div>
    </div>
  );
}
