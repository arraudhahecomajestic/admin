'use server';

import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';

export async function logKeluar() {
  const sb = sbServer();
  await sb.auth.signOut();
  redirect('/masuk');
}
