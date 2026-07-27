"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isMaster } from "@/lib/sesi";

export async function setTetapan(formData: FormData) {
  if (!isMaster(await getProfil())) return;
  const kunci = String(formData.get("kunci") ?? "");
  const nilai = String(formData.get("nilai") ?? "");
  if (!kunci) return;
  const db = createAdminClient();
  await db.from("tetapan_sistem").upsert({ kunci, nilai }, { onConflict: "kunci" });
  revalidatePath("/", "layout"); // strip penaja + link khairat di layout (semua halaman)
  revalidatePath("/admin/tetapan");
  revalidatePath("/");
  revalidatePath("/ahli");
  revalidatePath("/khairat");
  revalidatePath("/tahlil");
  revalidatePath("/sewaan");
}
