"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function mohonSewaan(data: any): Promise<{ ok: boolean; msg?: string; no?: string }> {
  if (!data?.nama_pemohon?.trim()) return { ok: false, msg: "Sila isi nama pemohon." };
  if (!data?.tarikh_acara) return { ok: false, msg: "Sila pilih tarikh acara." };
  if (!Array.isArray(data.ruang) || data.ruang.length === 0)
    return { ok: false, msg: "Sila pilih sekurang-kurangnya satu ruang/tempat." };

  const db = createAdminClient();
  const { data: row, error } = await db
    .from("sewaan")
    .insert({
      nama_pemohon: data.nama_pemohon,
      no_kp: data.no_kp || null,
      status_pemohon: data.status_pemohon || null,
      alamat: data.alamat || null,
      telefon: data.telefon || null,
      whatsapp: data.whatsapp || null,
      emel: data.emel || null,
      nama_program: data.nama_program || null,
      jenis_acara: data.jenis_acara || null,
      tarikh_acara: data.tarikh_acara,
      masa_mula: data.masa_mula || null,
      masa_tamat: data.masa_tamat || null,
      anggaran_kehadiran: data.anggaran_kehadiran ? Number(data.anggaran_kehadiran) : null,
      butiran: data.butiran || null,
      ruang: data.ruang || [],
      peralatan: data.peralatan || [],
      jumlah_ruang: data.jumlah_ruang || 0,
      jumlah_peralatan: data.jumlah_peralatan || 0,
      jumlah_keseluruhan: data.jumlah_keseluruhan || 0,
      deposit: data.deposit || 0,
      kaedah_bayar: data.kaedah_bayar || null,
      url_tandatangan: data.url_tandatangan || null,
    })
    .select("no_rujukan")
    .single();

  if (error) return { ok: false, msg: error.message };
  revalidatePath("/sewaan");
  revalidatePath("/admin/sewaan");
  return { ok: true, no: (row as any)?.no_rujukan };
}
