// Konstan untuk Portal Staf Surau
export const SHIFT = [
  { kod: "pagi", label: "Pagi (8:00 – 5:00)" },
  { kod: "petang", label: "Petang (2:00 – 10:00)" },
];

export function labelShift(kod?: string | null): string {
  return SHIFT.find((s) => s.kod === kod)?.label ?? (kod ?? "-");
}

export function hariIni(): string {
  return new Date().toISOString().slice(0, 10);
}
