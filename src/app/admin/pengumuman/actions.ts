"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";

function boleh(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}
function revalidasi() {
  revalidatePath("/admin/pengumuman");
  revalidatePath("/");
}

export async function tambahPengumuman(input: { tajuk: string; kandungan: string; penting?: boolean; diterbitkan?: boolean }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  const kandungan = (input.kandungan || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk." };
  if (kandungan.length < 3) return { ok: false, msg: "Sila isi kandungan." };
  const db = createAdminClient();
  const { error } = await db.from("pengumuman").insert({
    tajuk, kandungan, penting: !!input.penting, diterbitkan: input.diterbitkan ?? true,
  });
  if (error) return { ok: false, msg: error.message };
  revalidasi();
  return { ok: true };
}

export async function simpanPengumuman(id: string, patch: { tajuk?: string; kandungan?: string; penting?: boolean; diterbitkan?: boolean }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const bersih: any = {};
  if (patch.tajuk !== undefined) bersih.tajuk = patch.tajuk.trim();
  if (patch.kandungan !== undefined) bersih.kandungan = patch.kandungan.trim();
  if (patch.penting !== undefined) bersih.penting = patch.penting;
  if (patch.diterbitkan !== undefined) bersih.diterbitkan = patch.diterbitkan;
  const { error } = await db.from("pengumuman").update(bersih).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidasi();
  return { ok: true };
}

export async function padamPengumuman(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("pengumuman").delete().eq("id", id);
  revalidasi();
  return { ok: true };
}
