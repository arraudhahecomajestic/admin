"use client";

import { namaKemas, telefonLokal } from "@/lib/format";

// Butang muat turun CSV senarai peserta (buka dalam Excel). Data dari server.
export default function EksportPeserta({ rows, jenis, namaFail }: { rows: any[]; jenis: "berbayar" | "rsvp"; namaFail: string }) {
  function csvEscape(v: any): string {
    const s = v == null ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  }

  function muatTurun() {
    let header: string[];
    let baris: string[][];
    if (jenis === "berbayar") {
      header = ["Bil", "Anak Didaftarkan", "Bilangan", "Ibu Bapa/Penjaga", "Telefon", "E-mel", "Kesihatan", "Status Bayar", "Jumlah (RM)", "Tarikh Daftar"];
      baris = rows.map((r, i) => {
        const anak = (r.senarai_anak || r.nama_peserta || "").split("\n").map((x: string) => x.trim()).filter(Boolean).join("; ");
        const status = r.status_bayar === "dibayar" ? "Disahkan" : r.status_bayar === "menunggu_sah" ? "Tunggu Sahkan" : r.status_bayar === "tolak" ? "Ditolak" : r.status_bayar === "percuma" ? "Percuma" : (r.status_bayar || "");
        return [String(i + 1), anak, String(r.bilangan || 1), r.nama_penjaga || "", r.telefon_penjaga || "", r.emel || "", r.maklumat_kesihatan || "", status, Number(r.jumlah || 0).toFixed(2), (r.dicipta || "").slice(0, 10)];
      });
    } else {
      header = ["Bil", "Nama", "Telefon", "Bil. Orang", "Tarikh Daftar"];
      baris = rows.map((r, i) => [String(i + 1), namaKemas(r.nama), telefonLokal(r.telefon), String(r.bil_orang || 1), (r.dicipta || "").slice(0, 10)]);
    }
    const isi = [header, ...baris].map((row) => row.map(csvEscape).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + isi], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${namaFail}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button onClick={muatTurun} disabled={rows.length === 0}
      className="rounded-lg border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
      ⬇ Muat turun CSV
    </button>
  );
}
