"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";
import { agregatKehadiran, kiraGaji, julatBulan, type GajiConfig, type KehadiranRow, type Agregat } from "@/lib/gaji";

function bolehGaji(p: Profil | null): boolean {
  // Gaji = hal sulit → SU/AJK (pentadbir) atau master sahaja. Bukan bendahari sahaja.
  return isPentadbir(p) || isMaster(p);
}

// Tarik config + ringkasan attendance untuk seorang staf pada satu bulan.
export async function pratontonGaji(profilId: string, bulan: string): Promise<{
  ok: boolean; msg?: string;
  config?: GajiConfig; agg?: Agregat; sedia?: any | null;
}> {
  const p = await getProfil();
  if (!bolehGaji(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();

  const { data: cfg } = await db.from("staf_gaji_config").select("*").eq("profil_id", profilId).maybeSingle();
  if (!cfg) return { ok: false, msg: "Konfigurasi gaji staf ini belum disediakan." };

  const { dari, hingga } = julatBulan(bulan);
  const { data: rows } = await db
    .from("staf_kehadiran")
    .select("tarikh, shift, masuk, keluar")
    .eq("profil_id", profilId)
    .gte("masuk", dari)
    .lt("masuk", hingga);

  const agg = agregatKehadiran((rows as KehadiranRow[]) ?? []);

  // Slip sedia ada (jika sudah dijana)?
  const { data: sedia } = await db.from("staf_gaji").select("*").eq("profil_id", profilId).eq("bulan", bulan).maybeSingle();

  return { ok: true, config: cfg as GajiConfig, agg, sedia: sedia ?? null };
}

// Jana / simpan slip (draf). Kira semula dari attendance + pengecualian SU.
export async function janaGaji(input: {
  profilId: string; bulan: string;
  jamOtOverride?: number | null;
  hariCutiTanpaIzin?: number;
  potonganLain?: number;
  potonganLainNota?: string;
  nota?: string;
}): Promise<{ ok: boolean; msg?: string; id?: string }> {
  const p = await getProfil();
  if (!bolehGaji(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();

  const { data: cfg } = await db.from("staf_gaji_config").select("*").eq("profil_id", input.profilId).maybeSingle();
  if (!cfg) return { ok: false, msg: "Konfigurasi gaji belum disediakan." };
  const config = cfg as GajiConfig;

  const { dari, hingga } = julatBulan(input.bulan);
  const { data: rows } = await db
    .from("staf_kehadiran").select("tarikh, shift, masuk, keluar")
    .eq("profil_id", input.profilId).gte("masuk", dari).lt("masuk", hingga);
  const agg = agregatKehadiran((rows as KehadiranRow[]) ?? []);

  const jamOt = input.jamOtOverride ?? undefined;
  const kira = kiraGaji(config, agg, {
    jam_ot: jamOt === null ? undefined : jamOt,
    hari_cuti_tanpa_izin: input.hariCutiTanpaIzin ?? 0,
    potongan_lain: input.potonganLain ?? 0,
  });

  const baris = {
    profil_id: input.profilId,
    bulan: input.bulan,
    nama: config.nama, no_kp: config.no_kp, jawatan: config.jawatan,
    bank: config.bank, no_akaun: config.no_akaun,
    hari_hadir: agg.hari_hadir, hari_tepat: agg.hari_tepat, hari_lewat: agg.hari_lewat,
    jam_ot: jamOt ?? agg.jam_ot,
    hari_cuti_tanpa_izin: input.hariCutiTanpaIzin ?? 0,
    gaji_pokok: kira.gaji_pokok, elaun_telefon: kira.elaun_telefon, elaun_perjalanan: kira.elaun_perjalanan,
    elaun_perkhidmatan: kira.elaun_perkhidmatan, elaun_kehadiran: kira.elaun_kehadiran, amaun_ot: kira.amaun_ot,
    potong_lewat: kira.potong_lewat, potong_cuti: kira.potong_cuti,
    potongan_lain: kira.potongan_lain, potongan_lain_nota: (input.potonganLainNota || "").trim() || null,
    gross: kira.gross, jumlah_potongan: kira.jumlah_potongan, net: kira.net,
    nota: (input.nota || "").trim() || null,
    status: "draf",
    dijana_oleh: p!.nama ?? p!.emel,
  };

  const { data, error } = await db.from("staf_gaji").upsert(baris, { onConflict: "profil_id,bulan" }).select("id").maybeSingle();
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/staf/gaji");
  return { ok: true, id: (data as any)?.id };
}

// Sahkan slip (kunci — status 'sah').
export async function sahkanGaji(id: string): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehGaji(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const { error } = await db.from("staf_gaji").update({
    status: "sah", disah_oleh: p!.nama ?? p!.emel, disahkan_pada: new Date().toISOString(),
  }).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/staf/gaji");
  return { ok: true };
}

// Buka semula slip untuk edit (status kembali 'draf').
export async function bukaSemulaGaji(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehGaji(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("staf_gaji").update({ status: "draf", disah_oleh: null, disahkan_pada: null }).eq("id", id);
  revalidatePath("/admin/staf/gaji");
  return { ok: true };
}

// Kemas kini config gaji staf.
export async function simpanConfig(input: Partial<GajiConfig> & { profil_id: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehGaji(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const { error } = await db.from("staf_gaji_config").update({
    gaji_pokok: input.gaji_pokok, elaun_telefon: input.elaun_telefon, elaun_perjalanan: input.elaun_perjalanan,
    elaun_perkhidmatan: input.elaun_perkhidmatan, elaun_perkhidmatan_aktif: input.elaun_perkhidmatan_aktif,
    kadar_ot: input.kadar_ot, elaun_hadir_sehari: input.elaun_hadir_sehari, maks_elaun_hadir: input.maks_elaun_hadir,
    potong_lewat: input.potong_lewat, potong_cuti_sehari: input.potong_cuti_sehari,
    bank: input.bank, no_akaun: input.no_akaun, dikemaskini: new Date().toISOString(),
  }).eq("profil_id", input.profil_id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/staf/gaji");
  return { ok: true };
}
