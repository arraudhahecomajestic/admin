import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";

// Baca semua tetapan sistem (key-value) — untuk Server Components.
export async function bacaTetapan(): Promise<Record<string, string>> {
  if (!adminConfigured) return {};
  try {
    const db = createAdminClient();
    const { data } = await db.from("tetapan_sistem").select("kunci, nilai");
    const o: Record<string, string> = {};
    for (const r of (data as any[]) ?? []) o[r.kunci] = r.nilai;
    return o;
  } catch {
    return {};
  }
}

export async function khairatDibuka(): Promise<boolean> {
  const t = await bacaTetapan();
  return t.khairat_dibuka === "true";
}

export async function pampasanKhairat(): Promise<number> {
  const t = await bacaTetapan();
  const n = Number(t.pampasan_khairat);
  return isNaN(n) || !n ? 1200 : n;
}

export async function penajaDipapar(): Promise<boolean> {
  const t = await bacaTetapan();
  return t.penaja_dipapar === "true";
}
