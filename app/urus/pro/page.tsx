import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import BarisPro from '@/components/BarisPro';

export const dynamic = 'force-dynamic';

export default async function UrusProPage() {
  const sesi = await sesiSemasa();
  if (!sesi) redirect('/masuk?next=/urus/pro');
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const { data: rows } = await admin.from('provider_profiles')
    .select('*').order('created_at', { ascending: false }).limit(200);
  const list = rows ?? [];
  const pending = list.filter((p: any) => p.status === 'pending');
  const rest = list.filter((p: any) => p.status !== 'pending');

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/urus" className="text-brand text-sm font-semibold">← Command Center</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Roster Pro/Hero</div>
      <h1 className="text-2xl font-semibold mt-1 mb-5">Pendaftaran kontraktor ({list.length})</h1>

      {pending.length > 0 && (
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Menunggu kelulusan ({pending.length})</div>
          <div className="space-y-3">{pending.map((p: any) => <BarisPro key={p.id} p={p} />)}</div>
        </div>
      )}

      {rest.length > 0 && (
        <div>
          <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Diproses</div>
          <div className="space-y-3">{rest.map((p: any) => <BarisPro key={p.id} p={p} />)}</div>
        </div>
      )}

      {list.length === 0 && <p className="text-ink-2 text-sm">Belum ada pendaftaran Pro/Hero.</p>}
    </main>
  );
}
