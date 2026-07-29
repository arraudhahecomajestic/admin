import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Klien Supabase untuk server components / actions (baca sesi dari cookie).
export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // dipanggil dari Server Component — boleh diabaikan (middleware urus refresh)
        }
      },
    },
  });
}
