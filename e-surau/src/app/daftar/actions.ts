"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil } from "@/lib/sesi";

// Auto-sambung akaun login → rekod ahli kariah ikut e-mel yang sama.
// Membolehkan seseorang (cth pembekal sedia ada) menjadi ahli kariah tanpa
// perlu akaun baharu — rekod ahli dipaut ke akaun sedia ada.
export async function pautkanAhli(): Promise<string | null> {
  const p = await getProfil();
  if (!p) return null;
  if (p.ahli_id) return p.ahli_id;
  if (!p.emel) return null;
  const db = createAdminClient();
  const { data } = await db
    .from("ahli_kariah")
    .select("id")
    .eq("emel", p.emel.toLowerCase())
    .limit(1);
  const id = (data as any[])?.[0]?.id ?? null;
  if (id) await db.from("profil").update({ ahli_id: id }).eq("id", p.id);
  return id;
}

// Semakan pertama: adakah No. KP ini sudah wujud dalam rekod ahli kariah?
export async function semakKpDaftar(noKp: string): Promise<{
  ok: boolean;
  wujud?: boolean;
  nama?: string | null;
  ada_emel?: boolean;
  msg?: string;
}> {
  const kp = (noKp || "").replace(/\D/g, "");
  if (kp.length < 6) return { ok: false, msg: "Sila masukkan No. Kad Pengenalan yang sah." };
  const db = createAdminClient();
  const { data, error } = await db
    .from("ahli_kariah")
    .select("id, nama, emel")
    .eq("no_kp", kp)
    .maybeSingle();
  if (error) return { ok: false, msg: error.message };
  if (data) {
    return { ok: true, wujud: true, nama: (data as any).nama, ada_emel: !!(data as any).emel };
  }
  return { ok: true, wujud: false };
}

// Ahli sedia ada: tetapkan emel pada rekod supaya akaun baharu (signUp)
// automatik terpaut ikut emel melalui trigger handle_new_user.
export async function sediaEmelAhli(noKp: string, emel: string): Promise<{ ok: boolean; msg?: string }> {
  const kp = (noKp || "").replace(/\D/g, "");
  const e = (emel || "").trim().toLowerCase();
  if (kp.length < 6) return { ok: false, msg: "No. KP tidak sah." };
  if (!e) return { ok: false, msg: "Sila isi e-mel." };
  const db = createAdminClient();
  const { data } = await db.from("ahli_kariah").select("id").eq("no_kp", kp).maybeSingle();
  if (!data) return { ok: false, msg: "Rekod tidak dijumpai." };
  const { error } = await db.from("ahli_kariah").update({ emel: e }).eq("id", (data as any).id);
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}
