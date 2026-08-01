"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabaseAdmin";

export async function rsvpProgram(formData: FormData) {
  const program_id = String(formData.get("program_id") ?? "");
  const nama = String(formData.get("nama") ?? "").trim();
  const telefonRaw = String(formData.get("telefon") ?? "").trim();
  const telDigit = telefonRaw.replace(/\D/g, "");
  const bil = Number(formData.get("bil_orang")) || 1;
  if (!program_id || !nama) return;

  const db = createAdminClient();

  const { data: p } = await db.from("program").select("had_peserta, rsvp_dibuka").eq("id", program_id).single();
  if (!p || !(p as any).rsvp_dibuka) return;

  // Elak pendua — cari rekod sedia ada ikut telefon (atau nama jika tiada telefon)
  const { data: senaraiSedia } = await db.from("rsvp").select("id, nama, telefon, bil_orang").eq("program_id", program_id);
  const semua = (senaraiSedia as any[]) ?? [];
  const sediaAda = semua.find((r) => {
    if (telDigit) return (r.telefon || "").replace(/\D/g, "") === telDigit;
    return (r.nama || "").trim().toLowerCase() === nama.toLowerCase() && !r.telefon;
  });

  // Hormati had peserta (tolak bil sedia ada jika sedang kemas kini)
  if ((p as any).had_peserta) {
    const jum = semua.reduce((s, r) => s + Number(r.bil_orang || 0), 0);
    const bilSedia = sediaAda ? Number(sediaAda.bil_orang || 0) : 0;
    if (jum - bilSedia + bil > (p as any).had_peserta) {
      redirect(`/program/${program_id}?rsvp=penuh`);
    }
  }

  if (sediaAda) {
    await db.from("rsvp").update({ nama, telefon: telefonRaw || null, bil_orang: bil }).eq("id", sediaAda.id);
  } else {
    await db.from("rsvp").insert({ program_id, nama, telefon: telefonRaw || null, bil_orang: bil });
  }

  revalidatePath("/program");
  revalidatePath(`/program/${program_id}`);
  revalidatePath("/admin/program");
  revalidatePath("/");
  redirect(`/program/${program_id}?rsvp=ok`);
}
