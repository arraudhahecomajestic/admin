"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { chipConfigured, ciptaPurchase, siteUrl } from "@/lib/chip";

export async function mohonSewaan(data: any): Promise<{ ok: boolean; msg?: string; no?: string; id?: string }> {
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
    .select("id, no_rujukan")
    .single();

  if (error) return { ok: false, msg: error.message };
  revalidatePath("/sewaan");
  revalidatePath("/admin/sewaan");
  return { ok: true, no: (row as any)?.no_rujukan, id: (row as any)?.id };
}

// Mula bayaran online (CHIP) untuk sesuatu permohonan sewaan.
export async function mulaBayaranSewaan(
  sewaanId: string,
  emel: string
): Promise<{ ok: boolean; msg?: string; checkout_url?: string }> {
  if (!chipConfigured())
    return { ok: false, msg: "Gerbang pembayaran belum disediakan. Sila hubungi admin surau." };
  const e = (emel || "").trim().toLowerCase();
  if (!e || !e.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah untuk pembayaran & resit." };

  const db = createAdminClient();
  const { data: s } = await db.from("sewaan").select("*").eq("id", sewaanId).single();
  if (!s) return { ok: false, msg: "Rekod sewaan tidak dijumpai." };

  const sew: any = s;
  const jumlah = Number(sew.jumlah_keseluruhan || 0) + Number(sew.deposit || 0);
  if (jumlah <= 0) return { ok: false, msg: "Tiada jumlah untuk dibayar bagi permohonan ini." };

  // Simpan emel pada rekod sewaan
  await db.from("sewaan").update({ emel: e }).eq("id", sewaanId);

  const site = siteUrl();
  const ref = sew.no_rujukan || sewaanId;
  const ruangNama = (Array.isArray(sew.ruang) ? sew.ruang : []).map((r: any) => r.nama).join(", ");

  let purchase: any;
  try {
    purchase = await ciptaPurchase({
      email: e,
      nama: sew.nama_pemohon,
      telefon: sew.telefon || sew.whatsapp || undefined,
      amountCents: Math.round(jumlah * 100),
      productName: `Sewaan ${ref}${ruangNama ? " — " + ruangNama : ""}`,
      reference: ref,
      success_redirect: `${site}/sewaan/selesai?ref=${encodeURIComponent(ref)}`,
      failure_redirect: `${site}/sewaan/selesai?ref=${encodeURIComponent(ref)}&gagal=1`,
      success_callback: `${site}/api/chip/webhook`,
    });
  } catch (err: any) {
    return { ok: false, msg: "Ralat gerbang pembayaran: " + (err?.message ?? String(err)) };
  }

  await db.from("bayaran").insert({
    chip_id: purchase.id,
    jenis: "sewaan",
    rujukan_id: sewaanId,
    no_rujukan: sew.no_rujukan,
    nama: sew.nama_pemohon,
    emel: e,
    jumlah,
    status: "menunggu",
    checkout_url: purchase.checkout_url,
  });

  if (!purchase.checkout_url) return { ok: false, msg: "CHIP tidak mengembalikan pautan pembayaran." };
  return { ok: true, checkout_url: purchase.checkout_url };
}
