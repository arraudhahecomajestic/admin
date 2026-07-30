'use server';

import { revalidatePath } from 'next/cache';
import { sbAdmin } from '@/lib/sb/admin';
import { sesiSemasa } from '@/lib/sesi';
import { kemasNota } from '@/lib/ai';

async function master() {
  const s = await sesiSemasa();
  return s?.master ? s : null;
}

// Dapatkan / cipta report draf untuk satu kes.
export async function mulaReport(caseId: number) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  let { data: rep } = await admin.from('approval_reports').select('*').eq('case_id', caseId).maybeSingle();
  if (!rep) {
    const { data: c } = await admin.from('approval_cases').select('auto_verdict').eq('id', caseId).maybeSingle();
    const { data: created } = await admin.from('approval_reports')
      .insert({ case_id: caseId, verdict: c?.auto_verdict ?? 'amber', status: 'draft' })
      .select('*').single();
    rep = created;
  }
  return { ok: true as const, report: rep };
}

export async function tambahArea(reportId: number, sort: number) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { data, error } = await admin.from('approval_report_areas')
    .insert({ report_id: reportId, sort, title: '', photos: [] }).select('*').single();
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const, area: data };
}

export async function simpanArea(areaId: number, patch: { title?: string; note_raw?: string; finding?: string; action?: string }) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { error } = await admin.from('approval_report_areas').update(patch).eq('id', areaId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

export async function padamArea(areaId: number) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  await admin.from('approval_report_areas').delete().eq('id', areaId);
  return { ok: true as const };
}

// Upload foto (base64 data URL dari klien, sudah diresize). Simpan ke Storage 'assets'.
export async function uploadFoto(areaId: number, dataUrl: string) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  try {
    const m = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!m) return { ok: false as const, error: 'Format gambar tak sah.' };
    const buf = Buffer.from(m[2], 'base64');
    const ext = m[1] === 'image/png' ? 'png' : 'jpg';
    const name = `reports/${areaId}/${Date.now()}-${Math.floor(Math.random() * 1e6)}.${ext}`;
    const { error } = await admin.storage.from('assets').upload(name, buf, { contentType: m[1], upsert: true });
    if (error) return { ok: false as const, error: error.message };
    const url = admin.storage.from('assets').getPublicUrl(name).data.publicUrl;

    const { data: area } = await admin.from('approval_report_areas').select('photos').eq('id', areaId).maybeSingle();
    const photos = Array.isArray(area?.photos) ? area!.photos : [];
    photos.push(url);
    await admin.from('approval_report_areas').update({ photos }).eq('id', areaId);
    return { ok: true as const, url };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'Upload gagal.' };
  }
}

export async function padamFoto(areaId: number, url: string) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { data: area } = await admin.from('approval_report_areas').select('photos').eq('id', areaId).maybeSingle();
  const photos = (Array.isArray(area?.photos) ? area!.photos : []).filter((u: string) => u !== url);
  await admin.from('approval_report_areas').update({ photos }).eq('id', areaId);
  return { ok: true as const };
}

// AI kemas nota kasar → finding + action.
export async function kemasAI(areaTitle: string, noteRaw: string, konteks: string) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  if (!noteRaw?.trim()) return { ok: false as const, error: 'Tiada nota untuk dikemas.' };
  try {
    const out = await kemasNota({ areaTitle, noteRaw, konteks });
    return { ok: true as const, ...out };
  } catch (e: any) {
    return { ok: false as const, error: e?.message || 'AI gagal.' };
  }
}

export async function simpanMeta(reportId: number, patch: { verdict?: string; ringkasan?: string; isu_kritikal?: any }) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { error } = await admin.from('approval_reports')
    .update({ ...patch, updated_at: new Date().toISOString() }).eq('id', reportId);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// Jana report: pastikan token, tanda issued.
export async function janaReport(reportId: number, caseId: number) {
  if (!(await master())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { data: rep } = await admin.from('approval_reports').select('token').eq('id', reportId).maybeSingle();
  let token = rep?.token;
  if (!token) token = (crypto.randomUUID?.() || `${Date.now()}${Math.random()}`).replace(/-/g, '').slice(0, 18);
  const { error } = await admin.from('approval_reports')
    .update({ token, status: 'issued', issued_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('id', reportId);
  if (error) return { ok: false as const, error: error.message };
  await admin.from('approval_cases').update({ status: 'issued' }).eq('id', caseId).neq('status', 'converted');
  revalidatePath('/urus/approval');
  return { ok: true as const, token };
}
