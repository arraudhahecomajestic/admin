import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sbServer } from '@/lib/sb/server';
import { sbAdmin } from '@/lib/sb/admin';
import BorangPro from '@/components/BorangPro';

export const dynamic = 'force-dynamic';

const ST: Record<string, { label: string; cls: string }> = {
  approved: { label: '✓ Profil anda telah diluluskan — anda dalam roster RENORUMAH.', cls: 'bg-[#e9f7ee] text-[#146c37] border-[#bfe6cd]' },
  pending:  { label: '● Profil dihantar — menunggu semakan RENORUMAH.',              cls: 'bg-[#fdf3e2] text-[#8a5a00] border-[#f0d9a8]' },
  rejected: { label: '✕ Profil belum diluluskan. Kemas kini & hantar semula.',        cls: 'bg-[#fdeeec] text-[#C21F1C] border-[#f3c9c7]' },
};

export default async function DaftarProPage() {
  const sb = sbServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect('/masuk?next=/daftar-pro');

  const admin = sbAdmin();
  const { data: existing } = await admin.from('provider_profiles').select('*').eq('id', user.id).maybeSingle();
  const st = existing?.status ? ST[existing.status] : null;

  return (
    <main className="max-w-xl mx-auto p-5 pb-24">
      <Link href="/" className="text-brand text-sm font-semibold">← Utama</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Sertai kami</div>
      <h1 className="text-2xl font-semibold mt-1 mb-1">Daftar sebagai Pro / Hero</h1>
      <p className="text-ink-2 text-sm mb-5">Kontraktor syarikat (Pro) atau tukang individu (Hero) — daftar sekali, dapat kerja bila projek padan bidang & kawasan anda.</p>

      {st && <div className={`text-[13px] font-semibold border rounded-xl px-4 py-3 mb-4 ${st.cls}`}>{st.label}</div>}

      <BorangPro initial={existing ?? {}} email={user.email ?? ''} />
    </main>
  );
}
