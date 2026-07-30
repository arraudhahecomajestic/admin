'use server';

import { revalidatePath } from 'next/cache';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';

export async function setStage(projectId: string, stage: string) {
  const sesi = await sesiSemasa();
  if (!sesi?.master) return { ok: false as const, error: 'Not authorized' };

  const admin = sbAdmin();
  const { error } = await admin.from('projects').update({ status: stage }).eq('id', projectId);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/urus/${projectId}`);
  revalidatePath('/urus');
  return { ok: true as const };
}
