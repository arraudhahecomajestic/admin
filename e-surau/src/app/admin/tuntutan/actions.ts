"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, bolehKewangan } from "@/lib/sesi";

function segar() {
  revalidatePath("/admin/tuntutan");
  revalidatePath("/pembekal/portal");
  revalidatePath("/admin/kewangan");
}

// AJK / admin: luluskan atau tolak pendaftaran pembekal
export async function tetapkanStatusPembekal(formData: FormData) {
  if (!isPentadbir(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["lulus", "tolak", "menunggu"].includes(status)) return;
  const db = createAdminClient();
  await db.from("pembekal").update({ status }).eq("id", id);
  segar();
}

// AJK: sahkan tuntutan (baru → disah_ajk)
export async function sahAjk(formData: FormData) {
  const p = await getProfil();
  if (!isPentadbir(p)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("tuntutan_bayaran").update({
    status: "disah_ajk",
    sah_ajk_oleh: p?.nama ?? p?.emel ?? "AJK",
    tarikh_sah_ajk: new Date().toISOString(),
  }).eq("id", id).eq("status", "baru");
  segar();
}

// Bendahari: luluskan (disah_ajk → diluluskan) + cipta rekod Perbelanjaan + Baucer
export async function lulusBendahari(formData: FormData) {
  const p = await getProfil();
  if (!bolehKewangan(p)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();

  const { data: t } = await db
    .from("tuntutan_bayaran")
    .select("*, pembekal:pembekal(nama, jenis, bank, no_akaun, nama_akaun)")
    .eq("id", id)
    .single();
  const tu: any = t;
  if (!tu || tu.status !== "disah_ajk") return;

  // Pastikan kategori belanja "Tuntutan Pembekal"
  let katId: number | null = null;
  const { data: kat } = await db.from("kategori_belanja").select("id").eq("nama", "Tuntutan Pembekal").maybeSingle();
  if (kat) katId = (kat as any).id;
  else {
    const { data: baru } = await db.from("kategori_belanja").insert({ nama: "Tuntutan Pembekal" }).select("id").maybeSingle();
    katId = (baru as any)?.id ?? null;
  }
  if (!katId) return;

  const { data: belanja } = await db.from("perbelanjaan").insert({
    kategori_id: katId,
    jumlah: Number(tu.jumlah),
    keterangan: `${tu.no_tuntutan} — ${tu.butiran}`,
    bayar_kepada: tu.pembekal?.nama ?? null,
    cara_bayar: "Pindahan Atas Talian",
    no_rujukan_bayar: tu.no_tuntutan,
    dari_khairat: false,
    tarikh: new Date().toISOString().slice(0, 10),
    direkod_oleh: p?.nama ?? "bendahari",
  }).select("id").single();

  await db.from("tuntutan_bayaran").update({
    status: "diluluskan",
    lulus_oleh: p?.nama ?? p?.emel ?? "Bendahari",
    tarikh_lulus: new Date().toISOString(),
    perbelanjaan_id: (belanja as any)?.id ?? null,
  }).eq("id", id);
  segar();
}

// Bendahari: tanda dibayar (upload slip + rujukan)
export async function tandaDibayar(data: { id: string; url_slip?: string; rujukan_bayar?: string }): Promise<{ ok: boolean; msg?: string }> {
  if (!bolehKewangan(await getProfil())) return { ok: false, msg: "Tiada akses." };
  if (!data.id) return { ok: false, msg: "Data tidak lengkap." };
  const db = createAdminClient();
  const { error } = await db.from("tuntutan_bayaran").update({
    status: "dibayar",
    url_slip: data.url_slip || null,
    rujukan_bayar: data.rujukan_bayar || null,
    tarikh_bayar: new Date().toISOString(),
  }).eq("id", data.id).eq("status", "diluluskan");
  if (error) return { ok: false, msg: error.message };
  segar();
  return { ok: true };
}

// Tolak tuntutan
export async function tolakTuntutan(formData: FormData) {
  if (!isPentadbir(await getProfil()) && !bolehKewangan(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("tuntutan_bayaran").update({
    status: "ditolak",
    catatan: String(formData.get("catatan") ?? "") || null,
  }).eq("id", id);
  segar();
}
