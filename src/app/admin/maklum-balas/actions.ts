"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";

function boleh(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}

export async function tindakMaklumBalas(input: { id: string; status: string; tindakan?: string }): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const status = ["baru", "dibaca", "selesai"].includes(input.status) ? input.status : "baru";
  const db = createAdminClient();
  await db.from("maklum_balas").update({ status, tindakan: (input.tindakan || "").trim() || null }).eq("id", input.id);
  revalidatePath("/admin/maklum-balas");
  return { ok: true };
}

export async function padamMaklumBalas(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("maklum_balas").delete().eq("id", id);
  revalidatePath("/admin/maklum-balas");
  return { ok: true };
}
