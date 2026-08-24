"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { statusPurchase, type Akaun } from "@/lib/chip";

const tahunSemasa = () => new Date().getFullYear();

// Pastikan kategori kutipan wujud; cipta jika belum. Pulangkan id.
async function pastiKategori(db: any, nama: string, paparAwam = false): Promise<number | null> {
  const { data } = await db.from("kategori_kutipan").select("id").eq("nama", nama).maybeSingle();
  if (data?.id) return data.id;
  const { data: baru } = await db
    .from("kategori_kutipan")
    .insert({ nama, jenis_khairat: false, papar_awam: paparAwam })
    .select("id")
    .maybeSingle();
  return baru?.id ?? null;
}

// Sahkan status bayaran terus dari CHIP & laksanakan pemenuhan (fulfillment)
// secara idempotent. Dipanggil oleh webhook DAN halaman pulangan (backup).
export async function laksanakanBayaran(chipId: string): Promise<{ dibayar: boolean }> {
  const db = createAdminClient();
  const { data } = await db
    .from("bayaran")
    .select("id, jenis, rujukan_id, status, jumlah, emel, nama, no_rujukan, tahun_bil")
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
    const bilTahun = Number(b.tahun_bil || 1);
    const seunit = Number(b.jumlah || 60) / bilTahun;
    // 1) Tandakan yuran LUNAS untuk setiap tahun dalam pakej (trigger auto-aktifkan keahlian)
    for (let i = 0; i < bilTahun; i++) {
      await db.from("yuran_khairat").upsert(
        { keahlian_id: keahlianId, tahun: tahun + i, jumlah: seunit, lunas: true, tarikh_bayar: new Date().toISOString().slice(0, 10) },
        { onConflict: "keahlian_id,tahun" }
      );
    }
    // 2) Rekod wang sebagai kutipan (kategori Yuran Khairat) untuk resit & tabung
    const { data: kat } = await db.from("kategori_kutipan").select("id").eq("nama", "Yuran Khairat").maybeSingle();
    if (kat) {
      const labelTahun = bilTahun === 1 ? `${tahun}` : `${tahun}–${tahun + bilTahun - 1}`;
      await db.from("kutipan").insert({
        kategori_id: (kat as any).id,
        jumlah: Number(b.jumlah || 60),
        kaedah: "online",
        ahli_id: ahliId,
        catatan: `Yuran khairat ${bilTahun} tahun (${labelTahun}) (CHIP)`,
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "sewaan" && b.rujukan_id) {
    await db.from("sewaan").update({ kaedah_bayar: "Online (CHIP)" }).eq("id", b.rujukan_id);
    // Rekod income sewaan ke dalam Kewangan (kategori Sewaan Ruang — auto-cipta jika belum ada)
    const katId = await pastiKategori(db, "Sewaan Ruang", false);
    if (katId) {
      await db.from("kutipan").insert({
        kategori_id: katId,
        jumlah: Number(b.jumlah || 0),
        kaedah: "online",
        catatan: `Sewaan ${b.no_rujukan ?? ""}${b.nama ? " — " + b.nama : ""} (CHIP)`.trim(),
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "infaq") {
    // Infaq Subuh / Infaq Jamuan — rekod dalam kategori masing-masing (tak papar awam).
    const nama = String(b.no_rujukan || "").includes("JAMUAN")
      ? "Infaq Jamuan Yassin & Tahlil"
      : "Infaq Subuh";
    const katId = await pastiKategori(db, nama, false);
    if (katId) {
      await db.from("kutipan").insert({
        kategori_id: katId,
        jumlah: Number(b.jumlah || 0),
        kaedah: "online",
        catatan: `${nama}${b.nama ? " — " + b.nama : ""} (CHIP)`,
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "program" && b.rujukan_id) {
    // Pendaftaran program berbayar (kem/kelas) — tandakan dibayar + rekod income
    await db.from("program_pendaftaran").update({ status_bayar: "dibayar" }).eq("id", b.rujukan_id);
    const katId = await pastiKategori(db, "Yuran Program", false);
    if (katId) {
      await db.from("kutipan").insert({
        kategori_id: katId,
        jumlah: Number(b.jumlah || 0),
        kaedah: "online",
        catatan: `Yuran program${b.no_rujukan ? " " + b.no_rujukan : ""}${b.nama ? " — " + b.nama : ""} (CHIP)`,
        tarikh: new Date().toISOString().slice(0, 10),
        direkod_oleh: "CHIP",
      });
    }
  } else if (b.jenis === "jamuan") {
    // Sumbangan jamuan tahlil / doa selamat → rekod dalam Tabung Khas (auto-cipta jika belum ada)
    const katId = await pastiKategori(db, "Tabung Khas", false);
    if (katId) {
      await db.from("kutipan").insert({
        kategori_id: katId,
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
