"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { jantinaDariNama, khamisAkan } from "@/lib/arwah";
import { chipConfigured, ciptaPurchase, siteUrl } from "@/lib/chip";

// Sumbangan jamuan tahlil / doa selamat — amount ditetapkan penyumbang sendiri.
export async function mulaSumbanganTahlil(data: {
  nama?: string;
  emel?: string;
  telefon?: string;
  amount?: number | string;
}): Promise<{ ok: boolean; msg?: string; checkout_url?: string }> {
  if (!chipConfigured("umum"))
    return { ok: false, msg: "Gerbang pembayaran belum disediakan. Sila hubungi admin surau." };
  const emel = (data.emel || "").trim().toLowerCase();
  if (!emel || !emel.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah untuk resit." };
  const amt = Number(data.amount);
  if (!amt || amt < 1) return { ok: false, msg: "Sila masukkan jumlah sumbangan (minimum RM1)." };

  const db = createAdminClient();
  const site = siteUrl();
  const ref = `JAMUAN-${Date.now()}`;

  let purchase: any;
  try {
    purchase = await ciptaPurchase({
      akaun: "umum",
      email: emel,
      nama: data.nama || undefined,
      telefon: data.telefon || undefined,
      amountCents: Math.round(amt * 100),
      productName: `Sumbangan Jamuan / Doa Selamat — Surau Ar-Raudhah`,
      reference: ref,
      success_redirect: `${site}/tahlil/selesai?ref=${encodeURIComponent(ref)}`,
      failure_redirect: `${site}/tahlil/selesai?ref=${encodeURIComponent(ref)}&gagal=1`,
      success_callback: `${site}/api/chip/webhook`,
    });
  } catch (err: any) {
    return { ok: false, msg: "Ralat gerbang pembayaran: " + (err?.message ?? String(err)) };
  }

  await db.from("bayaran").insert({
    chip_id: purchase.id,
    jenis: "jamuan",
    no_rujukan: ref,
    nama: data.nama || null,
    emel,
    jumlah: amt,
    status: "menunggu",
    checkout_url: purchase.checkout_url,
  });

  if (!purchase.checkout_url) return { ok: false, msg: "CHIP tidak mengembalikan pautan pembayaran." };
  return { ok: true, checkout_url: purchase.checkout_url };
}

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
