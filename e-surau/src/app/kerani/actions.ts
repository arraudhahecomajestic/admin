"use server";

import { createAdminClient } from "@/lib/supabaseAdmin";
import { getProfil, isKerani, isMaster } from "@/lib/sesi";

export type AhliKerani = {
  no_ahli: string | null;
  nama: string | null;
  gelaran: string | null;
  no_kp: string | null;
  telefon: string | null;
  no_telefon_rumah: string | null;
  alamat: string | null;
  alamat_kp: string | null;
  status_perkahwinan: string | null;
  maklumat_disahkan: boolean | null;
  tarikh_kemaskini: string | null;
};

// Carian ahli untuk kerani — server-side (senarai penuh TIDAK dihantar ke
// pelayar, jadi tiada muat turun pukal). Pulang padanan sahaja.
export async function cariAhliKerani(
  q: string,
): Promise<{ ok: boolean; msg?: string; senarai: AhliKerani[] }> {
  const p = await getProfil();
  if (!(isKerani(p) || isMaster(p))) return { ok: false, msg: "Tiada akses.", senarai: [] };

  // Buang aksara yang boleh memecahkan penapis PostgREST.
  const bersih = (q || "").replace(/[,()%*]/g, " ").trim();
  if (bersih.length < 2) return { ok: true, senarai: [] };

  const db = createAdminClient();
  const digit = bersih.replace(/\D/g, "");
  let or = `nama.ilike.%${bersih}%,no_ahli.ilike.%${bersih}%`;
  if (digit.length >= 3) or += `,no_kp.ilike.%${digit}%`;

  const { data, error } = await db
    .from("ahli_kariah")
    .select(
      "no_ahli, nama, gelaran, no_kp, telefon, no_telefon_rumah, alamat, alamat_kp, status_perkahwinan, maklumat_disahkan, tarikh_kemaskini",
    )
    .or(or)
    .order("nama", { ascending: true })
    .limit(30);

  if (error) return { ok: false, msg: error.message, senarai: [] };
  return { ok: true, senarai: (data as AhliKerani[]) ?? [] };
}
