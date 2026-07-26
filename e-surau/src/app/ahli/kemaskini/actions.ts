"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil } from "@/lib/sesi";
import { layakKhairat } from "@/lib/khairat";

// Cari nama ahli sedia ada ikut No. KP (untuk auto-isi tanggungan yang juga ahli kariah).
export async function cariAhliIkutKp(noKp: string): Promise<{ ok: boolean; nama?: string }> {
  const p = await getProfil();
  if (!p) return { ok: false };
  const kp = (noKp || "").replace(/\D/g, "");
  if (kp.length < 6) return { ok: false };
  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("nama")
    .eq("no_kp", kp)
    .limit(1)
    .maybeSingle();
  if ((data as any)?.nama) return { ok: true, nama: (data as any).nama };
  return { ok: false };
}

// Ahli kemas kini & sahkan maklumat sendiri.
export async function simpanKemaskini(data: any): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!p?.ahli_id) return { ok: false, msg: "Sesi tamat. Sila log masuk semula." };
  const db = createAdminClient();

  const patch: any = {
    gelaran: data.gelaran || null,
    nama: data.nama,
    no_kp: data.no_kp,
    alamat_kp: data.alamat_kp || null,
    alamat: data.alamat || null,
    no_telefon_rumah: data.no_telefon_rumah || null,
    telefon: data.telefon || null,
    emel: data.emel || null,
    status_perkahwinan: data.status_perkahwinan || null,
    tempoh_menetap_nilai: data.tempoh_menetap_nilai ? Number(data.tempoh_menetap_nilai) : null,
    tempoh_menetap_unit: data.tempoh_menetap_unit || "tahun",
    maklumat_disahkan: true,
    tarikh_kemaskini: new Date().toISOString(),
  };
  if (data.url_kp_depan) patch.url_kp_depan = data.url_kp_depan;
  if (data.url_kp_belakang) patch.url_kp_belakang = data.url_kp_belakang;
  if (data.url_tandatangan) patch.url_tandatangan = data.url_tandatangan;
  if (data.url_selfie) patch.url_selfie = data.url_selfie;
  if (data.url_tandatangan && data.url_selfie) {
    patch.disahkan_esign = true;
    patch.tarikh_esign = new Date().toISOString();
  }

  const { error } = await db.from("ahli_kariah").update(patch).eq("id", p.ahli_id);
  if (error) {
    return {
      ok: false,
      msg: error.message.includes("duplicate")
        ? "No. KP ini sudah wujud pada rekod lain."
        : error.message,
    };
  }

  // Tanggungan: ganti semua dengan senarai baharu
  await db.from("tanggungan").delete().eq("ahli_id", p.ahli_id);
  const tgg = (data.tanggungan || []).filter((t: any) => t.nama && t.nama.trim());
  if (tgg.length) {
    await db.from("tanggungan").insert(
      tgg.map((t: any) => ({
        ahli_id: p.ahli_id,
        nama: t.nama,
        no_kp: t.no_kp || null,
        hubungan: t.hubungan || "lain",
        tarikh_lahir: t.tarikh_lahir || null,
        oku: !!t.oku,
        masih_belajar: !!t.masih_belajar,
        // kelayakan dikira oleh server (bukan input pengguna) supaya konsisten
        dilindungi_khairat: layakKhairat(t).layak,
      }))
    );
  }

  revalidatePath("/ahli");
  revalidatePath("/ahli/kemaskini");
  return { ok: true };
}
