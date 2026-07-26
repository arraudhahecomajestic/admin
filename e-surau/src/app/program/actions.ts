"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function rsvpProgram(formData: FormData) {
  const program_id = String(formData.get("program_id") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const telefon = String(formData.get("telefon") ?? "").trim();
  const bil = Number(formData.get("bil_orang")) || 1;
  if (!program_id || !nama) return;

  const db = createAdminClient();

  // Hormati had peserta jika ada
  const { data: p } = await db.from("program").select("had_peserta, rsvp_dibuka").eq("id", program_id).single();
  if (!p || !(p as any).rsvp_dibuka) return;
  if ((p as any).had_peserta) {
    const { data: sedia } = await db.from("rsvp").select("bil_orang").eq("program_id", program_id);
    const jum = ((sedia as any[]) ?? []).reduce((s, r) => s + Number(r.bil_orang || 0), 0);
    if (jum + bil > (p as any).had_peserta) return;
  }

  await db.from("rsvp").insert({ program_id, nama, telefon: telefon || null, bil_orang: bil });
  revalidatePath("/program");
  revalidatePath("/");
}
