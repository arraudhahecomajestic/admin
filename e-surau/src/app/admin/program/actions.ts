"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";
import { panggilAI } from "@/lib/ai";

// "Kemaskini dengan AI" — Setiausaha surau tolong taip semula & kemaskan
// keterangan program supaya kemas, jelas & sedia untuk diterbitkan/hebahan.
export async function kemasKeteranganProgramAI(input: {
  tajuk?: string; kategori?: string; lokasi?: string; tarikh?: string; masa?: string; yuran?: string; had_peserta?: string; keterangan?: string;
}): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  if (!isPentadbir(await getProfil())) return { ok: false, msg: "Tiada akses." };
  const idea = (input.keterangan ?? "").trim();
  const tajuk = (input.tajuk ?? "").trim();
  if (!idea && !tajuk) return { ok: false, msg: "Sila isi tajuk atau sedikit butiran dahulu sebelum kemaskini dengan AI." };

  const sistem =
    "Anda ialah Setiausaha Surau Ar-Raudhah, Eco Majestic. Tugas anda menolong menaip semula & mengemaskan " +
    "keterangan/hebahan program surau berdasarkan maklumat ringkas yang diberi. Tulis dalam Bahasa Melayu yang " +
    "kemas, sopan, mesra & profesional — nada rasmi surau. Susun elok: ayat pembuka ringkas, kemudian butiran " +
    "penting (tarikh, masa, lokasi, yuran, had peserta jika ada), dan ayat galakan penutup. Boleh guna emoji " +
    "bertujuan secara berpada (cth 🗓️ ⏰ 📍 💰) untuk butiran. JANGAN reka fakta yang tiada — guna hanya maklumat " +
    "yang diberi. JANGAN tambah nombor telefon atau nama yang tidak diberi. Balas HANYA teks keterangan akhir, " +
    "tanpa tajuk 'Keterangan:' atau nota tambahan.";

  const konteks = [
    tajuk && `Tajuk: ${tajuk}`,
    input.kategori?.trim() && `Kategori: ${input.kategori.trim()}`,
    input.tarikh?.trim() && `Tarikh: ${input.tarikh.trim()}`,
    input.masa?.trim() && `Masa: ${input.masa.trim()}`,
    input.lokasi?.trim() && `Lokasi: ${input.lokasi.trim()}`,
    input.yuran?.trim() && Number(input.yuran) > 0 && `Yuran: RM${Number(input.yuran).toFixed(2)}`,
    input.yuran?.trim() && Number(input.yuran) === 0 && `Yuran: Percuma`,
    input.had_peserta?.trim() && `Had peserta: ${input.had_peserta.trim()} orang`,
    idea && `Butiran/idea kasar daripada SU: ${idea}`,
  ].filter(Boolean).join("\n");

  return panggilAI(sistem, `Sila kemaskan keterangan program ini:\n\n${konteks}`, 1200);
}

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
    ruj_bayar: String(formData.get("ruj_bayar") ?? "").trim() || null,
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
    ruj_bayar: String(formData.get("ruj_bayar") ?? "").trim() || null,
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

// Urus setia sahkan bayaran manual (resit disemak) → status 'dibayar'.
export async function sahkanPendaftaran(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("program_pendaftaran").update({ status_bayar: "dibayar", sebab_tolak: null }).eq("id", id);
  revalidatePath(`/admin/program/${programId}`);
  revalidatePath(`/program/${programId}`);
}

// Padam satu pendaftaran peserta (cth data ujian / tersalah).
export async function padamPendaftaran(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("program_pendaftaran").delete().eq("id", id);
  revalidatePath(`/admin/program/${programId}`);
  revalidatePath(`/program/${programId}`);
}

// Urus setia tolak bayaran (resit tak sah / tak diterima).
export async function tolakPendaftaran(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const programId = String(formData.get("program_id") ?? "");
  const sebab = String(formData.get("sebab") ?? "").trim() || "Bukti bayaran tidak sah / tidak diterima.";
  if (!id) return;
  const db = createAdminClient();
  await db.from("program_pendaftaran").update({ status_bayar: "tolak", sebab_tolak: sebab }).eq("id", id);
  revalidatePath(`/admin/program/${programId}`);
  revalidatePath(`/program/${programId}`);
}
