import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';
import BorangMasuk from '@/components/BorangMasuk';

export default async function MasukPage() {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (user) redirect('/portal');

  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-3">
          <img src="/renorumah-logo.png" alt="RENORUMAH" className="h-8 w-auto inline-block" />
        </Link>
        <p className="text-center text-ink-2 text-sm mb-6">Log masuk atau daftar untuk teruskan</p>
        <BorangMasuk />
      </div>
    </main>
  );
}
