"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isStaf } from "@/lib/sesi";

export async function tambahKutipan(formData: FormData) {
  if (!isStaf(await getProfil())) return;
  const db = createAdminClient();
  const ahli = String(formData.get("ahli_id") ?? "");
  await db.from("kutipan").insert({
    kategori_id: Number(formData.get("kategori_id")),
    jumlah: Number(formData.get("jumlah")),
    kaedah: String(formData.get("kaedah") ?? "tunai"),
    ahli_id: ahli || null,
    catatan: String(formData.get("catatan") ?? "") || null,
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    direkod_oleh: "admin",
  });
  revalidatePath("/admin/kewangan");
}

export async function tambahBelanja(formData: FormData) {
  if (!isStaf(await getProfil())) return;
  const db = createAdminClient();
  await db.from("perbelanjaan").insert({
    kategori_id: Number(formData.get("kategori_id")),
    jumlah: Number(formData.get("jumlah")),
    keterangan: String(formData.get("keterangan") ?? ""),
    dari_khairat: String(formData.get("dari_khairat") ?? "") === "on",
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    direkod_oleh: "admin",
  });
  revalidatePath("/admin/kewangan");
}
