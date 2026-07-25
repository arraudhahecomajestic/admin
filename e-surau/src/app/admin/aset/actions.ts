"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";

export async function tambahAset(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const db = createAdminClient();
  await db.from("aset").insert({
    nama: String(formData.get("nama") ?? ""),
    kategori: String(formData.get("kategori") ?? "") || null,
    kuantiti: Number(formData.get("kuantiti")) || 1,
    lokasi: String(formData.get("lokasi") ?? "") || null,
    keadaan: String(formData.get("keadaan") ?? "") || null,
    tarikh_perolehan: String(formData.get("tarikh_perolehan") ?? "") || null,
    nilai: formData.get("nilai") ? Number(formData.get("nilai")) : null,
    catatan: String(formData.get("catatan") ?? "") || null,
  });
  revalidatePath("/admin/aset");
}

export async function padamAset(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("aset").delete().eq("id", id);
  revalidatePath("/admin/aset");
}
