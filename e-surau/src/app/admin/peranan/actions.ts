"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isMaster } from "@/lib/sesi";

const PERANAN_SAH = ["ahli", "imam", "ajk", "bendahari", "admin"];

export async function tetapkanPeranan(formData: FormData) {
  const saya = await getProfil();
  if (!isMaster(saya)) return;
  const id = String(formData.get("id") ?? "");
  const peranan = String(formData.get("peranan") ?? "");
  const master = String(formData.get("master") ?? "") === "on";
  if (!id || !PERANAN_SAH.includes(peranan)) return;
  // Jangan benarkan master buang status master sendiri (elak terkunci)
  const jadiMaster = id === saya!.id ? true : master;
  const db = createAdminClient();
  await db.from("profil").update({ peranan, master: jadiMaster }).eq("id", id);
  revalidatePath("/admin/peranan");
}
