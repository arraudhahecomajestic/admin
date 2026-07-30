import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import TambahBaris from '@/components/TambahBaris';

export const dynamic = 'force-dynamic';

export default async function PanduanPage() {
  const sesi = await sesiSemasa();
  if (!sesi) redirect('/masuk?next=/urus/approval/panduan');
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const [{ data: councils }, { data: types }, { data: subs }] = await Promise.all([
    admin.from('councils').select('*').order('created_at', { ascending: true }),
    admin.from('building_types').select('*').order('sort', { ascending: true }),
    admin.from('submission_types').select('*').order('sort', { ascending: true }),
  ]);

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/urus/approval" className="text-brand text-sm font-semibold">← Approval leads</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Library</div>
      <h1 className="text-2xl font-semibold mt-1 mb-1">Panduan majlis</h1>
      <p className="text-ink-2 text-sm mb-6">Isi peraturan, kos, timeline & dokumen di sini — free check dan report tarik dari sumber yang sama. Tiada developer diperlukan.</p>

      {/* MAJLIS */}
      <section className="mb-8">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Majlis ({councils?.length ?? 0})</div>
        <div className="space-y-2">
          {(councils ?? []).map((c: any) => (
            <Link key={c.code} href={`/urus/approval/panduan/${c.code}`}
              className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="font-semibold">{c.name}</div>
                <div className="text-ink-2 text-[12px] uppercase tracking-wide">{c.code}</div>
              </div>
              <span className="text-ink-2">→ Isi</span>
            </Link>
          ))}
        </div>
        <div className="mt-3"><TambahBaris mode="majlis" /></div>
      </section>

      {/* JENIS BANGUNAN */}
      <section className="mb-8">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Jenis bangunan ({types?.length ?? 0})</div>
        <div className="flex flex-wrap gap-2">
          {(types ?? []).map((t: any) => (
            <span key={t.code} className={`text-[13px] font-medium px-3 py-2 rounded-full border ${
              t.category === 'komersial' ? 'bg-[#e8e8f0] border-[#c9c9dd] text-[#1A1A2E]' : 'bg-soft border-line text-ink'}`}>
              {t.label} <span className="text-ink-2 text-[11px]">· {t.category}</span>
            </span>
          ))}
        </div>
        <div className="mt-3"><TambahBaris mode="jenis" /></div>
      </section>

      {/* JENIS PERMOHONAN */}
      <section>
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">Jenis permohonan</div>
        <div className="space-y-2">
          {(subs ?? []).map((s: any) => (
            <div key={s.code} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="font-semibold">{s.label}</div>
              {s.notes && <div className="text-ink-2 text-[12.5px] mt-0.5">{s.notes}</div>}
            </div>
          ))}
          <div className="bg-soft border border-dashed border-line rounded-2xl p-4">
            <div className="font-semibold text-ink-2">Roboh & Bina Baru <span className="text-[11px] font-normal">(future)</span></div>
            <div className="text-ink-2 text-[12.5px] mt-0.5">Kebenaran Merancang + Pelan Bangunan (Arkitek) + C&S + M&E. Rangka dah sedia — hidupkan bila ready.</div>
          </div>
        </div>
      </section>
    </main>
  );
}
