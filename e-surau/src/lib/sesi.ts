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
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    return null;
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profil")
    .select("id, nama, emel, ahli_id, peranan")
    .eq("id", user.id)
    .single();

  return (data as Profil) ?? null;
}

export function isStaf(p: Profil | null): boolean {
  return !!p && ["admin", "bendahari", "ajk"].includes(p.peranan);
}

export function isAdminAtauBendahari(p: Profil | null): boolean {
  return !!p && ["admin", "bendahari"].includes(p.peranan);
}
