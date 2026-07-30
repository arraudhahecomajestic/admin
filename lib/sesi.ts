import { sbServer } from '@/lib/sb/server';

// Peranan pengguna (pendaftaran). Master = backend, dikesan dari email.
export type Peranan = 'homeowner' | 'pro' | 'hero';

export function isMasterEmail(email?: string | null): boolean {
  if (!email) return false;
  const list = (process.env.MASTER_EMAILS ?? '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(email.toLowerCase());
}

export interface Sesi {
  userId: string;
  email: string;
  peranan: Peranan;
  master: boolean;
}

// Sesi semasa (null kalau belum login). Master ditentukan dari email, bukan DB.
export async function sesiSemasa(): Promise<Sesi | null> {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: prof } = await sb.from('profiles').select('peranan').eq('id', user.id).maybeSingle();
  return {
    userId: user.id,
    email: user.email ?? '',
    peranan: (prof?.peranan as Peranan) ?? 'homeowner',
    master: isMasterEmail(user.email),
  };
}
