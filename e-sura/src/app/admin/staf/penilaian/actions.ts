"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isAdmin, bolehNilaiStaf, jawatanProfil } from "@/lib/sesi";
import { markahAkhir, gredDari } from "@/lib/penilaian";

// Simpan penilaian prestasi staf (SU/penyelia isi markah).
export async function simpanPenilaian(data: {
  profil_id?: string;
  nama?: string;
  no_kp?: string;
  jawatan?: string;
  tempoh?: string;
  tarikh_penilaian?: string;
  markah?: Record<string, number>;
  keputusan?: string;
  gaji_semasa?: number | string;
  gaji_cadangan?: number | string;
  kekuatan?: string;
  penambahbaikan?: string;
  ulasan_am?: string;
}): Promise<{ ok: boolean; msg?: string; id?: string }> {
  const p = await getProfil();
  if (!bolehNilaiStaf(p)) return { ok: false, msg: "Anda tiada akses untuk menilai staf." };
  if (!data.profil_id) return { ok: false, msg: "Sila pilih staf." };

  const markah = data.markah ?? {};
  const pct = markahAkhir(markah);
  const g = gredDari(pct);

  const db = createAdminClient();
  const { data: rec, error } = await db.from("staf_penilaian").insert({
    profil_id: data.profil_id,
    nama: data.nama ?? null,
    no_kp: data.no_kp ?? null,
    jawatan: data.jawatan ?? null,
    tempoh: (data.tempoh ?? "").trim() || null,
    tarikh_penilaian: data.tarikh_penilaian || new Date().toISOString().slice(0, 10),
    penyelia_nama: p?.nama ?? p?.emel ?? null,
    penyelia_jawatan: jawatanProfil(p),
    markah,
    markah_akhir: pct,
    gred: g.gred,
    keputusan: (data.keputusan ?? "").trim() || null,
    gaji_semasa: data.gaji_semasa ? Number(data.gaji_semasa) : null,
    gaji_cadangan: data.gaji_cadangan ? Number(data.gaji_cadangan) : null,
    kekuatan: (data.kekuatan ?? "").trim() || null,
    penambahbaikan: (data.penambahbaikan ?? "").trim() || null,
    ulasan_am: (data.ulasan_am ?? "").trim() || null,
    status: "dihantar",
    dicipta_oleh: p?.nama ?? p?.emel ?? null,
  }).select("id").single();
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/admin/staf/penilaian");
  return { ok: true, id: (rec as any)?.id };
}

// Pengesahan Pengerusi.
export async function sahkanPenilaian(formData: FormData) {
  const p = await getProfil();
  if (!isAdmin(p)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("staf_penilaian").update({
    status: "disahkan",
    disahkan_oleh: p?.nama ?? p?.emel ?? "Pengerusi",
    tarikh_sah: new Date().toISOString(),
  }).eq("id", id);
  revalidatePath("/admin/staf/penilaian");
}

export async function padamPenilaian(formData: FormData) {
  const p = await getProfil();
  if (!isAdmin(p)) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("staf_penilaian").delete().eq("id", id);
  revalidatePath("/admin/staf/penilaian");
}
