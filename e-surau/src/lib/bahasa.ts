import { cookies } from "next/headers";
import type { Bahasa } from "./i18n";

// Baca bahasa pilihan dari cookie (server). Lalai: BM.
export function bahasaSemasa(): Bahasa {
  try {
    return cookies().get("bahasa")?.value === "en" ? "en" : "ms";
  } catch {
    return "ms";
  }
}
