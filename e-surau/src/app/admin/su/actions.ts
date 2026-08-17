"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isAdmin } from "@/lib/sesi";

export async function tambahTugasanSu(data: {
  tajuk?: string;
  catatan?: string;
  tarikh_tamat?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!isAdmin(p)) return { ok: false, msg: "Hanya SU/Admin boleh tambah tugasan." };
  const tajuk = (data.tajuk ?? "").trim();
  if (!tajuk) return { ok: false, msg: "Sila isi tajuk tugasan." };

  const db = createAdminClient();
  const { error } = await db.from("su_tugasan").insert({
    tajuk,
    catatan: (data.catatan ?? "").trim() || null,
    tarikh_tamat: (data.tarikh_tamat ?? "").trim() || null,
    dicipta_oleh: p?.nama ?? p?.emel ?? null,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su");
  return { ok: true };
}

export async function siapkanTugasanSu(id: string, siap: boolean): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!isAdmin(p)) return { ok: false, msg: "Tiada akses." };
  if (!id) return { ok: false, msg: "ID tidak sah." };
  const db = createAdminClient();
  const { error } = await db.from("su_tugasan").update({ siap }).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su");
  return { ok: true };
}

export async function padamTugasanSu(id: string): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!isAdmin(p)) return { ok: false, msg: "Tiada akses." };
  if (!id) return { ok: false, msg: "ID tidak sah." };
  const db = createAdminClient();
  const { error } = await db.from("su_tugasan").delete().eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su");
  return { ok: true };
}
