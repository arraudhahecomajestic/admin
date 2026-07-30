import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import BinaReport from '@/components/BinaReport';

export const dynamic = 'force-dynamic';

const HOUSE: Record<string, string> = { teres: 'Teres', semid: 'Semi-D', banglo: 'Banglo' };
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://renorumah.com').replace(/\/$/, '');

export default async function ReportBuilder({ params }: { params: { id: string } }) {
  const sesi = await sesiSemasa();
  if (!sesi) redirect(`/masuk?next=/urus/approval/${params.id}/report`);
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const caseId = Number(params.id);
  const { data: c } = await admin.from('approval_cases')
    .select('id, contact, answers, council_code, house_type, storeys, auto_verdict').eq('id', caseId).maybeSingle();
  if (!c) return <main className="max-w-2xl mx-auto p-8 text-ink-2">Kes tidak dijumpai.</main>;

  // get-or-create report
  let { data: rep } = await admin.from('approval_reports').select('*').eq('case_id', caseId).maybeSingle();
  if (!rep) {
    const { data: created } = await admin.from('approval_reports')
      .insert({ case_id: caseId, verdict: c.auto_verdict ?? 'amber', status: 'draft' }).select('*').single();
    rep = created;
  }
  const { data: areas } = await admin.from('approval_report_areas')
    .select('*').eq('report_id', rep!.id).order('sort', { ascending: true });

  const nama = c.contact?.nama || '';
  const konteks = [HOUSE[c.house_type] || c.house_type, c.storeys ? `${c.storeys} tingkat` : null, (c.council_code || '').toUpperCase()]
    .filter(Boolean).join(', ');

  return (
    <main className="max-w-2xl mx-auto p-5 pb-28">
      <Link href="/urus/approval" className="text-brand text-sm font-semibold">← Approval leads</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Bina Report</div>
      <h1 className="text-2xl font-semibold mt-1 mb-1">{nama || `Kes #${caseId}`}</h1>
      <p className="text-ink-2 text-sm mb-5">{konteks || '—'} · Snap gambar area, taip/cakap nota kasar, AI kemas, tekan Jana.</p>

      <BinaReport
        report={rep}
        initialAreas={(areas ?? []).map((a: any) => ({ ...a, photos: Array.isArray(a.photos) ? a.photos : [] }))}
        konteks={konteks}
        ownerPhone={c.contact?.telefon || ''}
        siteUrl={SITE}
      />
    </main>
  );
}
