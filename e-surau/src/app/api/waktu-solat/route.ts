import { NextResponse } from "next/server";

// Proxy ringkas ke API Waktu Solat (data JAKIM e-Solat).
// Sumber: https://api.waktusolat.app  (v2)
export const revalidate = 3600; // cache 1 jam

const NAMA = ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"] as const;

function jam(epoch: number): string {
  return new Date(epoch * 1000).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zon = searchParams.get("zon") || process.env.NEXT_PUBLIC_ZON_SOLAT || "SGR01";

  try {
    const res = await fetch(`https://api.waktusolat.app/v2/solat/${zon}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`status ${res.status}`);
    const data = await res.json();

    const hariIni = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
    });
    const hb = Number(hariIni.split("-")[2]);

    const list: any[] = data?.prayers ?? [];
    const t = list.find((p) => Number(p.day) === hb) ?? list[0];
    if (!t) throw new Error("tiada data waktu");

    const waktu = [
      { nama: NAMA[0], masa: jam(t.fajr) },
      { nama: NAMA[1], masa: jam(t.syuruk) },
      { nama: NAMA[2], masa: jam(t.dhuhr) },
      { nama: NAMA[3], masa: jam(t.asr) },
      { nama: NAMA[4], masa: jam(t.maghrib) },
      { nama: NAMA[5], masa: jam(t.isha) },
    ];

    return NextResponse.json({ ok: true, zon, tarikh: hariIni, waktu });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, zon, ralat: e?.message ?? "gagal ambil data" },
      { status: 200 }
    );
  }
}
