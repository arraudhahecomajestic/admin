"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isStaf } from "@/lib/sesi";

const emailOk = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

// Cipta akaun log masuk untuk ahli sedia ada, berkelompok.
// Emel = emel rekod; kata laluan = No. KP (digit). Idempoten: langkau yg sudah wujud.
export async function seedAkaunAhli(offset: number): Promise<{
  ok: boolean;
  msg?: string;
  total?: number;
  created?: number;
  existing?: number;
  failed?: number;
  next?: number;
  done?: boolean;
}> {
  const p = await getProfil();
  if (!p || !isStaf(p)) return { ok: false, msg: "Tiada kebenaran." };

  const db = createAdminClient();
  const { data, error } = await db
    .from("ahli_kariah")
    .select("emel, no_kp, nama")
    .order("no_ahli", { ascending: true })
    .limit(2000);
  if (error) return { ok: false, msg: error.message };

  const seen = new Set<string>();
  const layak: { emel: string; kp: string; nama: string }[] = [];
  for (const a of (data as any[]) ?? []) {
    const emel = (a.emel || "").trim().toLowerCase();
    const kp = (a.no_kp || "").replace(/\D/g, "");
    if (!emel || !emailOk(emel) || kp.length < 6) continue;
    if (seen.has(emel)) continue;
    seen.add(emel);
    layak.push({ emel, kp, nama: a.nama });
  }

  const total = layak.length;
  const LIMIT = 25;
  const start = Math.max(0, offset || 0);
  const batch = layak.slice(start, start + LIMIT);

  let created = 0,
    existing = 0,
    failed = 0;
  for (const m of batch) {
    const { error: e } = await db.auth.admin.createUser({
      email: m.emel,
      password: m.kp,
      email_confirm: true,
      user_metadata: { nama: m.nama },
    });
    if (!e) created++;
    else if (/registered|exists|duplicate/i.test(e.message)) existing++;
    else failed++;
  }

  const next = start + batch.length;
  return { ok: true, total, created, existing, failed, next, done: next >= total };
}
