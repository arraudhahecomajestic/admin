import Link from 'next/link';

export default function Landing() {
  return (
    <main className="min-h-screen">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-5 py-4">
        <img src="/renorumah-logo.png" alt="RENORUMAH" className="h-7 w-auto" />
        <div className="flex items-center gap-4">
          <Link href="/approval" className="text-sm font-semibold text-ink-2 hover:text-brand">Semak kelulusan</Link>
          <Link href="/daftar-pro" className="text-sm font-semibold text-ink-2 hover:text-brand">Sertai sebagai Pro/Hero</Link>
          <Link href="/masuk" className="text-sm font-semibold text-ink-2 hover:text-brand">Log masuk</Link>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-5 pt-16 pb-24 text-center">
        <div className="inline-block text-[11px] font-bold tracking-widest uppercase text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-full mb-6">
          Ubah suai rumah, tanpa kepeningan
        </div>
        <h1 className="font-display font-semibold text-4xl sm:text-5xl leading-tight mb-4">
          Dapatkan <span className="text-brand">sebut harga renovasi</span> dalam beberapa minit.
        </h1>
        <p className="text-ink-2 text-lg max-w-xl mx-auto mb-8">
          Isi skop kerja rumah anda — kami jana anggaran kos, uruskan kontraktor tersaring, dan jamin kualiti.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/skop" className="bg-brand hover:bg-brand-dark text-white font-semibold px-6 py-3.5 rounded-full shadow">
            Mula — dapatkan harga
          </Link>
          <Link href="/masuk" className="text-ink-2 font-semibold px-5 py-3.5 hover:text-brand">
            Saya dah ada akaun
          </Link>
        </div>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-12 text-sm text-ink-2">
          <span>✓ Harga telus</span>
          <span>✓ Kontraktor tersaring</span>
          <span>✓ Waranti kalis air 10 tahun</span>
        </div>
      </section>
    </main>
  );
}
