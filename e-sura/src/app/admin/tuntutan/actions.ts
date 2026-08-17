"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, bolehKewangan, bolehKewanganModul, bolehLulusVendor, jawatanProfil } from "@/lib/sesi";

function segar() {
  revalidatePath("/admin/tuntutan");
  revalidatePath("/pembekal/portal");
  revalidatePath("/admin/kewangan");
}

// Admin & Bendahari sahaja: luluskan atau tolak pendaftaran pembekal
export async function tetapkanStatusPembekal(formData: FormData) {
  if (!bolehLulusVendor(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["lulus", "tolak", "menunggu"].includes(status)) return;
  const db = createAdminClient();
  await db.from("pembekal").update({ status }).eq("id", id);
  segar();
}

// Admin / AJK / Bendahari: sahkan tuntutan (baru → disah_ajk)
export async function sahAjk(formData: FormData) {
  const p = await getProfil();
  if (!bolehKewangan(p)) return;
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

// Bendahari: assign kategori + jana Baucer dari tuntutan (disah_ajk → diluluskan).
// Baucer dijana AUTOMATIK dari data tuntutan (bendahari tak perlu taip) — status
// 'menunggu' supaya masuk aliran kelulusan Pengerusi di Kewangan.
export async function lulusBendahari(formData: FormData) {
  const p = await getProfil();
  if (!bolehKewanganModul(p)) return;
  const id = String(formData.get("id") ?? "");
  const katPilih = Number(formData.get("kategori_id") ?? 0);
  if (!id) return;
  const db = createAdminClient();

  const { data: t } = await db
    .from("tuntutan_bayaran")
    .select("*, pembekal:pembekal(nama, jenis, bank, no_akaun, nama_akaun)")
    .eq("id", id)
    .single();
  const tu: any = t;
  if (!tu || tu.status !== "disah_ajk") return;

  // Kategori yang dipilih bendahari; jika tiada, guna/cipta "Tuntutan Pembekal".
  let katId: number | null = katPilih || null;
  if (!katId) {
    const { data: kat } = await db.from("kategori_belanja").select("id").eq("nama", "Tuntutan Pembekal").maybeSingle();
    katId = (kat as any)?.id ?? null;
    if (!katId) {
      const { data: baru } = await db.from("kategori_belanja").insert({ nama: "Tuntutan Pembekal" }).select("id").maybeSingle();
      katId = (baru as any)?.id ?? null;
    }
  }
  if (!katId) return;

  const { data: belanja } = await db.from("perbelanjaan").insert({
    kategori_id: katId,
    jumlah: Number(tu.jumlah),
    keterangan: `${tu.no_tuntutan} — ${tu.butiran}`,
    bayar_kepada: tu.pembekal?.nama ?? null,
    dari_khairat: false,
    tarikh: new Date().toISOString().slice(0, 10),
    status: "menunggu",             // masuk aliran kelulusan Pengerusi
    direkod_oleh: p?.nama ?? "bendahari",
    direkod_jawatan: jawatanProfil(p),
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

// ---- Tuntutan Dalaman (AJK/Staf) ----

// Bendahari: assign kategori + jana Baucer dari tuntutan dalaman (baru → diproses).
export async function janaBaucerDalaman(formData: FormData) {
  const p = await getProfil();
  if (!bolehKewanganModul(p)) return;
  const id = String(formData.get("id") ?? "");
  const katPilih = Number(formData.get("kategori_id") ?? 0);
  if (!id) return;
  const db = createAdminClient();

  const { data: t } = await db.from("tuntutan_dalaman").select("*").eq("id", id).single();
  const tu: any = t;
  if (!tu || tu.status !== "baru") return;
  // COI: tidak boleh proses tuntutan sendiri.
  if (tu.profil_id && tu.profil_id === p!.id) return;

  let katId: number | null = katPilih || null;
  if (!katId) {
    const { data: kat } = await db.from("kategori_belanja").select("id").eq("nama", "Tuntutan Dalaman").maybeSingle();
    katId = (kat as any)?.id ?? null;
    if (!katId) {
      const { data: baru } = await db.from("kategori_belanja").insert({ nama: "Tuntutan Dalaman" }).select("id").maybeSingle();
      katId = (baru as any)?.id ?? null;
    }
  }
  if (!katId) return;

  const { data: belanja } = await db.from("perbelanjaan").insert({
    kategori_id: katId,
    jumlah: Number(tu.jumlah),
    keterangan: `${tu.no_tuntutan} — ${tu.butiran}`,
    bayar_kepada: tu.nama_pemohon ?? null,
    dari_khairat: false,
    tarikh: new Date().toISOString().slice(0, 10),
    status: "menunggu",
    direkod_oleh: p?.nama ?? "bendahari",
    direkod_jawatan: jawatanProfil(p),
  }).select("id").single();

  await db.from("tuntutan_dalaman").update({
    status: "diproses",
    kategori_id: katId,
    perbelanjaan_id: (belanja as any)?.id ?? null,
  }).eq("id", id);
  segar();
  revalidatePath("/admin/tuntutan-saya");
}

// Tolak tuntutan dalaman.
export async function tolakTuntutanDalaman(formData: FormData) {
  const p = await getProfil();
  if (!bolehKewanganModul(p) && !isPentadbir(p)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("tuntutan_dalaman").update({
    status: "ditolak",
    catatan: String(formData.get("catatan") ?? "").trim() || "Tidak diluluskan",
  }).eq("id", id).eq("status", "baru");
  segar();
  revalidatePath("/admin/tuntutan-saya");
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
