export function rm(nilai: number | string | null | undefined): string {
  const n = Number(nilai ?? 0);
  return new Intl.NumberFormat("ms-MY", {
    style: "currency",
    currency: "MYR",
  }).format(isNaN(n) ? 0 : n);
}

export function tarikhMs(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("ms-MY", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
