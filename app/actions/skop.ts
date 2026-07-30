'use server';

import { revalidatePath } from 'next/cache';
import { sbServer } from '@/lib/sb/server';
import { sbAdmin } from '@/lib/sb/admin';
import { binaBQ } from '@/lib/bq/engine';
import { KERJA } from '@/lib/bq/config';

export interface SkopInput {
  property_type: string;
  built_up: number;
  bilik_air: number;
  kerja: string[];
  nama: string;
  telefon: string;
}

export async function simpanSkop(input: SkopInput) {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: 'Sila log masuk dahulu' };
  if (!input.kerja?.length) return { ok: false as const, error: 'Pilih sekurang-kurangnya satu kerja' };

  const admin = sbAdmin();
  const scope_detail = {
    kerja: input.kerja,
    dims: { built_up: input.built_up, bilik_air: input.bilik_air },
    contact: { nama: input.nama?.trim() || null, telefon: input.telefon?.trim() || null },
  };

  const { data: proj, error } = await admin.from('projects').insert({
    owner_id: user.id,
    title: `${input.property_type} · ${input.built_up || 0} sqft`,
    property_type: input.property_type,
    built_up: input.built_up || null,
    scope_detail,
    status: 'new',
  }).select('id').single();
  if (error || !proj) return { ok: false as const, error: error?.message || 'Gagal simpan projek' };

  const { data: catalog } = await admin.from('catalog_items').select('scope_code, description, unit, default_rate');
  const bq = binaBQ(input.kerja, { built_up: input.built_up, bilik_air: input.bilik_air }, catalog ?? [], KERJA);
  await admin.from('project_bq').upsert(
    { project_id: proj.id, bq, subtotal: bq.subtotal, updated_at: new Date().toISOString() },
    { onConflict: 'project_id' },
  );

  revalidatePath('/portal');
  revalidatePath('/urus');
  return { ok: true as const, id: proj.id };
}
