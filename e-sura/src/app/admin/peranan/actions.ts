"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isMaster } from "@/lib/sesi";
import { aksesUntukJawatan } from "@/lib/jawatan";

// Tetapkan jawatan → peranan (akses) & master di-set automatik ikut pemetaan.
export async function tetapkanPeranan(formData: FormData) {
  const saya = await getProfil();
  if (!isMaster(saya)) return;
  const id = String(formData.get("id") ?? "");
  const jawatan = String(formData.get("jawatan") ?? "").trim();
  const akses = aksesUntukJawatan(jawatan);
  if (!id || !akses) return;
  // Jangan benarkan master buang status master sendiri (elak terkunci).
  const jadiMaster = id === saya!.id ? true : akses.master;
  const db = createAdminClient();
  await db.from("profil").update({
    peranan: akses.peranan,
    master: jadiMaster,
    jawatan: akses.jawatan,
  }).eq("id", id);
  revalidatePath("/admin/peranan");
}
