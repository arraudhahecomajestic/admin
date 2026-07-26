"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { jantinaDariNama, khamisAkan } from "@/lib/arwah";

export async function tambahArwah(data: {
  pemohon?: string;
  telefon?: string;
  senarai: { nama: string; jantina?: string }[];
}): Promise<{ ok: boolean; msg?: string; bil?: number }> {
  const senarai = (data.senarai || []).filter((s) => s.nama && s.nama.trim());
  if (senarai.length === 0) return { ok: false, msg: "Sila isi sekurang-kurangnya satu nama arwah." };

  const minggu = khamisAkan();
  const db = createAdminClient();
  const baris = senarai.map((s) => ({
    nama: s.nama.trim(),
    jantina: s.jantina && s.jantina !== "tidak_pasti" ? s.jantina : jantinaDariNama(s.nama),
    pemohon: data.pemohon?.trim() || null,
    telefon: data.telefon?.trim() || null,
    minggu,
  }));
  const { error } = await db.from("arwah").insert(baris);
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/tahlil");
  revalidatePath("/admin/tahlil");
  return { ok: true, bil: baris.length };
}
