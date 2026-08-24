"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { chipConfigured, ciptaPurchase, siteUrl } from "@/lib/chip";
import { cariPakej, tempohSah, hargaPenaja } from "@/lib/penaja";

// Penaja bayar sendiri (upfront). Cipta rekod penaja (aktif=false, menunggu bayaran),
// jana pautan CHIP. Logo auto-papar bila bayaran disahkan (webhook).
export async function mulaTajaanPenaja(fd: FormData): Promise<{ ok: boolean; msg?: string; checkout_url?: string }> {
  if (!chipConfigured("umum"))
    return { ok: false, msg: "Gerbang pembayaran belum disediakan. Sila hubungi admin surau." };

  const kod = String(fd.get("pakej") ?? "").trim();
  const pakej = cariPakej(kod);
  if (!pakej) return { ok: false, msg: "Sila pilih pakej tajaan." };

  const bulan = Number(fd.get("bulan") ?? 0);
  if (!tempohSah(bulan)) return { ok: false, msg: "Sila pilih tempoh tajaan (3/6/9/12 bulan)." };

  const harga = hargaPenaja(kod, bulan);
  if (!harga || harga < 1) return { ok: false, msg: "Jumlah tajaan tidak sah." };

  const nama = String(fd.get("nama") ?? "").trim();
  if (nama.length < 2) return { ok: false, msg: "Sila isi nama syarikat / perniagaan." };
  const emel = String(fd.get("emel") ?? "").trim().toLowerCase();
  if (!emel.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah untuk resit." };
  const telefon = String(fd.get("telefon") ?? "").trim() || null;
  const pautan = String(fd.get("pautan") ?? "").trim() || null;
  const kategori = String(fd.get("kategori") ?? "").trim() || "Rakan Surau";

  const db = createAdminClient();

  // Muat naik logo (jika ada) ke baldi awam 'penaja'
  let logoUrl: string | null = null;
  const logo = fd.get("logo") as File | null;
  if (logo && typeof logo === "object" && logo.size > 0) {
    if (logo.size > 3 * 1024 * 1024) return { ok: false, msg: "Saiz logo terlalu besar (maksimum 3MB)." };
    const ext = (logo.name.split(".").pop() || "png").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("penaja").upload(path, logo, { contentType: logo.type || "image/png", upsert: true });
    if (!error) logoUrl = db.storage.from("penaja").getPublicUrl(path).data.publicUrl;
  }

  // Susunan: Emas paling atas, Gangsa bawah
  const susunan = kod === "emas" ? 10 : kod === "perak" ? 20 : kod === "gangsa" ? 30 : 40;

  // Cipta rekod penaja (belum aktif — logo tak dipapar sehingga bayaran disahkan)
  const { data: pen, error: penErr } = await db
    .from("penaja")
    .insert({
      nama, logo_url: logoUrl, pautan, emel, telefon,
      kategori, pakej: kod, tempoh_bulan: bulan,
      susunan, aktif: false,
    })
    .select("id")
    .maybeSingle();
  if (penErr || !(pen as any)?.id) return { ok: false, msg: "Gagal menyimpan maklumat penaja. Cuba lagi." };
  const penajaId = (pen as any).id as string;

  const site = siteUrl();
  const ref = `PENAJA-${Date.now()}`;
  const labelTempoh = `${bulan} bulan`;

  let purchase: any;
  try {
    purchase = await ciptaPurchase({
      akaun: "umum",
      email: emel,
      nama,
      telefon: telefon || undefined,
      amountCents: Math.round(harga * 100),
      productName: `Tajaan ${pakej.nama} (${labelTempoh}) — Surau Ar-Raudhah`,
      reference: ref,
      success_redirect: `${site}/rakan/sertai/selesai?ref=${encodeURIComponent(ref)}`,
      failure_redirect: `${site}/rakan/sertai/selesai?ref=${encodeURIComponent(ref)}&gagal=1`,
      success_callback: `${site}/api/chip/webhook`,
    });
  } catch (err: any) {
    await db.from("penaja").delete().eq("id", penajaId); // buang rekod tergantung
    return { ok: false, msg: "Ralat gerbang pembayaran: " + (err?.message ?? String(err)) };
  }

  await db.from("bayaran").insert({
    chip_id: purchase.id,
    jenis: "penaja",
    no_rujukan: ref,
    nama,
    emel,
    jumlah: harga,
    status: "menunggu",
    checkout_url: purchase.checkout_url,
    rujukan_id: penajaId,
  });

  if (!purchase.checkout_url) return { ok: false, msg: "CHIP tidak mengembalikan pautan pembayaran." };
  return { ok: true, checkout_url: purchase.checkout_url };
}
