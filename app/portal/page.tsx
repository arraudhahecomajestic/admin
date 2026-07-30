import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';
import { sbAdmin } from '@/lib/sb/admin';
import { isMasterEmail } from '@/lib/sesi';
import { logKeluar } from '@/app/actions/auth';

export const dynamic = 'force-dynamic';

export default async function PortalPage() {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/masuk?next=/portal');
  if (isMasterEmail(user.email)) redirect('/urus');   // master → Command Center

  const admin = sbAdmin();
  const { data: projects } = await admin.from('projects')
    .select('id, title, status, property_type, built_up, created_at')
    .eq('owner_id', user.id).order('created_at', { ascending: false });
  const list = projects ?? [];
  const ids = list.map((p: any) => p.id);
  const subOf: Record<string, number> = {};
  if (ids.length) {
    const { data: bqs } = await admin.from('project_bq').select('project_id, subtotal').in('project_id', ids);
    (bqs ?? []).forEach((b: any) => { subOf[b.project_id] = Number(b.subtotal) || 0; });
  }

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-display font-bold text-lg">RENO<span className="text-brand">RUMAH</span></div>
          <h1 className="text-2xl font-semibold mt-0.5">Projek saya</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/skop" className="bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-4 py-2.5 rounded-full">+ Projek</Link>
          <form action={logKeluar}><button className="text-ink-2 text-sm hover:text-brand">Log keluar</button></form>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <p className="text-ink-2 mb-4">Belum ada projek.</p>
          <Link href="/skop" className="text-brand font-semibold">Mula projek pertama →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map((p: any) => (
            <Link key={p.id} href={`/portal/${p.id}`} className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold truncate">{p.title}</div>
                  <div className="text-ink-2 text-[13px]">{[p.property_type, p.built_up ? `${p.built_up} sqft` : null].filter(Boolean).join(' · ')}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-semibold">{subOf[p.id] != null ? `RM ${Math.round(subOf[p.id]).toLocaleString('en-MY')}` : '—'}</div>
                  <div className="text-ink-2 text-[11px]">anggaran</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
