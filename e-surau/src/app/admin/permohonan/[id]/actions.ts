"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir } from "@/lib/sesi";

const hariIni = () => new Date().toISOString().slice(0, 10);

// BAHAGIAN B1 — Ulasan Setiausaha / Pengerusi MPKK
export async function ulasanSU(id: string, formData: FormData) {
  const p = await getProfil();
  if (!isPentadbir(p)) return;
  const sokong = formData.get("sokong") === "ya";
  const db = createAdminClient();
  await db.from("ahli_kariah").update({
    ulasan_su_sokong: sokong,
    ulasan_su_catatan: String(formData.get("catatan") ?? "") || null,
    ulasan_su_oleh: p!.nama ?? p!.emel,
    ulasan_su_tarikh: hariIni(),
    peringkat: sokong ? "disokong_su" : "ditolak_su",
  }).eq("id", id);
  revalidatePath(`/admin/permohonan/${id}`);
  revalidatePath("/admin");
}

// BAHAGIAN B2 — Ulasan Nazir / Pengerusi Surau
export async function ulasanNazir(id: string, formData: FormData) {
  const p = await getProfil();
  if (!isPentadbir(p)) return;
  const sokong = formData.get("sokong") === "ya";
  const db = createAdminClient();
  await db.from("ahli_kariah").update({
    ulasan_nazir_sokong: sokong,
    ulasan_nazir_catatan: String(formData.get("catatan") ?? "") || null,
    ulasan_nazir_oleh: p!.nama ?? p!.emel,
    ulasan_nazir_tarikh: hariIni(),
    peringkat: sokong ? "disokong_nazir" : "ditolak_nazir",
  }).eq("id", id);
  revalidatePath(`/admin/permohonan/${id}`);
  revalidatePath("/admin");
}

// BAHAGIAN C — Keputusan JK Kariah (admin sahaja)
export async function keputusan(id: string, formData: FormData) {
  const p = await getProfil();
  if (!p || p.peranan !== "admin") return; // hanya admin/Pengerusi JK
  const lulus = formData.get("keputusan") === "lulus";
  const db = createAdminClient();
  await db.from("ahli_kariah").update({
    status: lulus ? "lulus" : "tolak",
    keputusan_oleh: p.nama ?? p.emel,
    keputusan_tarikh: hariIni(),
    peringkat: "selesai",
  }).eq("id", id);
  revalidatePath(`/admin/permohonan/${id}`);
  revalidatePath("/admin");
}
