"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";

function boleh(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}

function revalidasi() {
  revalidatePath("/admin/kandungan");
  revalidatePath("/tentang");
}

// ---- VISI / MISI ----
export async function simpanVisiMisi(input: { visi: string; misi: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const now = new Date().toISOString();
  await db.from("kandungan_surau").upsert([
    { kunci: "visi", nilai: (input.visi || "").trim(), dikemaskini: now },
    { kunci: "misi", nilai: (input.misi || "").trim(), dikemaskini: now },
  ], { onConflict: "kunci" });
  revalidasi();
  return { ok: true };
}

// ---- CARTA ORGANISASI ----
export async function tambahCarta(input: { jawatan: string; nama?: string; gambarUrl?: string; susunan?: number }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const jawatan = (input.jawatan || "").trim();
  if (jawatan.length < 2) return { ok: false, msg: "Sila isi jawatan." };
  const db = createAdminClient();
  const { error } = await db.from("carta_organisasi").insert({
    jawatan, nama: (input.nama || "").trim().toUpperCase() || null,
    gambar_url: input.gambarUrl || null, susunan: input.susunan ?? 100,
  });
  if (error) return { ok: false, msg: error.message };
  revalidasi();
  return { ok: true };
}

export async function padamCarta(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("carta_organisasi").delete().eq("id", id);
  revalidasi();
  return { ok: true };
}

// ---- BULETIN ----
export async function tambahBuletin(input: { tajuk: string; keterangan?: string; urlFail?: string; jenisFail?: string; tarikh?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 2) return { ok: false, msg: "Sila isi tajuk buletin." };
  const db = createAdminClient();
  const { error } = await db.from("buletin").insert({
    tajuk, keterangan: (input.keterangan || "").trim() || null,
    url_fail: input.urlFail || null, jenis_fail: input.jenisFail || null,
    tarikh: input.tarikh || new Date().toISOString().slice(0, 10),
  });
  if (error) return { ok: false, msg: error.message };
  revalidasi();
  return { ok: true };
}

export async function padamBuletin(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("buletin").delete().eq("id", id);
  revalidasi();
  return { ok: true };
}

export async function toggleBuletin(id: string, diterbitkan: boolean): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("buletin").update({ diterbitkan }).eq("id", id);
  revalidasi();
  return { ok: true };
}
