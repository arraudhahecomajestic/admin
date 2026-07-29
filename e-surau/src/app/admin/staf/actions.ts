"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";

function bolehUrus(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}

// Beri tugasan khas baru kepada staf.
export async function tugasBaru(input: { tajuk: string; keterangan?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehUrus(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk tugasan." };
  const db = createAdminClient();
  const { error } = await db.from("staf_tugasan").insert({
    tajuk, keterangan: (input.keterangan || "").trim() || null,
    oleh_tugas: p!.nama ?? p!.emel,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/staf");
  revalidatePath("/kerani");
  return { ok: true };
}

// Batal tugasan.
export async function batalTugasan(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehUrus(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("staf_tugasan").update({ status: "batal" }).eq("id", id);
  revalidatePath("/admin/staf");
  revalidatePath("/kerani");
  return { ok: true };
}

// Kemas kini status laporan/aduan + catat tindakan.
export async function tindakLaporan(input: { id: string; status: string; tindakan?: string }): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehUrus(p)) return { ok: false };
  const status = ["baru", "dalam_tindakan", "selesai"].includes(input.status) ? input.status : "baru";
  const db = createAdminClient();
  await db.from("staf_laporan").update({
    status, tindakan: (input.tindakan || "").trim() || null,
  }).eq("id", input.id);
  revalidatePath("/admin/staf");
  return { ok: true };
}

// Tambah item checklist templat.
export async function tambahChecklistItem(input: { tajuk: string; shift?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehUrus(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk item." };
  const shift = ["pagi", "petang", "semua"].includes(input.shift || "") ? input.shift : "semua";
  const db = createAdminClient();
  const { error } = await db.from("staf_checklist_item").insert({ tajuk, shift });
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/staf");
  revalidatePath("/kerani");
  return { ok: true };
}

// Aktif/nyahaktif item checklist.
export async function toggleChecklistItem(id: number, aktif: boolean): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehUrus(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("staf_checklist_item").update({ aktif }).eq("id", id);
  revalidatePath("/admin/staf");
  revalidatePath("/kerani");
  return { ok: true };
}
