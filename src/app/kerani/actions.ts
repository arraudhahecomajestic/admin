"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isKerani, isMaster, type Profil } from "@/lib/sesi";
import { hariIni } from "@/lib/staf";

function bolehStaf(p: Profil | null): boolean {
  return isKerani(p) || isMaster(p);
}

export type AhliKerani = {
  no_ahli: string | null;
  nama: string | null;
  gelaran: string | null;
  no_kp: string | null;
  telefon: string | null;
  no_telefon_rumah: string | null;
  alamat: string | null;
  alamat_kp: string | null;
  status_perkahwinan: string | null;
  maklumat_disahkan: boolean | null;
  tarikh_kemaskini: string | null;
};

// Carian ahli untuk kerani — server-side (senarai penuh TIDAK dihantar ke
// pelayar, jadi tiada muat turun pukal). Pulang padanan sahaja.
export async function cariAhliKerani(
  q: string,
): Promise<{ ok: boolean; msg?: string; senarai: AhliKerani[] }> {
  const p = await getProfil();
  if (!(isKerani(p) || isMaster(p))) return { ok: false, msg: "Tiada akses.", senarai: [] };

  // Buang aksara yang boleh memecahkan penapis PostgREST.
  const bersih = (q || "").replace(/[,()%*]/g, " ").trim();
  if (bersih.length < 2) return { ok: true, senarai: [] };

  const db = createAdminClient();
  const digit = bersih.replace(/\D/g, "");
  let or = `nama.ilike.%${bersih}%,no_ahli.ilike.%${bersih}%`;
  if (digit.length >= 3) or += `,no_kp.ilike.%${digit}%`;

  const { data, error } = await db
    .from("ahli_kariah")
    .select(
      "no_ahli, nama, gelaran, no_kp, telefon, no_telefon_rumah, alamat, alamat_kp, status_perkahwinan, maklumat_disahkan, tarikh_kemaskini",
    )
    .or(or)
    .order("nama", { ascending: true })
    .limit(30);

  if (error) return { ok: false, msg: error.message, senarai: [] };
  return { ok: true, senarai: (data as AhliKerani[]) ?? [] };
}

// Tambah rekod ASAS ahli (dari borang hardcopy yang belum ada dalam sistem):
// hanya Nama, No. KP & E-mel. Ditanda "belum disahkan" supaya ahli lengkapkan
// sendiri kemudian. Menyemak pendua No. KP dahulu.
export async function tambahAhliRingkas(input: {
  nama: string;
  noKp: string;
  emel: string;
}): Promise<{ ok: boolean; msg?: string; dup?: boolean; no_ahli?: string | null }> {
  const p = await getProfil();
  if (!(isKerani(p) || isMaster(p))) return { ok: false, msg: "Tiada akses." };

  const nama = (input.nama || "").trim().replace(/\s+/g, " ").toUpperCase();
  const noKp = (input.noKp || "").replace(/\D/g, "");
  const emel = (input.emel || "").trim().toLowerCase();

  if (nama.length < 3) return { ok: false, msg: "Nama tidak sah (terlalu pendek)." };
  if (noKp.length < 6) return { ok: false, msg: "No. Kad Pengenalan tidak sah." };
  if (emel && !emel.includes("@")) return { ok: false, msg: "E-mel tidak sah." };

  const db = createAdminClient();

  // Semak pendua — jika No. KP sudah ada, itu memang kes "hardcopy + dah dlm sistem".
  const { data: sedia } = await db
    .from("ahli_kariah")
    .select("no_ahli, nama")
    .eq("no_kp", noKp)
    .maybeSingle();
  if (sedia) {
    return {
      ok: false,
      dup: true,
      msg: `No. KP ini sudah ada dalam sistem (No. Ahli ${(sedia as any).no_ahli ?? "-"} — ${(sedia as any).nama ?? ""}). Tak perlu tambah; suruh ahli kemas kini sahaja.`,
    };
  }

  const { data, error } = await db
    .from("ahli_kariah")
    .insert({
      nama,
      no_kp: noKp,
      telefon: "", // wajib not-null; ahli lengkapkan masa kemas kini
      emel: emel || null,
      sumber: "Hardcopy (Kerani)",
      maklumat_disahkan: false,
    })
    .select("no_ahli")
    .maybeSingle();

  if (error) {
    return {
      ok: false,
      msg: error.message.includes("duplicate") ? "No. KP ini sudah wujud." : error.message,
    };
  }
  return { ok: true, no_ahli: (data as any)?.no_ahli ?? null };
}

