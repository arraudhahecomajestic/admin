import Link from 'next/link';
import { verifyPayment } from '@/app/actions/approval';

export const dynamic = 'force-dynamic';

export default async function Selesai({ searchParams }: { searchParams: { case?: string } }) {
  const caseId = Number(searchParams.case);
  let paid = false;
  if (caseId) {
    const r = await verifyPayment(caseId);
    paid = r.paid;
  }

  return (
    <main className="min-h-screen bg-soft flex items-center justify-center p-5">
      <div className="w-full max-w-md text-center">
        <Link href="/"><img src="/renorumah-logo.png" alt="RENORUMAH" className="h-7 w-auto inline-block mb-6" /></Link>

        {paid ? (
          <div className="bg-white rounded-2xl p-7 shadow-sm">
            <div className="text-4xl mb-2">✓</div>
            <h1 className="text-2xl font-semibold mb-2">Bayaran berjaya</h1>
            <p className="text-ink-2 text-[15px] leading-relaxed">
              Terima kasih! Deposit RM250 anda diterima. Pasukan RENORUMAH akan hubungi anda untuk langkah seterusnya — muat naik dokumen (geran, pelan, gambar). Laporan Feasibility anda siap dalam 48 jam selepas dokumen lengkap.
            </p>
            <div className="text-[12.5px] text-ink-2 bg-soft rounded-xl p-3 mt-4">RM250 ini dikreditkan penuh ke yuran submission jika anda teruskan.</div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-7 shadow-sm">
            <div className="text-3xl mb-2">⏳</div>
            <h1 className="text-2xl font-semibold mb-2">Mengesahkan bayaran…</h1>
            <p className="text-ink-2 text-[15px] leading-relaxed">
              Bayaran anda sedang disahkan. Kalau anda sudah bayar, ia akan dikemas kini sebentar lagi — kami akan hubungi anda. Kalau ada masalah, hubungi kami di <a href="https://wa.me/60127717543" className="text-brand font-semibold">012-771 7543</a>.
            </p>
          </div>
        )}

        <Link href="/approval" className="inline-block text-ink-2 text-sm font-semibold mt-5 hover:text-brand">← Kembali</Link>
      </div>
    </main>
  );
}
