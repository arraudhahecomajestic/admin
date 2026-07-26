"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function daftarVendor(data: any): Promise<{ ok: boolean; msg?: string; no?: string }> {
  if (!data?.nama?.trim()) return { ok: false, msg: "Sila isi nama syarikat/individu." };
  if (!data?.telefon?.trim()) return { ok: false, msg: "Sila isi no. telefon." };
  if (!Array.isArray(data.kategori) || data.kategori.length === 0)
    return { ok: false, msg: "Sila pilih sekurang-kurangnya satu kategori perkhidmatan." };

  const db = createAdminClient();
  const { data: row, error } = await db
    .from("vendor")
    .insert({
      jenis_pemohon: data.jenis_pemohon || null,
      nama: data.nama,
      no_pendaftaran: data.no_pendaftaran || null,
      kategori: data.kategori,
      pegawai: data.pegawai || null,
      telefon: data.telefon,
      whatsapp: data.whatsapp || null,
      emel: data.emel || null,
      alamat: data.alamat || null,
      keterangan: data.keterangan || null,
    })
    .select("no_rujukan")
    .single();

  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/vendor");
  return { ok: true, no: (row as any)?.no_rujukan };
}
