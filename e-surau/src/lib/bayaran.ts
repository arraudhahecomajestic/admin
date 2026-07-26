"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { statusPurchase, type Akaun } from "@/lib/chip";

const tahunSemasa = () => new Date().getFullYear();

// Sahkan status bayaran terus dari CHIP & laksanakan pemenuhan (fulfillment)
// secara idempotent. Dipanggil oleh webhook DAN halaman pulangan (backup).
export async function laksanakanBayaran(chipId: string): Promise<{ dibayar: boolean }> {
  const db = createAdminClient();
  const { data } = await db
    .from("bayaran")
    .select("id, jenis, rujukan_id, status, jumlah, emel, nama, no_rujukan")
    .eq("chip_id", chipId)
    .maybeSingle();
  const b: any = data;
  if (!b) return { dibayar: false };
  if (b.status === "dibayar") return { dibayar: true };

  const akaun: Akaun = b.jenis === "khairat" ? "khairat" : "umum";
  let p: any;
  try { p = await statusPurchase(chipId, akaun); } catch { return { dibayar: false }; }
  const dibayar = p?.status === "paid";

  if (!dibayar) {
    // hanya tandakan gagal jika benar-benar tamat (bukan masih menunggu)
    if (p?.status && !["created", "pending_execute", "pending_charge"].includes(p.status)) {
      await db.from("bayaran").update({ status: "gagal" }).eq("id", b.id);
    }
    return { dibayar: false };
  }

  // Tandakan dibayar dahulu (kunci idempotency)
  await db.from("bayaran").update({ status: "dibayar", tarikh_bayar: new Date().toISOString() }).eq("id", b.id);

  if (b.jenis === "khairat" && b.rujukan_id) {
    const keahlianId = b.rujukan_id as string;
    // ahli_id untuk resit kutipan
    const { data: k } = await db.from("keahlian_khairat").select("ahli_id").eq("id", keahlianId).maybeSingle();
    const ahliId = (k as any)?.ahli_id ?? null;
    const tahun = tahunSemasa();
    // 1) Tandakan yuran tahun ini lunas (trigger auto-aktifkan keahlian)
    await db.from("yuran_khairat").upsert(
      { keahlian_id: keahlianId, tahun, jumlah: Number(b.jumlah || 60), lunas: true, tarikh_bayar: new Date().toISOString().slice(0, 10) },
      { onConflict: "keahlian_id,tahun" }
    );
    // 2) Rekod wang sebagai kutipan (kategori Yuran Khairat) untuk resit & tabung
    const { data: kat } = await db.from("kategori_kutipan").select("id").eq("nama", "Yuran Khairat").maybeSingle();
    if (kat) {
      await db.from("kutipan").insert({
        kategori_id: (kat as any).id,
        jumlah: Number(b.jumlah || 60),
        kaedah: "online",
        ahli_id: ahliId,
        catatan: `Yuran khairat tahun ${tahun} (CHIP)`,
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "sewaan" && b.rujukan_id) {
    await db.from("sewaan").update({ kaedah_bayar: "Online (CHIP)" }).eq("id", b.rujukan_id);
    // Rekod income sewaan ke dalam Kewangan (kategori Sewaan Ruang)
    const { data: kat } = await db.from("kategori_kutipan").select("id").eq("nama", "Sewaan Ruang").maybeSingle();
    if (kat) {
      await db.from("kutipan").insert({
        kategori_id: (kat as any).id,
        jumlah: Number(b.jumlah || 0),
        kaedah: "online",
        catatan: `Sewaan ${b.no_rujukan ?? ""}${b.nama ? " — " + b.nama : ""} (CHIP)`.trim(),
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "jamuan") {
    // Sumbangan jamuan tahlil / doa selamat → rekod dalam Tabung Khas
    const { data: kat } = await db.from("kategori_kutipan").select("id").eq("nama", "Tabung Khas").maybeSingle();
    if (kat) {
      await db.from("kutipan").insert({
        kategori_id: (kat as any).id,
        jumlah: Number(b.jumlah || 0),
        kaedah: "online",
        catatan: `Sumbangan jamuan/doa selamat${b.nama ? " — " + b.nama : ""} (CHIP)`,
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  }

  return { dibayar: true };
}
