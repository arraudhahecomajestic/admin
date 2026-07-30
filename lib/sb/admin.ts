import { createClient } from '@supabase/supabase-js';

// Klien service-role — LANGKAU RLS. SERVER SAHAJA. Jangan import ke client component.
export function sbAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY tidak diset');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
