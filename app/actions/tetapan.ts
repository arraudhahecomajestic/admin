'use server';

import { revalidatePath } from 'next/cache';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import type { Tetapan } from '@/lib/tetapan';

export async function simpanTetapan(t: Tetapan) {
  const sesi = await sesiSemasa();
  if (!sesi?.master) return { ok: false as const, error: 'Not authorized' };

  const admin = sbAdmin();
  const now = new Date().toISOString();
  const rows = [
    { kunci: 'margin_pct', nilai: Number(t.margin_pct) || 0, updated_at: now },
    { kunci: 'reserve_pct', nilai: Number(t.reserve_pct) || 0, updated_at: now },
    { kunci: 'kos_frontend', nilai: Number(t.kos_frontend) || 0, updated_at: now },
    { kunci: 'jadual_deposit', nilai: t.jadual_deposit ?? [50, 45, 5], updated_at: now },
    { kunci: 'skop_waranti', nilai: t.skop_waranti ?? 'waterproofing', updated_at: now },
    { kunci: 'harga_report_rm', nilai: Number(t.harga_report_rm) || 250, updated_at: now },
  ];
  const { error } = await admin.from('tetapan_sistem').upsert(rows, { onConflict: 'kunci' });
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/urus');
  revalidatePath('/urus/tetapan');
  return { ok: true as const };
}
