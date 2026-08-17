// Rangka dwibahasa (client-safe — tiada next/headers di sini).
export type Bahasa = "ms" | "en";

// Kilang penterjemah: t("teks BM", "English text") → pulang ikut bahasa semasa.
export function buatT(lang: Bahasa) {
  return (ms: string, en: string): string => (lang === "en" ? en : ms);
}

// Baca bahasa dari cookie di pelayar (untuk komponen client). SSR → lalai "ms".
export function bahasaCookieKlien(): Bahasa {
  if (typeof document === "undefined") return "ms";
  const m = document.cookie.match(/(?:^|;\s*)bahasa=(en|ms)/);
  return (m?.[1] as Bahasa) ?? "ms";
}
