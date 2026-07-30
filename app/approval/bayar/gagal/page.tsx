import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default function Gagal() {
  return (
    <main className="min-h-screen bg-soft flex items-center justify-center p-5">
      <div className="w-full max-w-md text-center">
        <Link href="/"><img src="/renorumah-logo.png" alt="RENORUMAH" className="h-7 w-auto inline-block mb-6" /></Link>
        <div className="bg-white rounded-2xl p-7 shadow-sm">
          <div className="text-3xl mb-2">✕</div>
          <h1 className="text-2xl font-semibold mb-2">Bayaran tidak selesai</h1>
          <p className="text-ink-2 text-[15px] leading-relaxed">
            Bayaran anda tidak berjaya atau dibatalkan. Tiada apa-apa dicaj. Anda boleh cuba semula, atau hubungi kami di <a href="https://wa.me/60127717543" className="text-brand font-semibold">012-771 7543</a>.
          </p>
        </div>
        <Link href="/approval" className="inline-block bg-brand hover:bg-brand-dark text-white text-sm font-semibold px-6 py-3 rounded-full mt-5">Cuba semula</Link>
      </div>
    </main>
  );
}
