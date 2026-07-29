"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil } from "@/lib/sesi";

// Ahli mohon sertai skim khairat sendiri dari portal.
// Cipta keahlian (status tertunggak) — AJK aktifkan bila yuran RM60 dijelaskan.
export async function sertaiKhairat() {
  const p = await getProfil();
  if (!p?.ahli_id) return;
  const db = createAdminClient();

  const { data: sedia } = await db
    .from("keahlian_khairat")
    .select("id")
    .eq("ahli_id", p.ahli_id)
    .maybeSingle();
  if (sedia) return; // sudah menyertai

  await db.from("keahlian_khairat").insert({ ahli_id: p.ahli_id, status: "tertunggak" });
  revalidatePath("/ahli");
}

// Ahli lama paut akaun ke rekod sedia ada guna No. KP + 4 digit akhir telefon.
// Fallback bila auto-paut ikut emel gagal (emel berbeza / tiada).
export async function pautDenganKp(
  noKp: string,
  tel4: string
): Promise<{ ok: boolean; msg?: string; nama?: string }> {
  const p = await getProfil();
  if (!p) return { ok: false, msg: "Sesi tamat. Sila log masuk semula." };
  if (p.ahli_id) return { ok: true };

  const kp = (noKp || "").replace(/[^0-9]/g, "");
  const t4 = (tel4 || "").replace(/[^0-9]/g, "");
  if (kp.length < 6) return { ok: false, msg: "No. KP tidak sah. Masukkan nombor KP penuh." };
  if (t4.length !== 4) return { ok: false, msg: "Masukkan tepat 4 digit akhir no. telefon." };

  const db = createAdminClient();
  const { data: senarai } = await db
    .from("ahli_kariah")
    .select("id, nama, telefon")
    .eq("no_kp", kp);

  const calon = (senarai as any[]) ?? [];
  if (calon.length === 0)
    return {
      ok: false,
      msg: "Tiada rekod dengan No. KP ini. Mungkin anda ahli baharu — sila guna borang Daftar Ahli.",
    };

  const padan = calon.find((a) =>
    (a.telefon || "").replace(/[^0-9]/g, "").endsWith(t4)
  );
  if (!padan)
    return {
      ok: false,
      msg: "4 digit telefon tidak padan dengan rekod kami. Cuba lagi, atau hubungi admin surau.",
    };

  const { data: dipaut } = await db
    .from("profil")
    .select("id")
    .eq("ahli_id", padan.id)
    .limit(1);
  if (dipaut && dipaut.length > 0)
    return { ok: false, msg: "Rekod ini sudah dipautkan ke akaun lain. Sila hubungi admin surau." };

  const { error } = await db.from("profil").update({ ahli_id: padan.id }).eq("id", p.id);
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/ahli");
  return { ok: true, nama: padan.nama };
}
