"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";

export async function tambahProgram(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const db = createAdminClient();
  await db.from("program").insert({
    tajuk: String(formData.get("tajuk") ?? ""),
    keterangan: String(formData.get("keterangan") ?? "") || null,
    kategori: String(formData.get("kategori") ?? "") || null,
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    masa: String(formData.get("masa") ?? "") || null,
    lokasi: String(formData.get("lokasi") ?? "") || null,
    had_peserta: formData.get("had_peserta") ? Number(formData.get("had_peserta")) : null,
    berbayar: String(formData.get("berbayar") ?? "") === "on",
    yuran: formData.get("yuran") ? Number(formData.get("yuran")) : 0,
    rsvp_dibuka: String(formData.get("rsvp_dibuka") ?? "") === "on",
    diterbitkan: String(formData.get("diterbitkan") ?? "") === "on",
  });
  revalidatePath("/admin/program");
  revalidatePath("/program");
  revalidatePath("/");
}

export async function kemasProgram(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("program").update({
    tajuk: String(formData.get("tajuk") ?? ""),
    keterangan: String(formData.get("keterangan") ?? "") || null,
    kategori: String(formData.get("kategori") ?? "") || null,
    tarikh: String(formData.get("tarikh") ?? "") || new Date().toISOString().slice(0, 10),
    masa: String(formData.get("masa") ?? "") || null,
    lokasi: String(formData.get("lokasi") ?? "") || null,
    had_peserta: formData.get("had_peserta") ? Number(formData.get("had_peserta")) : null,
    berbayar: String(formData.get("berbayar") ?? "") === "on",
    yuran: formData.get("yuran") ? Number(formData.get("yuran")) : 0,
    rsvp_dibuka: String(formData.get("rsvp_dibuka") ?? "") === "on",
    diterbitkan: String(formData.get("diterbitkan") ?? "") === "on",
  }).eq("id", id);
  revalidatePath("/admin/program");
  revalidatePath(`/admin/program/${id}`);
  revalidatePath("/program");
  revalidatePath(`/program/${id}`);
  revalidatePath("/");
  redirect("/admin/program");
}

export async function padamProgram(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("program").delete().eq("id", id);
  revalidatePath("/admin/program");
  revalidatePath("/program");
  revalidatePath("/");
}
