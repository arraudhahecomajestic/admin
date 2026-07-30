'use server';

import { revalidatePath } from 'next/cache';
import { sbAdmin } from '@/lib/sb/admin';
import { sesiSemasa } from '@/lib/sesi';

async function guardMaster() {
  const sesi = await sesiSemasa();
  if (!sesi?.master) return null;
  return sesi;
}

const slug = (s: string) =>
  (s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '').slice(0, 24);

// ---------- Tambah majlis ----------
export async function tambahMajlis(code: string, name: string) {
  if (!(await guardMaster())) return { ok: false as const, error: 'Not authorized' };
  const c = slug(code);
  if (!c || !name.trim()) return { ok: false as const, error: 'Isi kod & nama majlis.' };
  const admin = sbAdmin();

  const { error } = await admin.from('councils').insert({ code: c, name: name.trim() });
  if (error) return { ok: false as const, error: error.message };

  // Auto-cipta baris profil untuk semua jenis bangunan aktif × 1 & 2 tingkat.
  const { data: types } = await admin.from('building_types').select('code').eq('active', true);
  const rows: any[] = [];
  (types ?? []).forEach((t: any) => [1, 2].forEach((s) =>
    rows.push({ council_code: c, house_type: t.code, storeys: s })));
  if (rows.length) await admin.from('approval_profiles').upsert(rows, { onConflict: 'council_code,house_type,storeys', ignoreDuplicates: true });

  revalidatePath('/urus/approval/panduan');
  return { ok: true as const };
}

// ---------- Tambah jenis bangunan ----------
export async function tambahJenisBangunan(code: string, label: string, category: string) {
  if (!(await guardMaster())) return { ok: false as const, error: 'Not authorized' };
  const c = slug(code);
  if (!c || !label.trim()) return { ok: false as const, error: 'Isi kod & label jenis bangunan.' };
  const admin = sbAdmin();

  const { error } = await admin.from('building_types')
    .insert({ code: c, label: label.trim(), category: category === 'komersial' ? 'komersial' : 'kediaman' });
  if (error) return { ok: false as const, error: error.message };

  // Auto-cipta baris profil untuk semua majlis aktif × 1 & 2 tingkat.
  const { data: councils } = await admin.from('councils').select('code').eq('active', true);
  const rows: any[] = [];
  (councils ?? []).forEach((mj: any) => [1, 2].forEach((s) =>
    rows.push({ council_code: mj.code, house_type: c, storeys: s })));
  if (rows.length) await admin.from('approval_profiles').upsert(rows, { onConflict: 'council_code,house_type,storeys', ignoreDuplicates: true });

  revalidatePath('/urus/approval/panduan');
  return { ok: true as const };
}

// ---------- Simpan satu baris profil peraturan ----------
export interface ProfilInput {
  id: number;
  setback_rear_ft: string | number | null;
  setback_side_ft: string | number | null;
  setback_front_ft: string | number | null;
  max_coverage_pct: string | number | null;
  needs_pe_double: boolean | null;
  neighbour_consent_required: boolean | null;
  notes: string | null;
}

const num = (v: any) => (v === '' || v === null || v === undefined || isNaN(Number(v)) ? null : Number(v));

export async function simpanProfil(p: ProfilInput) {
  if (!(await guardMaster())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { error } = await admin.from('approval_profiles').update({
    setback_rear_ft: num(p.setback_rear_ft),
    setback_side_ft: num(p.setback_side_ft),
    setback_front_ft: num(p.setback_front_ft),
    max_coverage_pct: num(p.max_coverage_pct),
    needs_pe_double: p.needs_pe_double,
    neighbour_consent_required: p.neighbour_consent_required,
    notes: (p.notes || '').trim() || null,
    updated_at: new Date().toISOString(),
  }).eq('id', p.id);
  if (error) return { ok: false as const, error: error.message };
  return { ok: true as const };
}

// ---------- Simpan senarai (yuran / timeline / dokumen) ----------
export async function simpanSetting(councilCode: string, submissionType: string, kunci: string, nilai: any) {
  if (!(await guardMaster())) return { ok: false as const, error: 'Not authorized' };
  const admin = sbAdmin();
  const { error } = await admin.from('approval_settings').upsert(
    { council_code: councilCode, submission_type: submissionType || 'ubahsuai', kunci, nilai, updated_at: new Date().toISOString() },
    { onConflict: 'council_code,submission_type,kunci' },
  );
  if (error) return { ok: false as const, error: error.message };
  revalidatePath(`/urus/approval/panduan/${councilCode}`);
  return { ok: true as const };
}
