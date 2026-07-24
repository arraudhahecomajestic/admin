import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Klien untuk browser / operasi awam (guna anon key).
// Digunakan untuk memanggil RPC pendaftaran awam.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anonKey);

// Hanya cipta klien jika env wujud — elak ralat "supabaseUrl is required"
// semasa build/prerender apabila env belum ditetapkan.
export const supabase: SupabaseClient = supabaseConfigured
  ? createClient(url, anonKey)
  : (null as unknown as SupabaseClient);
