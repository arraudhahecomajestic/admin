"use server";

import { createAdminClient, adminConfigured } from "@/lib/supabaseAdmin";

// Borang awam — sesiapa boleh hantar (tanpa log masuk).
export async function hantarMaklumBalas(input: {
  jenis: string; nama?: string; hubungan?: string; mesej: string;
}): Promise<{ ok: boolean; msg?: string }> {
  if (!adminConfigured) return { ok: false, msg: "Sistem belum sedia." };
  const mesej = (input.mesej || "").trim();
  if (mesej.length < 5) return { ok: false, msg: "Sila tulis maklum balas anda (sekurang-kurangnya 5 aksara)." };
  const jenis = ["komplen", "cadangan", "pertanyaan", "lain"].includes(input.jenis) ? input.jenis : "cadangan";
  const db = createAdminClient();
  const { error } = await db.from("maklum_balas").insert({
    jenis,
    nama: (input.nama || "").trim() || null,
    hubungan: (input.hubungan || "").trim() || null,
    mesej,
  });
  if (error) return { ok: false, msg: error.message };
  return { ok: true };
}
