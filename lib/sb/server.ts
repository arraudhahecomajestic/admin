import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Klien Supabase server (RLS — guna anon key). Untuk Server Components & Actions.
export function sbServer() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // dipanggil dari Server Component — abaikan (middleware refresh sesi).
          }
        },
      },
    },
  );
}
