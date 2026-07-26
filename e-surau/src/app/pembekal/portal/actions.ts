"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil } from "@/lib/sesi";

export async function hantarTuntutan(data: {
  butiran?: string;
  jumlah?: number | string;
  url_dokumen?: string;
}): Promise<{ ok: boolean; msg?: string }> {
  const p = await getProfil();
  if (!p?.pembekal_id) return { ok: false, msg: "Akaun anda belum dipautkan sebagai pembekal." };

  const db = createAdminClient();
  const { data: pb } = await db.from("pembekal").select("status").eq("id", p.pembekal_id).maybeSingle();
  if ((pb as any)?.status !== "lulus")
    return { ok: false, msg: "Akaun pembekal anda belum diluluskan oleh AJK surau. Sila tunggu kelulusan." };

  const jumlah = Number(data.jumlah);
  if (!data.butiran?.trim()) return { ok: false, msg: "Sila isi butiran tuntutan." };
  if (!jumlah || jumlah <= 0) return { ok: false, msg: "Sila isi jumlah tuntutan yang sah." };

  const { error } = await db.from("tuntutan_bayaran").insert({
    pembekal_id: p.pembekal_id,
    butiran: data.butiran.trim(),
    jumlah,
    url_dokumen: data.url_dokumen || null,
    status: "baru",
  });
  if (error) return { ok: false, msg: error.message };

  revalidatePath("/pembekal/portal");
  revalidatePath("/admin/tuntutan");
  return { ok: true };
}
