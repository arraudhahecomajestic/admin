import Link from 'next/link';
import BorangApproval from '@/components/BorangApproval';
import { sbAdmin } from '@/lib/sb/admin';

export const dynamic = 'force-dynamic';

async function ambilPilihan() {
  try {
    const admin = sbAdmin();
    const [{ data: councils }, { data: types }] = await Promise.all([
      admin.from('councils').select('code, name').eq('active', true).order('created_at', { ascending: true }),
      admin.from('building_types').select('code, label').eq('active', true).order('sort', { ascending: true }),
    ]);
    const c = (councils ?? []).map((x: any) => ({ key: x.code, label: x.name }));
    if (c.length) c.push({ key: 'lain', label: 'Kawasan lain' });
    const t = (types ?? []).map((x: any) => ({ key: x.code, label: x.label }));
    return { councils: c, buildingTypes: t };
  } catch {
    return { councils: [], buildingTypes: [] };
  }
}

export const metadata = {
  title: 'Semak Kelulusan Ubah Suai Rumah — RENORUMAH',
  description: 'Sebelum anda keluar duit: semak sama ada extension / ubah suai rumah anda boleh diluluskan, anggaran kos dan tempoh. Percuma, serta-merta.',
};

export default async function ApprovalPage() {
  const { councils, buildingTypes } = await ambilPilihan();
  return (
    <main className="min-h-screen bg-soft">
      <header className="max-w-2xl mx-auto flex items-center justify-between px-5 py-4">
        <Link href="/"><img src="/renorumah-logo.png" alt="RENORUMAH" className="h-7 w-auto" /></Link>
        <a href="https://wa.me/60127717543" className="text-sm font-semibold text-ink-2 hover:text-brand">Hubungi kami</a>
      </header>

      <section className="max-w-2xl mx-auto px-5 pt-6 pb-4">
        <div className="inline-block text-[11px] font-bold tracking-widest uppercase text-brand bg-brand/10 border border-brand/20 px-3 py-1.5 rounded-full mb-4">
          Semak dulu, sebelum keluar duit
        </div>
        <h1 className="font-display font-semibold text-3xl sm:text-4xl leading-tight mb-3">
          Boleh lulus ke tak? Berapa kos? Berapa lama?
        </h1>
        <p className="text-ink-2 text-[16px] leading-relaxed">
          Jawab beberapa soalan ringkas pasal rumah anda. Kami beri indikasi awal <b>serta-merta</b> — tanpa lawatan tapak, tanpa pendaftaran.
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-5 pb-20">
        <BorangApproval councils={councils} buildingTypes={buildingTypes} />
      </section>
    </main>
  );
}
