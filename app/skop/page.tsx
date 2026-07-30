import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';
import BorangSkop from '@/components/BorangSkop';

export default async function SkopPage() {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/masuk?next=/skop');

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/portal" className="text-brand text-sm font-semibold">← Projek saya</Link>
      <h1 className="font-display text-2xl font-semibold mt-2 mb-1">Skop kerja</h1>
      <p className="text-ink-2 text-sm mb-6">Isi maklumat rumah & kerja — kami jana anggaran kos.</p>
      <BorangSkop />
    </main>
  );
}
