"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehLulusVendor } from "@/lib/sesi";

export async function tetapkanStatusVendor(formData: FormData) {
  if (!bolehLulusVendor(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["menunggu", "lulus", "tolak"].includes(status)) return;
  const db = createAdminClient();
  await db.from("pembekal").update({ status }).eq("id", id);
  revalidatePath("/admin/vendor");
}

export async function padamVendor(formData: FormData) {
  if (!bolehLulusVendor(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("pembekal").delete().eq("id", id);
  revalidatePath("/admin/vendor");
}
