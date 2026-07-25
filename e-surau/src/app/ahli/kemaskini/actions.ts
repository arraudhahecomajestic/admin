"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil } from "@/lib/sesi";

// Ahli kemas kini & sahkan maklumat sendiri.
export async function simpanKemaskini(data: any): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!p?.ahli_id) return { ok: false, msg: "Sesi tamat. Sila log masuk semula." };
  const db = createAdminClient();

  const patch: any = {
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
        dilindungi_khairat: t.dilindungi_khairat ?? true,
      }))
    );
  }

  revalidatePath("/ahli");
  revalidatePath("/ahli/kemaskini");
  return { ok: true };
}
