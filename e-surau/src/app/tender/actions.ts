"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { tenderTutup, hariIniMY } from "@/lib/tender";

// Hantar 'Nyata Minat' — awam (vendor). Fail sebut harga (jika ada) sudah
// dimuat naik ke storage di sisi klien.
export async function hantarMinat(input: {
  tender_id: string;
  nama?: string; syarikat?: string; telefon?: string; emel?: string;
  harga_tawaran?: number | string; catatan?: string;
  url_dokumen?: string; nama_dokumen?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  if (!input.tender_id) return { ok: false, msg: "Tender tidak sah." };
  const nama = (input.nama ?? "").trim();
  if (nama.length < 2) return { ok: false, msg: "Sila isi nama anda." };
  if (!(input.telefon ?? "").trim() && !(input.emel ?? "").trim())
    return { ok: false, msg: "Sila isi sekurang-kurangnya nombor telefon atau e-mel." };

  const db = createAdminClient();
  const { data: t } = await db.from("tender").select("status, tarikh_tutup").eq("id", input.tender_id).maybeSingle();
  if (!t) return { ok: false, msg: "Tender tidak dijumpai." };
  if (tenderTutup(t as any, hariIniMY())) return { ok: false, msg: "Tender ini telah ditutup. Minat tidak boleh dihantar." };

  const { error } = await db.from("tender_minat").insert({
    tender_id: input.tender_id,
    nama,
    syarikat: (input.syarikat ?? "").trim() || null,
    telefon: (input.telefon ?? "").trim() || null,
    emel: (input.emel ?? "").trim() || null,
    harga_tawaran: input.harga_tawaran != null && input.harga_tawaran !== "" ? Number(input.harga_tawaran) : null,
    catatan: (input.catatan ?? "").trim() || null,
    url_dokumen: (input.url_dokumen ?? "").trim() || null,
    nama_dokumen: (input.nama_dokumen ?? "").trim() || null,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath(`/admin/tender/${input.tender_id}`);
  return { ok: true };
}
