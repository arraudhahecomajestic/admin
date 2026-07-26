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
