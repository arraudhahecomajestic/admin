"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isPentadbir, isMaster, type Profil } from "@/lib/sesi";
import { NAMA_SURAU } from "@/lib/tetapan";
import { panggilAI } from "@/lib/ai";

function boleh(p: Profil | null): boolean {
  return isPentadbir(p) || isMaster(p);
}

// Kemas nota kasar mesyuarat → minit yang tersusun & profesional (guna AI).
export async function kemasMinitAI(input: {
  tajuk?: string; jenis?: string; agenda?: string; kehadiran?: string; nota: string;
}): Promise<{ ok: boolean; teks?: string; msg?: string }> {
  if (!boleh(await getProfil())) return { ok: false, msg: "Tiada akses." };
  const nota = (input.nota || "").trim();
  if (nota.length < 10) return { ok: false, msg: "Sila taip nota/perbincangan kasar dahulu (sekurang-kurangnya beberapa ayat)." };

  const sistem = `Anda pembantu setiausaha untuk ${NAMA_SURAU}. Tugas anda menyusun nota mesyuarat yang kasar/berselerak menjadi MINIT MESYUARAT yang kemas, formal dan profesional dalam Bahasa Melayu.

GARIS PANDUAN:
- Susun ikut agenda/perkara. Guna penomboran perkara (cth 1.0, 2.0) dan sub-perkara (1.1, 1.2) jika sesuai.
- Setiap perkara: nyatakan perbincangan secara ringkas & padat, dan keputusan/ketetapan jika ada.
- Gunakan ayat pasif formal minit (cth "Mesyuarat bersetuju…", "Dimaklumkan bahawa…", "AJK dicadangkan…").
- JANGAN reka fakta, nama, angka atau keputusan yang tiada dalam nota. Kekalkan maklumat asal — cuma kemaskan bahasa & susunan.
- Jika sesuatu tidak jelas, biarkan seperti adanya tanpa menambah andaian.
- Keluarkan HANYA teks minit yang telah dikemas. Jangan tambah tajuk mesyuarat, senarai kehadiran, tandatangan, atau komen.`;

  const konteks = [
    input.tajuk ? `Tajuk: ${input.tajuk}` : "",
    input.jenis ? `Jenis: ${input.jenis}` : "",
    input.agenda ? `Agenda:\n${input.agenda}` : "",
    input.kehadiran ? `Kehadiran: ${input.kehadiran.replace(/\n/g, ", ")}` : "",
    `\nNota kasar / perbincangan untuk dikemas:\n${nota}`,
  ].filter(Boolean).join("\n");

  return panggilAI(sistem, konteks, 2000);
}

// Ambil senarai AJK (dari carta organisasi) untuk auto-isi kehadiran.
export async function senaraiAjkKehadiran(): Promise<{ ok: boolean; teks?: string }> {
  if (!boleh(await getProfil())) return { ok: false };
  const db = createAdminClient();
  const { data } = await db
    .from("carta_organisasi")
    .select("jawatan, nama, susunan")
    .eq("aktif", true)
    .order("susunan", { ascending: true });
  const baris = ((data as any[]) ?? [])
    .filter((c) => c.nama)
    .map((c) => `${c.nama}${c.jawatan ? ` (${c.jawatan})` : ""}`);
  return { ok: true, teks: baris.join("\n") };
}

export async function ciptaMesyuarat(input: {
  tajuk: string; jenis: string; tarikh?: string; masa?: string; tempat?: string;
}): Promise<{ ok: boolean; msg?: string; id?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk mesyuarat." };
  const db = createAdminClient();
  const { data, error } = await db.from("mesyuarat").insert({
    tajuk, jenis: input.jenis || "AJK",
    tarikh: input.tarikh || null, masa: (input.masa || "").trim() || null,
    tempat: (input.tempat || "").trim() || null,
    pencatat: p!.nama ?? p!.emel,
  }).select("id").maybeSingle();
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/mesyuarat");
  return { ok: true, id: (data as any)?.id };
}

export async function simpanMesyuarat(id: string, patch: {
  tajuk?: string; jenis?: string; tarikh?: string; masa?: string; tempat?: string;
  pengerusi?: string; pencatat?: string; kehadiran?: string; agenda?: string; minit?: string; status?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const db = createAdminClient();
  const bersih: any = {};
  for (const k of ["tajuk","jenis","masa","tempat","pengerusi","pencatat","kehadiran","agenda","minit","status"] as const) {
    if (patch[k] !== undefined) bersih[k] = (patch[k] as string)?.trim?.() ?? patch[k] ?? null;
  }
  if (patch.tarikh !== undefined) bersih.tarikh = patch.tarikh || null;
  const { error } = await db.from("mesyuarat").update(bersih).eq("id", id);
  if (error) return { ok: false, msg: error.message };
  revalidatePath("/admin/su/mesyuarat");
  revalidatePath(`/admin/su/mesyuarat/${id}`);
  return { ok: true };
}

export async function padamMesyuarat(id: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat").delete().eq("id", id);
  revalidatePath("/admin/su/mesyuarat");
  return { ok: true };
}

// ---- Tindakan (action items) ----
export async function tambahTindakan(input: { mesyuaratId: string; perkara: string; tanggungjawab?: string; tarikhSasar?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false, msg: "Tiada akses." };
  const perkara = (input.perkara || "").trim();
  if (perkara.length < 3) return { ok: false, msg: "Sila isi perkara tindakan." };
  const db = createAdminClient();
  const { error } = await db.from("mesyuarat_tindakan").insert({
    mesyuarat_id: input.mesyuaratId, perkara,
    tanggungjawab: (input.tanggungjawab || "").trim() || null,
    tarikh_sasar: input.tarikhSasar || null,
  });
  if (error) return { ok: false, msg: error.message };
  revalidatePath(`/admin/su/mesyuarat/${input.mesyuaratId}`);
  return { ok: true };
}

export async function ubahStatusTindakan(id: string, mesyuaratId: string, status: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat_tindakan").update({ status }).eq("id", id);
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}

export async function padamTindakan(id: string, mesyuaratId: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!boleh(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("mesyuarat_tindakan").delete().eq("id", id);
  revalidatePath(`/admin/su/mesyuarat/${mesyuaratId}`);
  return { ok: true };
}
