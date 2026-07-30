import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { ambilTetapan } from '@/lib/tetapan';
import BorangTetapan from '@/components/BorangTetapan';

export const dynamic = 'force-dynamic';

export default async function TetapanPage() {
  const sesi = await sesiSemasa();
  if (!sesi) redirect('/masuk?next=/urus/tetapan');
  if (!sesi.master) redirect('/portal');

  const t = await ambilTetapan();

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/urus" className="text-brand text-sm font-semibold">← Command Center</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Settings</div>
      <h1 className="text-2xl font-semibold mt-1 mb-1">Model duit</h1>
      <p className="text-ink-2 text-sm mb-5">Tetapan ni pakai pada <b>semua</b> projek — bukan per-projek. Owner nampak harga bulat; ni sisi dalaman RR je.</p>
      <BorangTetapan initial={t} />
    </main>
  );
}
