"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, bolehTuntutanDalaman, jawatanProfil } from "@/lib/sesi";

// Staf/AJK hantar tuntutan dalaman sendiri (cth beli barang untuk surau).
export async function hantarTuntutanDalaman(data: {
  butiran?: string;
  jumlah?: number | string;
  url_dokumen?: string;
  tarikh_bekal?: string;
  bank?: string;
  no_akaun?: string;
  nama_akaun?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehTuntutanDalaman(p)) return { ok: false, msg: "Tiada akses untuk hantar tuntutan dalaman." };

  const butiran = (data.butiran ?? "").trim();
  const jumlah = Number(data.jumlah);
  const tarikhBekal = (data.tarikh_bekal ?? "").trim();
  const noAkaun = (data.no_akaun ?? "").replace(/\s+/g, "");
  const bank = (data.bank ?? "").trim();
  const namaAkaun = (data.nama_akaun ?? "").trim() || (p!.nama ?? null);
  if (!butiran) return { ok: false, msg: "Sila isi butiran/tujuan tuntutan." };
  if (!jumlah || jumlah <= 0) return { ok: false, msg: "Sila isi jumlah yang sah." };
  if (!tarikhBekal) return { ok: false, msg: "Sila isi tarikh pembekalan/perkhidmatan." };
  if (!noAkaun) return { ok: false, msg: "Sila isi no. akaun bank untuk pembayaran." };
  if (!bank) return { ok: false, msg: "Sila isi nama bank." };
  if (!data.url_dokumen) return { ok: false, msg: "Sila muat naik resit/bukti pembelian." };

  const db = createAdminClient();

  // Halang submission berganda: tuntutan serupa (pemohon + jumlah + tarikh
  // pembekalan yang sama) yang belum ditolak sudah wujud.
  const { data: samaAda } = await db
    .from("tuntutan_dalaman")
    .select("id")
    .eq("profil_id", p!.id)
    .eq("jumlah", jumlah)
    .eq("tarikh_bekal", tarikhBekal)
    .neq("status", "ditolak")
    .limit(1);
  if (samaAda && samaAda.length > 0) {
    return { ok: false, msg: "Tuntutan serupa (jumlah & tarikh pembekalan yang sama) sudah dihantar sebelum ini." };
  }

  const { error } = await db.from("tuntutan_dalaman").insert({
    profil_id: p!.id,
    nama_pemohon: p!.nama ?? p!.emel ?? "Staf",
    jawatan: jawatanProfil(p),
    butiran,
    jumlah,
    tarikh_bekal: tarikhBekal,
    bank,
    no_akaun: noAkaun,
    nama_akaun: namaAkaun,
    url_dokumen: data.url_dokumen,
    status: "baru",
  });
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/admin/tuntutan-saya");
  revalidatePath("/admin/tuntutan");
  return { ok: true };
}
