// Konstan untuk Portal Staf Surau
// Waktu bekerja SEMASA (mulai Mei 2026): Pagi 8:00–5:00, Petang 2:00–10:00
export const SHIFT = [
  { kod: "pagi", label: "Pagi (8:00 – 5:00)", mula: "08:00", tamat: "17:00" },
  { kod: "petang", label: "Petang (2:00 – 10:00)", mula: "14:00", tamat: "22:00" },
];

export function labelShift(kod?: string | null): string {
  return SHIFT.find((s) => s.kod === kod)?.label ?? (kod ?? "-");
}

export function shiftMasa(kod?: string | null): { mula: string; tamat: string } {
  const s = SHIFT.find((x) => x.kod === kod);
  return { mula: s?.mula ?? "08:00", tamat: s?.tamat ?? "17:00" };
}

export function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}
