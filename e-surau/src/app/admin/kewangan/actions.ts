"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehKewangan } from "@/lib/sesi";

export async function tambahKutipan(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
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
  if (!bolehKewangan(await getProfil())) return;
  const db = createAdminClient();
  await db.from("perbelanjaan").insert({
    kategori_id: Number(formData.get("kategori_id")),
    jumlah: Number(formData.get("jumlah")),
    keterangan: String(formData.get("keterangan") ?? ""),
    bayar_kepada: String(formData.get("bayar_kepada") ?? "") || null,
    cara_bayar: String(formData.get("cara_bayar") ?? "") || null,
    no_rujukan_bayar: String(formData.get("no_rujukan_bayar") ?? "") || null,
    dari_khairat: String(formData.get("dari_khairat") ?? "") === "on",
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    direkod_oleh: "admin",
  });
  revalidatePath("/admin/kewangan");
}

export async function padamKutipan(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("kutipan").delete().eq("id", id);
  revalidatePath("/admin/kewangan");
}

export async function padamBelanja(formData: FormData) {
  if (!bolehKewangan(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("perbelanjaan").delete().eq("id", id);
  revalidatePath("/admin/kewangan");
}
