export function rm(nilai: number | string | null | undefined): string {
  const n = Number(nilai ?? 0);
  const v = isNaN(n) ? 0 : n;
  try {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(v);
  } catch {
    return `RM${v.toFixed(2)}`;
  }
}

export function tarikhMs(d: string | Date | null | undefined): string {
  if (!d) return "-";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "-";
  try {
    return date.toLocaleDateString("ms-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date.toISOString().slice(0, 10);
  }
}
