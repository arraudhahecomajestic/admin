import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';
import { sbAdmin } from '@/lib/sb/admin';

export default async function PortalProjek({ params }: { params: { id: string } }) {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/masuk?next=/portal/${params.id}`);

  const admin = sbAdmin();
  const { data: p } = await admin.from('projects')
    .select('id, title, property_type, built_up, owner_id, status').eq('id', params.id).maybeSingle();
  if (!p || p.owner_id !== user.id) {
    return <main className="max-w-2xl mx-auto p-8 text-ink-2 text-sm">Projek tidak dijumpai.</main>;
  }
  const { data: row } = await admin.from('project_bq').select('bq, subtotal').eq('project_id', params.id).maybeSingle();
  const bq = (row?.bq ?? null) as { items: any[]; subtotal: number } | null;

  const byCat: Record<string, number> = {};
  (bq?.items ?? []).forEach((it: any) => { byCat[it.kategori ?? 'Lain-lain'] = (byCat[it.kategori ?? 'Lain-lain'] ?? 0) + (Number(it.amount) || 0); });
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/portal" className="text-brand text-sm font-semibold">← Projek saya</Link>
      <h1 className="font-display text-2xl font-semibold mt-2 mb-1">{p.title}</h1>
      <p className="text-ink-2 text-sm mb-6">{[p.property_type, p.built_up ? `${p.built_up} sqft` : null].filter(Boolean).join(' · ')}</p>

      {!bq ? (
        <div className="bg-white rounded-2xl p-6 text-center text-ink-2 shadow-sm">Sebut harga sedang dijana…</div>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="text-sm text-ink-2 mb-3">Anggaran ikut kategori</div>
          <div className="divide-y divide-line">
            {rows.map(([cat, amt]) => {
              const lo = Math.round((amt * 0.9) / 100) * 100;
              const hi = Math.round((amt * 1.15) / 100) * 100;
              return (
                <div key={cat} className="flex justify-between py-2.5 text-sm">
                  <span>{cat}</span>
                  <span className="text-ink-2">RM {lo.toLocaleString('en-MY')} – {hi.toLocaleString('en-MY')}</span>
                </div>
              );
            })}
          </div>
          <div className="border-t border-line mt-3 pt-3 flex justify-between font-bold">
            <span>Anggaran keseluruhan</span>
            <span>RM {Math.round(bq.subtotal).toLocaleString('en-MY')}</span>
          </div>
          <p className="text-xs text-ink-2 mt-3">Harga tepat disahkan selepas site visit.</p>
        </div>
      )}
    </main>
  );
}
