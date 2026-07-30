import { createBrowserClient } from '@supabase/ssr';

// Klien Supabase pelayar (anon key — semua table dijaga RLS).
export function sbBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
