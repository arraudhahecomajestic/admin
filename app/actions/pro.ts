'use server';

import { revalidatePath } from 'next/cache';
import { sbServer } from '@/lib/sb/server';
import { sbAdmin } from '@/lib/sb/admin';
import { sesiSemasa } from '@/lib/sesi';

export interface ProInput {
  kind: string;            // pro | hero
  company_name: string;
  full_name: string;
  ssm_no: string;
  ic_no: string;
  entity_type: string;
  cidb_grade: string;
  pic_name: string;
  pic_phone: string;
  pic_email: string;
  trades: string[];
  service_areas: string[];
  bio: string;
}

// Pengguna daftar / kemas kini profil Pro/Hero (status kekal bila kemas).
export async function daftarPro(p: ProInput) {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false as const, error: 'Sila log masuk dahulu' };

  const clean = (v: string) => (v || '').trim() || null;
  const row = {
    kind: p.kind || 'pro',
    company_name: clean(p.company_name),
    full_name: clean(p.full_name),
    ssm_no: clean(p.ssm_no),
    ic_no: clean(p.ic_no),
    entity_type: clean(p.entity_type),
    cidb_grade: clean(p.cidb_grade),
    pic_name: clean(p.pic_name),
    pic_phone: clean(p.pic_phone),
    pic_email: clean(p.pic_email),
    trades: p.trades?.length ? p.trades : null,
    service_areas: p.service_areas?.length ? p.service_areas : null,
    bio: clean(p.bio),
  };

  const admin = sbAdmin();
  const { data: existing } = await admin.from('provider_profiles').select('id').eq('id', user.id).maybeSingle();
  let error;
  if (existing) {
    ({ error } = await admin.from('provider_profiles').update(row).eq('id', user.id));
  } else {
    ({ error } = await admin.from('provider_profiles').insert({ ...row, id: user.id, status: 'pending' }));
  }
  if (error) return { ok: false as const, error: error.message };

  await admin.from('profiles').update({ peranan: p.kind === 'hero' ? 'hero' : 'pro' }).eq('id', user.id);

  revalidatePath('/daftar-pro');
  revalidatePath('/urus/pro');
  return { ok: true as const };
}

// Master luluskan / tolak.
export async function setProviderStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
  const sesi = await sesiSemasa();
  if (!sesi?.master) return { ok: false as const, error: 'Not authorized' };

  const admin = sbAdmin();
  const { error } = await admin.from('provider_profiles')
    .update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return { ok: false as const, error: error.message };

  revalidatePath('/urus/pro');
  return { ok: true as const };
}
