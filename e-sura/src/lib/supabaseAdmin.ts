import { createClient } from "@supabase/supabase-js";

// Klien pentadbir (server sahaja) — guna service_role key yang MEM-BYPASS RLS.
// JANGAN import fail ini dalam komponen client. Hanya guna dalam server
// components, route handlers, atau server actions.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const adminConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
);
