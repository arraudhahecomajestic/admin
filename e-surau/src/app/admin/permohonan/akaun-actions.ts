"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isAdmin } from "@/lib/sesi";
import { siteUrl } from "@/lib/chip";

// ------- Reset Kata Laluan: hantar pautan set semula ke emel ahli -------
// Guna kunci ANON (sama seperti aliran "Lupa Kata Laluan" di laman awam) supaya
// Supabase menghantar emel pemulihan yang sah.
export async function resetKataLaluan(id: string): Promise<{ ok: boolean; msg: string }> {
  const p = await getProfil();
  if (!isAdmin(p)) return { ok: false, msg: "Hanya admin / master boleh reset kata laluan." };

  const db = createAdminClient();
  const { data: a } = await db.from("ahli_kariah").select("emel, nama").eq("id", id).maybeSingle();
  const emel = ((a as any)?.emel || "").trim().toLowerCase();
  if (!emel || !emel.includes("@"))
    return { ok: false, msg: "Ahli ini tiada e-mel yang sah. Sila kemas kini e-mel dahulu sebelum reset." };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  if (!url || !anon) return { ok: false, msg: "Supabase belum dikonfigurasi." };

  const klien = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await klien.auth.resetPasswordForEmail(emel, {
    redirectTo: `${siteUrl()}/set-kata-laluan`,
  });
  if (error) return { ok: false, msg: `Gagal hantar: ${error.message}` };

  return { ok: true, msg: `Pautan set semula kata laluan telah dihantar ke ${emel}. Minta ahli semak Peti Masuk & folder Spam.` };
}

// ------- Padam Ahli / Akaun (PAKSA) — admin/master sahaja -------
// Padam rekod ahli + akaun log masuk berkaitan. Rekod tanggungan & keahlian
// khairat turut terpadam (cascade); rekod kewangan (kutipan/invois/bayaran)
// kekal sebagai sejarah dengan pautan ahli ditetapkan null.
export async function padamAhli(id: string): Promise<{ ok: boolean; msg: string }> {
  const p = await getProfil();
  if (!isAdmin(p)) return { ok: false, msg: "Hanya admin / master boleh memadam ahli." };

  const db = createAdminClient();
  const { data: a } = await db.from("ahli_kariah").select("id, nama, no_ahli").eq("id", id).maybeSingle();
  if (!a) return { ok: false, msg: "Rekod ahli tidak dijumpai (mungkin sudah dipadam)." };

  // 1) Padam akaun log masuk berkaitan (profil.id = auth user id).
  //    Padam auth user → profil turut terpadam (cascade).
  const { data: profilRows } = await db.from("profil").select("id").eq("ahli_id", id);
  for (const r of (profilRows as any[]) ?? []) {
    try { await db.auth.admin.deleteUser(r.id); } catch { /* teruskan */ }
  }

  // 2) Padam rekod ahli → cascade tanggungan & keahlian khairat.
  const { error } = await db.from("ahli_kariah").delete().eq("id", id);
  if (error) return { ok: false, msg: `Gagal padam: ${error.message}` };

  revalidatePath("/admin");
  return { ok: true, msg: `Ahli ${(a as any).nama} (${(a as any).no_ahli}) & akaun log masuk telah dipadam.` };
}
