"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";

// Individu: semak jika No. KP sudah ada dalam rekod ahli kariah → auto-isi.
export async function semakKpPembekal(noKp: string): Promise<{
  ok: boolean; wujud?: boolean; nama?: string | null; telefon?: string | null; emel?: string | null; msg?: string;
}> {
  const kp = (noKp || "").replace(/\D/g, "");
  if (kp.length < 6) return { ok: false, msg: "Sila masukkan No. Kad Pengenalan yang sah." };
  const db = createAdminClient();
  const { data } = await db.from("ahli_kariah").select("nama, telefon, emel").eq("no_kp", kp).maybeSingle();
  if (data) return { ok: true, wujud: true, nama: (data as any).nama, telefon: (data as any).telefon, emel: (data as any).emel };
  return { ok: true, wujud: false };
}

export async function simpanPembekal(data: {
  jenis_entiti?: string;
  jenis?: string;
  nama?: string;
  syarikat?: string;
  no_ssm?: string;
  no_kp?: string;
  telefon?: string;
  emel?: string;
  bank?: string;
  no_akaun?: string;
  nama_akaun?: string;
  url_kp_depan?: string;
  url_kp_belakang?: string;
  url_profil_syarikat?: string;
  url_katalog?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const emel = (data.emel || "").trim().toLowerCase();
  const entiti = data.jenis_entiti === "syarikat" ? "syarikat" : "individu";
  if (!emel || !emel.includes("@")) return { ok: false, msg: "Sila isi e-mel yang sah." };
  if (!data.bank?.trim() || !data.no_akaun?.trim()) return { ok: false, msg: "Sila lengkapkan butiran bank." };
  if (entiti === "syarikat") {
    if (!data.syarikat?.trim()) return { ok: false, msg: "Sila isi nama syarikat." };
    if (!data.no_ssm?.trim()) return { ok: false, msg: "Sila isi No. SSM." };
  } else {
    if (!data.nama?.trim()) return { ok: false, msg: "Sila isi nama." };
  }

  const db = createAdminClient();
  const { error } = await db.from("pembekal").upsert(
    {
      jenis_entiti: entiti,
      jenis: data.jenis || "Vendor",
      nama: (entiti === "syarikat" ? (data.nama || data.syarikat) : data.nama)!.trim(),
      syarikat: data.syarikat?.trim() || null,
      no_ssm: data.no_ssm?.trim() || null,
      no_kp: data.no_kp?.replace(/\D/g, "") || null,
      telefon: data.telefon?.trim() || null,
      emel,
      bank: data.bank?.trim() || null,
      no_akaun: data.no_akaun?.trim() || null,
      nama_akaun: data.nama_akaun?.trim() || null,
      url_kp_depan: data.url_kp_depan || null,
      url_kp_belakang: data.url_kp_belakang || null,
      url_profil_syarikat: data.url_profil_syarikat || null,
      url_katalog: data.url_katalog || null,
      status: "menunggu",
    },
    { onConflict: "emel" }
  );
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}
