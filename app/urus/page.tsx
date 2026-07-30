import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import { stageInfo } from '@/lib/talian';

export const dynamic = 'force-dynamic';

export default async function UrusPage() {
  const sesi = await sesiSemasa();
  if (!sesi) redirect('/masuk?next=/urus');
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const { data: projects } = await admin.from('projects')
    .select('id, title, status, property_type, built_up, scope_detail, created_at')
    .order('created_at', { ascending: false }).limit(100);
  const list = projects ?? [];
  const ids = list.map((p: any) => p.id);
  const subOf: Record<string, number> = {};
  if (ids.length) {
    const { data: bqs } = await admin.from('project_bq').select('project_id, subtotal').in('project_id', ids);
    (bqs ?? []).forEach((b: any) => { subOf[b.project_id] = Number(b.subtotal) || 0; });
  }

  return (
    <main className="max-w-3xl mx-auto p-5 pb-24">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="text-brand font-bold tracking-widest text-xs uppercase">RENORUMAH · Command Center</div>
          <h1 className="text-2xl font-semibold mt-1">Semua projek ({list.length})</h1>
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Link href="/urus/approval" className="text-[13px] font-semibold border border-line rounded-full px-3.5 py-2 hover:bg-white">Approval leads</Link>
          <Link href="/urus/pro" className="text-[13px] font-semibold border border-line rounded-full px-3.5 py-2 hover:bg-white">Roster Pro/Hero</Link>
          <Link href="/urus/tetapan" className="text-[13px] font-semibold border border-line rounded-full px-3.5 py-2 hover:bg-white">Settings</Link>
        </div>
      </div>

      <div className="space-y-3 mt-4">
        {list.map((p: any) => {
          const c = p.scope_detail?.contact ?? {};
          const s = stageInfo(p.status);
          return (
            <Link key={p.id} href={`/urus/${p.id}`} className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">{p.title}</span>
                  <span className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: s.color }}>{s.label}</span>
                </div>
                <div className="text-ink-2 text-[12.5px]">{[p.property_type, p.built_up ? `${p.built_up} sqft` : null, c.nama, c.telefon].filter(Boolean).join(' · ')}</div>
              </div>
              <div className="shrink-0 text-right"><div className="font-semibold">{subOf[p.id] != null ? `RM ${Math.round(subOf[p.id]).toLocaleString('en-MY')}` : '—'}</div></div>
              <span className="shrink-0 text-ink-2">→</span>
            </Link>
          );
        })}
        {list.length === 0 && <p className="text-ink-2 text-sm">Belum ada projek/lead.</p>}
      </div>
    </main>
  );
}
