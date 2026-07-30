'use server';

import { revalidatePath } from 'next/cache';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';

export async function simpanBQ(projectId: string, items: any[]) {
  const sesi = await sesiSemasa();
  if (!sesi?.master) return { ok: false as const, error: 'Not authorized' };

  const admin = sbAdmin();
  const subtotal = Math.round(items.reduce((s, i) => s + (Number(i.amount) || 0), 0) * 100) / 100;
  const { error } = await admin.from('project_bq').upsert(
    { project_id: projectId, bq: { items, subtotal }, subtotal, updated_at: new Date().toISOString() },
    { onConflict: 'project_id' },
  );
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/urus/${projectId}`);
  revalidatePath('/urus');
  revalidatePath('/portal');
  return { ok: true as const };
}
