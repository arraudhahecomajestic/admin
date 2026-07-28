"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehTahlil } from "@/lib/sesi";

export async function padamArwah(formData: FormData) {
  if (!bolehTahlil(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("arwah").delete().eq("id", id);
  revalidatePath("/admin/tahlil");
  revalidatePath("/tahlil");
}

// Betulkan nama & jantina arwah (admin).
export async function kemasArwah(input: {
  id: string;
  nama: string;
  jantina: string;
}): Promise<{ ok: boolean; msg?: string }> {
  if (!bolehTahlil(await getProfil())) return { ok: false, msg: "Tiada akses." };
  const id = (input.id || "").trim();
  const nama = (input.nama || "").trim().replace(/\s+/g, " ").toUpperCase();
  const jantina = ["lelaki", "perempuan", "tidak_pasti"].includes(input.jantina) ? input.jantina : "tidak_pasti";
  if (!id) return { ok: false, msg: "ID tidak sah." };
  if (nama.length < 2) return { ok: false, msg: "Nama terlalu pendek." };
  const db = createAdminClient();
  const { error } = await db.from("arwah").update({ nama, jantina }).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/tahlil");
  revalidatePath("/tahlil");
  return { ok: true };
}
