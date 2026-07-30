import Link from 'next/link';
import { redirect } from 'next/navigation';
import { sesiSemasa } from '@/lib/sesi';
import { sbAdmin } from '@/lib/sb/admin';
import EditProfil from '@/components/EditProfil';
import EditSenarai from '@/components/EditSenarai';

export const dynamic = 'force-dynamic';

const SUB = 'ubahsuai';

export default async function PanduanCouncil({ params }: { params: { council: string } }) {
  const sesi = await sesiSemasa();
  if (!sesi) redirect(`/masuk?next=/urus/approval/panduan/${params.council}`);
  if (!sesi.master) redirect('/portal');

  const admin = sbAdmin();
  const { data: council } = await admin.from('councils').select('*').eq('code', params.council).maybeSingle();
  if (!council) return <main className="max-w-2xl mx-auto p-8 text-ink-2">Majlis tidak dijumpai.</main>;

  const [{ data: types }, { data: profiles }, { data: settings }] = await Promise.all([
    admin.from('building_types').select('*').eq('active', true).order('sort', { ascending: true }),
    admin.from('approval_profiles').select('*').eq('council_code', params.council),
    admin.from('approval_settings').select('kunci, nilai').eq('council_code', params.council).eq('submission_type', SUB),
  ]);

  const profByKey: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profByKey[`${p.house_type}-${p.storeys}`] = p; });
  const setOf = (k: string) => {
    const row = (settings ?? []).find((s: any) => s.kunci === k);
    return Array.isArray(row?.nilai) ? row!.nilai : [];
  };

  return (
    <main className="max-w-2xl mx-auto p-5 pb-24">
      <Link href="/urus/approval/panduan" className="text-brand text-sm font-semibold">← Semua majlis</Link>
      <div className="text-brand font-bold tracking-widest text-xs uppercase mt-3">RENORUMAH · Library · Ubah Suai</div>
      <h1 className="text-2xl font-semibold mt-1 mb-1">{council.name}</h1>
      <p className="text-ink-2 text-sm mb-6">Isi peraturan setiap jenis rumah, dan kos/timeline/dokumen untuk jenis permohonan <b>Ubah Suai</b>. Kosongkan yang belum tahu — engine anggap "kena semak" (KUNING).</p>

      {/* PERATURAN */}
      <section className="mb-8">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">1 · Peraturan (→ verdict)</div>
        <div className="space-y-3">
          {(types ?? []).map((t: any) => (
            [1, 2].map((s) => {
              const row = profByKey[`${t.code}-${s}`];
              if (!row) return null;
              return <EditProfil key={row.id} row={row} label={`${t.label} — ${s} tingkat`} />;
            })
          ))}
        </div>
      </section>

      {/* KOS */}
      <section className="mb-6">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">2 · Kos sebenar (sebelum markup RR)</div>
        <EditSenarai councilCode={params.council} submissionType={SUB} kunci="yuran" tajuk="Yuran & kos"
          initial={setOf('yuran')}
          kolum={[
            { key: 'item', label: 'Item kos', width: '2fr' },
            { key: 'amaun', label: 'RM', type: 'number', width: '0.8fr' },
            { key: 'bila', label: 'Bila bayar', width: '1.3fr' },
            { key: 'refund', label: 'Refund?', width: '0.8fr' },
          ]} />
      </section>

      {/* TIMELINE */}
      <section className="mb-6">
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">3 · Timeline</div>
        <EditSenarai councilCode={params.council} submissionType={SUB} kunci="timeline" tajuk="Peringkat & tempoh"
          initial={setOf('timeline')}
          kolum={[
            { key: 'peringkat', label: 'Peringkat', width: '2fr' },
            { key: 'min', label: 'Min hari', type: 'number', width: '1fr' },
            { key: 'max', label: 'Max hari', type: 'number', width: '1fr' },
          ]} />
      </section>

      {/* DOKUMEN */}
      <section>
        <div className="text-[11px] uppercase tracking-wide text-ink-2 font-bold mb-2">4 · Dokumen</div>
        <EditSenarai councilCode={params.council} submissionType={SUB} kunci="dokumen" tajuk="Senarai dokumen"
          initial={setOf('dokumen')}
          kolum={[
            { key: 'nama', label: 'Dokumen', width: '2fr' },
            { key: 'wajib', label: 'Wajib / Optional', width: '1.2fr' },
          ]} />
      </section>
    </main>
  );
}
