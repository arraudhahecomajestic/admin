import { createClient } from "@/lib/supabase/server";

export type Profil = {
  id: string;
  nama: string | null;
  emel: string | null;
  ahli_id: string | null;
  peranan: "admin" | "bendahari" | "ajk" | "ahli";
};

// Dapatkan profil pengguna yang sedang log masuk (atau null).
export async function getProfil(): Promise<Profil | null> {
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      return null;
    const supabase = createClient();
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;
    if (!user) return null;

    const { data } = await supabase
      .from("profil")
      .select("id, nama, emel, ahli_id, peranan")
      .eq("id", user.id)
      .single();

    return (data as Profil) ?? null;
  } catch {
    return null;
  }
}

export function isStaf(p: Profil | null): boolean {
  return !!p && ["admin", "bendahari", "ajk"].includes(p.peranan);
}

export function isAdminAtauBendahari(p: Profil | null): boolean {
  return !!p && ["admin", "bendahari"].includes(p.peranan);
}

// SU / Pengerusi / AJK — pentadbir penuh (permohonan, jejak, cetak, dll).
export function isPentadbir(p: Profil | null): boolean {
  return !!p && ["admin", "ajk"].includes(p.peranan);
}

// Boleh guna modul Kewangan (kutipan & belanja) — termasuk Bendahari.
export function bolehKewangan(p: Profil | null): boolean {
  return !!p && ["admin", "ajk", "bendahari"].includes(p.peranan);
}

export function isBendahari(p: Profil | null): boolean {
  return !!p && p.peranan === "bendahari";
}
