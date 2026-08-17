"use client";

import { useState } from "react";
import { rm, tarikhMs } from "@/lib/format";
import { buatT } from "@/lib/i18n";

type Props = {
  lang: string;
  nama: string;
  jenisKhairat: boolean;
  ditutup: boolean;
  terkiniJumlah: number | string | null;
  terkiniTarikh: string | null;
  jumlahBulanIni: number | string;
  jumlahTerkumpul: number | string;
};

export default function KadTabung(p: Props) {
  const t = buatT(p.lang as any);
  const [buka, setBuka] = useState(false);

  return (
    <div className={`rounded-xl border p-5 shadow-sm ${p.ditutup ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{p.nama}</h3>
        <div className="flex items-center gap-2">
          {p.jenisKhairat && !p.ditutup && (
            <span className="rounded bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700">{t("Khairat", "Death Benefit")}</span>
          )}
          {p.ditutup && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">{t("Ditutup", "Closed")}</span>
          )}
        </div>
      </div>

      {!buka ? (
        <button
          onClick={() => setBuka(true)}
          className="mt-3 w-full rounded-lg border border-surau/40 bg-white px-4 py-2 text-sm font-semibold text-surau hover:bg-surau/5"
        >
          {t("Lihat kutipan", "View collection")}
        </button>
      ) : (
        <div className="mt-3">
          <div className="text-2xl font-bold text-surau">{rm(p.terkiniJumlah ?? p.jumlahTerkumpul)}</div>
          <div className="text-xs text-slate-500">
            {p.ditutup
              ? `${t("Kutipan terkini sehingga", "Latest collection up to")}${p.terkiniTarikh ? ` ${tarikhMs(p.terkiniTarikh)}` : ""}`
              : `${t("Kutipan terkini", "Latest collection")}${p.terkiniTarikh ? ` · ${tarikhMs(p.terkiniTarikh)}` : ` · ${t("belum ada rekod", "no records yet")}`}`}
          </div>

          {!p.ditutup && (
            <div className="mt-3 flex gap-6 border-t pt-3 text-sm">
              <div>
                <div className="font-semibold text-slate-800">{rm(p.jumlahBulanIni)}</div>
                <div className="text-xs text-slate-500">{t("Bulan ini", "This month")}</div>
              </div>
              <div>
                <div className="font-semibold text-slate-800">{rm(p.jumlahTerkumpul)}</div>
                <div className="text-xs text-slate-500">{t("Terkumpul", "Total collected")}</div>
              </div>
            </div>
          )}

          <button onClick={() => setBuka(false)} className="mt-3 text-xs font-medium text-slate-400 hover:text-slate-600">
            {t("Tutup", "Close")}
          </button>
        </div>
      )}
    </div>
  );
}
