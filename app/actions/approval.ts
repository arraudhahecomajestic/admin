'use server';

import { sbAdmin } from '@/lib/sb/admin';
import { nilaiApproval, type ApprovalAnswers, type Verdict, type Reason } from '@/lib/approval/engine';
import { ambilTetapan } from '@/lib/tetapan';
import { chipCreatePurchase, chipGetPurchase } from '@/lib/chip';

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://renorumah.com').replace(/\/$/, '');

export interface SemakInput extends ApprovalAnswers {
  nama: string;
  telefon: string;
  email: string;
}

export interface SemakResult {
  ok: boolean;
  error?: string;
  verdict?: Verdict;
  reasons?: Reason[];
  serviced?: boolean;
  caseId?: number;
}

export async function semakApproval(input: SemakInput): Promise<SemakResult> {
  if (!input.house_type || !input.storeys) return { ok: false, error: 'Sila lengkapkan maklumat rumah.' };
  if (!input.work_types?.length) return { ok: false, error: 'Pilih sekurang-kurangnya satu kerja.' };
  if (!input.telefon?.trim()) return { ok: false, error: 'Sila isi nombor telefon.' };

  const answers: ApprovalAnswers = {
    council_code: input.council_code,
    house_type: input.house_type,
    storeys: Number(input.storeys),
    lot_position: input.lot_position,
    work_types: input.work_types,
    work_details: input.work_details ?? null,
    poskod: input.poskod,
    size_ft: input.size_ft ? Number(input.size_ft) : null,
    unapproved: input.unapproved,
    touches_boundary: input.touches_boundary,
    ownership: input.ownership,
    start_when: input.start_when,
  };

  const admin = sbAdmin();

  let profile = null;
  if (answers.council_code && answers.council_code !== 'lain') {
    const { data } = await admin.from('approval_profiles')
      .select('setback_rear_ft, setback_side_ft, setback_front_ft, max_coverage_pct, needs_pe_double, neighbour_consent_required, notes')
      .eq('council_code', answers.council_code)
      .eq('house_type', answers.house_type)
      .eq('storeys', answers.storeys)
      .maybeSingle();
    profile = data;
  }

  const res = nilaiApproval(answers, profile);

  const contact = {
    nama: input.nama?.trim() || null,
    telefon: input.telefon?.trim() || null,
    email: input.email?.trim() || null,
  };

  let caseId: number | undefined;
  try {
    const { data } = await admin.from('approval_cases').insert({
      council_code: answers.council_code,
      house_type: answers.house_type,
      storeys: answers.storeys,
      work_type: (answers.work_types || []).join(', '),
      answers,
      auto_verdict: res.verdict,
      auto_reasons: res.reasons,
      contact,
      status: 'check_done',
    }).select('id').single();
    caseId = data?.id;
  } catch {
    // jangan gagalkan verdict pada pengguna walaupun simpan lead tersekat
  }

  return { ok: true, verdict: res.verdict, reasons: res.reasons, serviced: res.serviced, caseId };
}

// Owner tekan "Bayar RM250" — cipta purchase CHIP, pulang checkout URL.
export async function mulaBayar(caseId: number): Promise<{ ok: boolean; url?: string; error?: string }> {
  if (!caseId) return { ok: false, error: 'Kes tidak sah.' };
  const admin = sbAdmin();
  const { data: c } = await admin.from('approval_cases').select('id, contact').eq('id', caseId).maybeSingle();
  if (!c) return { ok: false, error: 'Kes tidak dijumpai.' };

  const t = await ambilTetapan();
  const priceRm = Number((t as any).harga_report_rm) || 250;
  const email = (c.contact?.email && String(c.contact.email).trim()) || `bayar+${caseId}@renorumah.com`;

  try {
    const p = await chipCreatePurchase({
      email,
      amountCents: Math.round(priceRm * 100),
      productName: `Laporan Feasibility RENORUMAH (RM${priceRm})`,
      reference: String(caseId),
      successUrl: `${SITE}/approval/bayar/selesai?case=${caseId}`,
      failureUrl: `${SITE}/approval/bayar/gagal?case=${caseId}`,
      callbackUrl: `${SITE}/api/chip/webhook`,
    });
    await admin.from('approval_cases')
      .update({ chip_purchase_id: p.id, amount: priceRm, status: 'wants_report' })
      .eq('id', caseId);
    return { ok: true, url: p.checkoutUrl };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Gagal memulakan bayaran.' };
  }
}

// Sahkan status bayaran dengan CHIP; tandakan 'paid' bila sah. Dipakai webhook + page selesai.
export async function verifyPayment(caseId: number): Promise<{ ok: boolean; paid: boolean }> {
  const admin = sbAdmin();
  const { data: c } = await admin.from('approval_cases').select('id, chip_purchase_id, status').eq('id', caseId).maybeSingle();
  if (!c?.chip_purchase_id) return { ok: false, paid: false };
  const p = await chipGetPurchase(c.chip_purchase_id);
  const paid = p?.status === 'paid';
  if (paid && c.status !== 'paid') {
    await admin.from('approval_cases').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('id', caseId);
  }
  return { ok: true, paid };
}
