import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import { VERDICT_META, type Verdict } from '@/lib/approval/engine';

export const dynamic = 'force-dynamic';

const HOUSE: Record<string, string> = { teres: 'Teres', semid: 'Semi-D', banglo: 'Banglo' };
const COUNCIL: Record<string, string> = {
  mpkj: 'MPKj', sepang: 'Sepang', dbkl: 'DBKL/KL', mbpj: 'PJ', mbsa: 'Shah Alam',
  mpklang: 'Klang', petaling: 'Petaling', mps: 'Selayang', ampang: 'Ampang',
  putrajaya: 'Putrajaya', lain: 'Lain',
};
const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  check_done:  { label: 'Check je', color: '#6E6660', bg: '#f2efec' },
  wants_report:{ label: '★ Nak report', color: '#8a5a00', bg: '#fdf3e2' },
  paid:        { label: 'Dah bayar', color: '#146c37', bg: '#e9f7ee' },
  review:      { label: 'Semakan', color: '#1A1A2E', bg: '#e8e8f0' },
  issued:      { label: 'Report siap', color: '#146c37', bg: '#e9f7ee' },
  converted:   { label: 'Convert', color: '#146c37', bg: '#d7f0e0' },
  lost:        { label: 'Hilang', color: '#9a938d', bg: '#f2f2f2' },
};

export default async function UrusApprovalPage() {
  const sesi = await sesiSemasa();
  if (!sesi) redirect('/masuk?next=/urus/approval');
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const { data: rows } = await admin.from('approval_cases')
    .select('*').order('created_at', { ascending: false }).limit(300);
  const list = rows ?? [];
  const wants = list.filter((c: any) => c.status === 'wants_report').length;
  const green = list.filter((c: any) => c.auto_verdict === 'green').length;
  const amber = list.filter((c: any) => c.auto_verdict === 'amber').length;
  const red = list.filter((c: any) => c.auto_verdict === 'red').length;

  return (
    <main className="max-w-3xl mx-auto p-5 pb-24">
      <Link href="/urus" className="text-brand text-sm font-semibold">← Command Center</Link>
      <div className="flex items-start justify-between gap-3 flex-wrap mt-3">
        <div>
          <div className="text-brand font-bold tracking-widest text-xs uppercase">RENORUMAH · Approval Leads</div>
          <h1 className="text-2xl font-semibold mt-1 mb-4">Semakan kelulusan ({list.length})</h1>
        </div>
        <Link href="/urus/approval/panduan" className="text-[13px] font-semibold border border-line rounded-full px-3.5 py-2 hover:bg-white mt-1">Panduan majlis</Link>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        <Stat label="Nak report" value={wants} tone="amber" />
        <Stat label="Hijau" value={green} tone="green" />
        <Stat label="Kuning" value={amber} tone="amber" />
        <Stat label="Merah" value={red} tone="red" />
      </div>

      <div className="space-y-2.5">
        {list.map((c: any) => {
          const v = VERDICT_META[(c.auto_verdict as Verdict) ?? 'amber'];
          const st = STATUS[c.status] ?? STATUS.check_done;
          const ct = c.contact ?? {};
          return (
            <div key={c.id} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: v.color }}>{v.label}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ color: st.color, backgroundColor: st.bg }}>{st.label}</span>
                <span className="font-semibold">{ct.nama || '(tiada nama)'}</span>
                <span className="text-ink-2 text-[13px]">{ct.telefon || '—'}</span>
              </div>
              <div className="text-ink-2 text-[12.5px] mt-1">
                {[HOUSE[c.house_type] || c.house_type, c.storeys ? `${c.storeys} tingkat` : null, COUNCIL[c.council_code] || c.council_code, ct.email]
                  .filter(Boolean).join(' · ')}
              </div>
              <div className="mt-2.5">
                <Link href={`/urus/approval/${c.id}/report`} className="text-[13px] font-semibold text-brand hover:text-brand-dark">✦ Bina Report →</Link>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="text-ink-2 text-sm">Belum ada semakan lagi. Kongsi renorumah.com/approval untuk mula kumpul lead.</p>}
      </div>
    </main>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'green' | 'amber' | 'red' }) {
  const c = tone === 'green' ? '#146c37' : tone === 'red' ? '#C21F1C' : '#8a5a00';
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm text-center">
      <div className="text-2xl font-bold" style={{ color: c }}>{value}</div>
      <div className="text-[11px] text-ink-2 mt-0.5">{label}</div>
    </div>
  );
}
