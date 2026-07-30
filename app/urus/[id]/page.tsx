import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import { ambilTetapan } from '@/lib/tetapan';
import { computePnL } from '@/lib/wang';
import EditBQ from '@/components/EditBQ';
import StageStepper from '@/components/StageStepper';

export const dynamic = 'force-dynamic';

export default async function UrusDetail({ params }: { params: { id: string } }) {
  const sesi = await sesiSemasa();
  if (!sesi) redirect(`/masuk?next=/urus/${params.id}`);
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const { data: p } = await admin.from('projects')
    .select('id, title, status, property_type, built_up, scope_detail').eq('id', params.id).maybeSingle();
  if (!p) return <main className="max-w-3xl mx-auto p-8 text-ink-2">Projek tidak dijumpai.</main>;

  const { data: row } = await admin.from('project_bq').select('bq, subtotal').eq('project_id', params.id).maybeSingle();
  const items = (row?.bq?.items ?? []) as any[];
  const c = p.scope_detail?.contact ?? {};

  const t = await ambilTetapan();
  const subtotal = Number(row?.subtotal) || 0;
  const pnl = computePnL(subtotal, t);
  const rm = (x: number) => 'RM ' + Math.round(x).toLocaleString('en-MY');

  return (
    <main className="max-w-3xl mx-auto p-5 pb-24">
      <Link href="/urus" className="text-brand text-sm font-semibold">← Semua projek</Link>
      <h1 className="text-2xl font-semibold mt-2 mb-4">{p.title}</h1>

      <StageStepper projectId={String(p.id)} current={p.status ?? 'new'} />

      <div className="grid grid-cols-2 gap-3 mb-6">
        <Info label="Contact" value={[c.nama, c.telefon].filter(Boolean).join(' · ') || '—'} />
        <Info label="Rumah" value={[p.property_type, p.built_up ? `${p.built_up} sqft` : null].filter(Boolean).join(' · ') || '—'} />
      </div>

      {subtotal > 0 && (
        <div className="bg-[#111] text-white rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-wide text-white/50 font-bold">P&amp;L dalaman RR</div>
            <div className="text-[11px] text-white/40">margin {t.margin_pct}% · reserve {t.reserve_pct}%</div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Money label="Harga owner" value={rm(pnl.ownerPrice)} tone="white" />
            <Money label="Bhg kontraktor" value={rm(pnl.contractor)} tone="dim" />
            <Money label="Margin RR" value={rm(pnl.margin)} tone="white" />
            <Money label="Untung bersih" value={rm(pnl.net)} tone={pnl.net >= 0 ? 'green' : 'red'} sub={`${pnl.netPct}%`} />
          </div>
          <div className="text-[11px] text-white/35 mt-3">Selepas tolak reserve waranti {rm(pnl.reserve)} + front-end {rm(pnl.frontEnd)}. Owner cuma nampak harga bulat.</div>
        </div>
      )}

      <EditBQ projectId={String(p.id)} initialItems={items} />
    </main>
  );
}

function Money({ label, value, tone, sub }: { label: string; value: string; tone: 'white' | 'dim' | 'green' | 'red'; sub?: string }) {
  const cls = tone === 'green' ? 'text-green-400' : tone === 'red' ? 'text-red-400' : tone === 'dim' ? 'text-white/70' : 'text-white';
  return (
    <div>
      <div className="text-[11px] text-white/50 mb-0.5">{label}</div>
      <div className={`text-lg font-bold ${cls}`}>{value}</div>
      {sub && <div className="text-[10.5px] text-white/40">{sub}</div>}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl p-3 shadow-sm">
      <div className="text-[10.5px] uppercase tracking-wide text-ink-2 font-bold">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
