import Link from 'next/link';
import BorangReset from '@/components/BorangReset';

export const dynamic = 'force-dynamic';

export default function ResetPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center mb-3">
          <img src="/renorumah-logo.png" alt="RENORUMAH" className="h-8 w-auto inline-block" />
        </Link>
        <p className="text-center text-ink-2 text-sm mb-6">Tetapkan kata laluan baru anda</p>
        <BorangReset />
      </div>
    </main>
  );
}
