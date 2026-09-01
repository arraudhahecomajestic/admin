"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isMaster } from "@/lib/sesi";
import { tambahBulan } from "@/lib/penaja";

function segar() {
  revalidatePath("/admin/penaja");
  revalidatePath("/");
  revalidatePath("/rakan");
}

export async function tambahPenaja(formData: FormData) {
  if (!isMaster(await getProfil())) return;
  const db = createAdminClient();

  let logoUrl: string | null = null;
  const logo = formData.get("logo") as File | null;
  if (logo && typeof logo === "object" && logo.size > 0) {
    const ext = (logo.name.split(".").pop() || "png").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("penaja").upload(path, logo, { contentType: logo.type || "image/png", upsert: true });
    if (!error) logoUrl = db.storage.from("penaja").getPublicUrl(path).data.publicUrl;
  }

  const tempoh = formData.get("tempoh_bulan") ? Number(formData.get("tempoh_bulan")) : null;
  const mula = String(formData.get("tarikh_mula") ?? "") || null;
  let tamat = String(formData.get("tarikh_tamat") ?? "") || null;
  // Auto-kira tarikh tamat jika ada tempoh + tarikh mula tapi tamat kosong
  if (!tamat && mula && tempoh) tamat = tambahBulan(new Date(mula), tempoh);

  await db.from("penaja").insert({
    nama: String(formData.get("nama") ?? ""),
    logo_url: logoUrl,
    pautan: String(formData.get("pautan") ?? "") || null,
    keterangan: String(formData.get("keterangan") ?? "") || null,
    kategori: String(formData.get("kategori") ?? "") || null,
    telefon: String(formData.get("telefon") ?? "") || null,
    emel: String(formData.get("emel") ?? "") || null,
    pakej: String(formData.get("pakej") ?? "") || null,
    tempoh_bulan: tempoh,
    tawaran: String(formData.get("tawaran") ?? "") || null,
    kod_promo: String(formData.get("kod_promo") ?? "").toUpperCase().trim() || null,
    susunan: formData.get("susunan") ? Number(formData.get("susunan")) : 100,
    tarikh_mula: mula,
    tarikh_tamat: tamat,
    aktif: true,
  });
  segar();
}

export async function kemasPenaja(formData: FormData) {
  if (!isMaster(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();

  const { data: sedia } = await db.from("penaja").select("logo_url").eq("id", id).single();
  let logoUrl: string | null = (sedia as any)?.logo_url ?? null;

  const buangLogo = String(formData.get("buang_logo") ?? "") === "on";
  const logo = formData.get("logo") as File | null;
  if (buangLogo) {
    logoUrl = null;
  } else if (logo && typeof logo === "object" && logo.size > 0) {
    if (logo.size > 3 * 1024 * 1024) return; // maks 3MB
    const ext = (logo.name.split(".").pop() || "png").toLowerCase();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await db.storage.from("penaja").upload(path, logo, { contentType: logo.type || "image/png", upsert: true });
    if (!error) logoUrl = db.storage.from("penaja").getPublicUrl(path).data.publicUrl;
  }

  const tempoh = formData.get("tempoh_bulan") ? Number(formData.get("tempoh_bulan")) : null;
  const mula = String(formData.get("tarikh_mula") ?? "") || null;
  let tamat = String(formData.get("tarikh_tamat") ?? "") || null;
  if (!tamat && mula && tempoh) tamat = tambahBulan(new Date(mula), tempoh);

  const set: Record<string, any> = { logo_url: logoUrl };
  const teks = (k: string) => {
    const v = formData.get(k);
    return v === null ? undefined : (String(v).trim() || null);
  };
  // Hanya kemas medan yang dihantar (borang edit ada semua medan ini)
  set.nama = String(formData.get("nama") ?? "").trim() || (sedia as any)?.nama;
  set.pautan = teks("pautan");
  set.kategori = teks("kategori");
  set.telefon = teks("telefon");
  set.emel = teks("emel");
  set.keterangan = teks("keterangan");
  set.tawaran = teks("tawaran");
  const promo = teks("kod_promo");
  set.kod_promo = promo ? promo.toUpperCase() : null;
  if (formData.get("pakej") !== null) set.pakej = String(formData.get("pakej") ?? "") || null;
  set.tempoh_bulan = tempoh;
  if (mula !== null) set.tarikh_mula = mula;
  if (tamat !== null) set.tarikh_tamat = tamat;
  if (formData.get("susunan") !== null && String(formData.get("susunan") ?? "") !== "") set.susunan = Number(formData.get("susunan"));

  await db.from("penaja").update(set).eq("id", id);
  segar();
}

export async function togglePenaja(formData: FormData) {
  if (!isMaster(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  const aktif = String(formData.get("aktif") ?? "") === "true";
  if (!id) return;
  const db = createAdminClient();
  await db.from("penaja").update({ aktif: !aktif }).eq("id", id);
  segar();
}

export async function padamPenaja(formData: FormData) {
  if (!isMaster(await getProfil())) return;
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const db = createAdminClient();
  await db.from("penaja").delete().eq("id", id);
  segar();
}
