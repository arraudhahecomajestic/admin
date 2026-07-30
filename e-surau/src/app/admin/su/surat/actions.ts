"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";

function boleh(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}

export async function ciptaSurat(input: {
  jenis: string; no_rujukan?: string; tarikh?: string; pihak?: string; perkara: string;
  kandungan?: string; url_fail?: string; catatan?: string;
}): Promise<{ ok: boolean; msg?: string; id?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const perkara = (input.perkara || "").trim();
  if (perkara.length < 3) return { ok: false, msg: "Sila isi perkara surat." };
  const jenis = input.jenis === "masuk" ? "masuk" : "keluar";
  const db = createAdminClient();
  const { data, error } = await db.from("surat").insert({
    jenis,
    no_rujukan: (input.no_rujukan || "").trim() || null,
    tarikh: input.tarikh || new Date().toISOString().slice(0, 10),
    pihak: (input.pihak || "").trim() || null,
    perkara,
    kandungan: (input.kandungan || "").trim() || null,
    url_fail: input.url_fail || null,
    catatan: (input.catatan || "").trim() || null,
    status: jenis === "masuk" ? "diterima" : "draf",
  }).select("id").maybeSingle();
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/surat");
  return { ok: true, id: (data as any)?.id };
}

export async function simpanSurat(id: string, patch: any): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const bersih: any = {};
  for (const k of ["no_rujukan","pihak","perkara","kandungan","catatan","status"] as const) {
    if (patch[k] !== undefined) bersih[k] = (patch[k] as string)?.trim?.() ?? patch[k] ?? null;
  }
  if (patch.tarikh !== undefined) bersih.tarikh = patch.tarikh || null;
  const { error } = await db.from("surat").update(bersih).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/surat");
  revalidatePath(`/admin/su/surat/${id}`);
  return { ok: true };
}

// Pautan bertandatangan untuk buka lampiran surat masuk (bucket private).
export async function lampiranSurat(path: string): Promise<{ ok: boolean; url?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  const { data } = await db.storage.from("surat").createSignedUrl(path, 3600);
  return { ok: true, url: data?.signedUrl };
}

export async function padamSurat(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("surat").delete().eq("id", id);
  revalidatePath("/admin/su/surat");
  return { ok: true };
}