// ---------- PORTAL STAF ----------

// Clock in / out ikut shift (toggle).
export async function clockShift(shift: string): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehStaf(p)) return { ok: false, msg: "Tiada akses." };
  const sh = shift === "petang" ? "petang" : "pagi";
  const db = createAdminClient();
  const { data: buka } = await db
    .from("staf_kehadiran")
    .select("id, masuk, keluar")
    .eq("profil_id", p!.id)
    .eq("tarikh", hariIni())
    .eq("shift", sh)
    .is("keluar", null)
    .order("dicipta", { ascending: false })
    .maybeSingle();
  if (buka?.id) {
    await db.from("staf_kehadiran").update({ keluar: new Date().toISOString() }).eq("id", buka.id);
  } else {
    await db.from("staf_kehadiran").insert({
      profil_id: p!.id, nama: p!.nama ?? p!.emel, shift: sh, masuk: new Date().toISOString(),
    });
  }
  revalidatePath("/kerani");
  return { ok: true };
}

// Tanda / nyahtanda item checklist untuk hari ini.
export async function tandaChecklist(itemId: number, siap: boolean): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehStaf(p)) return { ok: false };
  const db = createAdminClient();
  if (siap) {
    await db.from("staf_checklist_log").upsert(
      { item_id: itemId, tarikh: hariIni(), siap: true, oleh: p!.nama ?? p!.emel, masa: new Date().toISOString() },
      { onConflict: "item_id,tarikh" },
    );
  } else {
    await db.from("staf_checklist_log").delete().eq("item_id", itemId).eq("tarikh", hariIni());
  }
  revalidatePath("/kerani");
  return { ok: true };
}

// Tanda tugasan siap.
export async function siapTugasan(id: string, nota: string): Promise<{ ok: boolean }> {
  const p = await getProfil();
  if (!bolehStaf(p)) return { ok: false };
  const db = createAdminClient();
  await db.from("staf_tugasan").update({
    status: "siap", tarikh_siap: new Date().toISOString(), nota_siap: (nota || "").trim() || null,
  }).eq("id", id);
  revalidatePath("/kerani");
  revalidatePath("/admin/staf");
  return { ok: true };
}

// Hantar laporan / aduan.
export async function hantarLaporan(input: { tajuk: string; keterangan?: string; urlGambar?: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehStaf(p)) return { ok: false, msg: "Tiada akses." };
  const tajuk = (input.tajuk || "").trim();
  if (tajuk.length < 3) return { ok: false, msg: "Sila isi tajuk laporan." };
  const db = createAdminClient();
  await db.from("staf_laporan").insert({
    tajuk, keterangan: (input.keterangan || "").trim() || null, url_gambar: input.urlGambar || null,
    oleh: p!.nama ?? p!.emel,
  });
  revalidatePath("/kerani");
  revalidatePath("/admin/staf");
  return { ok: true };
}

// Tambah log aktiviti harian.
export async function tambahLog(input: { shift?: string; catatan: string }): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!bolehStaf(p)) return { ok: false, msg: "Tiada akses." };
  const catatan = (input.catatan || "").trim();
  if (catatan.length < 2) return { ok: false, msg: "Sila isi catatan." };
  const db = createAdminClient();
  await db.from("staf_log").insert({
    profil_id: p!.id, nama: p!.nama ?? p!.emel, shift: input.shift || null, catatan,
  });
  revalidatePath("/kerani");
  return { ok: true };
}
