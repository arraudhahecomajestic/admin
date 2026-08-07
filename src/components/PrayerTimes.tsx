"use client";

import { useEffect, useState } from "react";

type Waktu = { nama: string; masa: string };

export default function PrayerTimes({ zon }: { zon: string }) {
  const [waktu, setWaktu] = useState<Waktu[] | null>(null);
  const [ralat, setRalat] = useState(false);
  const [tarikh, setTarikh] = useState("");

  useEffect(() => {
    fetch(`/api/waktu-solat?zon=${encodeURIComponent(zon)}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) {
          setWaktu(d.waktu);
          setTarikh(d.tarikh);
        } else {
          setRalat(true);
        }
      })
      .catch(() => setRalat(true));
  }, [zon]);

  return (
    <div className="rounded-xl bg-hitam p-5 text-white shadow-lg ring-1 ring-surau/40">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-surau-light">Waktu Solat</h2>
        <span className="text-xs opacity-80">
          Zon {zon}
          {tarikh ? ` · ${tarikh}` : ""}
        </span>
      </div>
      {ralat && (
        <p className="text-sm opacity-90">
          Tidak dapat memuatkan waktu solat sekarang. Cuba lagi kemudian.
        </p>
      )}
      {!ralat && !waktu && (
        <p className="animate-pulse text-sm opacity-90">Memuatkan…</p>
      )}
      {waktu && (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {waktu.map((w) => (
            <div
              key={w.nama}
              className="rounded-lg bg-white/10 px-2 py-3 text-center"
            >
              <div className="text-xs opacity-80">{w.nama}</div>
              <div className="text-base font-semibold">{w.masa}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
