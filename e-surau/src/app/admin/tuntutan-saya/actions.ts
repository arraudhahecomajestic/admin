"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehTuntutanDalaman, jawatanProfil } from "@/lib/sesi";

// Staf/AJK hantar tuntutan dalaman sendiri (cth beli barang untuk surau).
export async function hantarTuntutanDalaman(data: {
  butiran?: string;
  jumlah?: number | string;
  url_dokumen?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehTuntutanDalaman(p)) return { ok: false, msg: "Tiada akses untuk hantar tuntutan dalaman." };

  const butiran = (data.butiran ?? "").trim();
  const jumlah = Number(data.jumlah);
  if (!butiran) return { ok: false, msg: "Sila isi butiran/tujuan tuntutan." };
  if (!jumlah || jumlah <= 0) return { ok: false, msg: "Sila isi jumlah yang sah." };
  if (!data.url_dokumen) return { ok: false, msg: "Sila muat naik resit/bukti pembelian." };

  const db = createAdminClient();
  const { error } = await db.from("tuntutan_dalaman").insert({
    profil_id: p!.id,
    nama_pemohon: p!.nama ?? p!.emel ?? "Staf",
    jawatan: jawatanProfil(p),
    butiran,
    jumlah,
    url_dokumen: data.url_dokumen,
    status: "baru",
  });
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/admin/tuntutan-saya");
  revalidatePath("/admin/tuntutan");
  return { ok: true };
}
