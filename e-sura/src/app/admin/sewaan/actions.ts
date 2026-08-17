"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";

export async function tetapkanStatusSewaan(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["menunggu", "lulus", "tolak", "selesai"].includes(status)) return;
  const db = createAdminClient();
  await db.from("sewaan").update({ status }).eq("id", id);
  revalidatePath("/admin/sewaan");
  revalidatePath("/sewaan");
}

export async function padamSewaan(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("sewaan").delete().eq("id", id);
  revalidatePath("/admin/sewaan");
  revalidatePath("/sewaan");
}
