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
