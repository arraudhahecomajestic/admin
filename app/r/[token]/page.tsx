import { sbAdmin } from '@/lib/sb/admin';
import { VERDICT_META, type Verdict } from '@/lib/approval/engine';
import CetakBtn from '@/components/CetakBtn';

export const dynamic = 'force-dynamic';

const HOUSE: Record<string, string> = { teres: 'Teres', semid: 'Semi-D', banglo: 'Banglo' };
const COUNCIL: Record<string, string> = {
  mpkj: 'Majlis Perbandaran Kajang (MPKj)', sepang: 'Majlis Perbandaran Sepang', dbkl: 'Kuala Lumpur (DBKL)',
  mbpj: 'Petaling Jaya (MBPJ)', mbsa: 'Shah Alam (MBSA)', mpklang: 'Klang', petaling: 'Daerah Petaling',
  mps: 'Selayang', ampang: 'Ampang', putrajaya: 'Putrajaya',
};

export default async function PublicReport({ params }: { params: { token: string } }) {
  const admin = sbAdmin();
  const { data: rep } = await admin.from('approval_reports').select('*').eq('token', params.token).eq('status', 'issued').maybeSingle();
  if (!rep) return <main className="min-h-screen flex items-center justify-center p-8 text-ink-2">Laporan tidak dijumpai.</main>;

  const [{ data: c }, { data: areas }] = await Promise.all([
    admin.from('approval_cases').select('*').eq('id', rep.case_id).maybeSingle(),
    admin.from('approval_report_areas').select('*').eq('report_id', rep.id).order('sort', { ascending: true }),
  ]);
  const { data: settings } = await admin.from('approval_settings')
    .select('kunci, nilai').eq('council_code', c?.council_code || '').eq('submission_type', 'ubahsuai');
  const setOf = (k: string) => { const r = (settings ?? []).find((s: any) => s.kunci === k); return Array.isArray(r?.nilai) ? r!.nilai : []; };
  const timeline = setOf('timeline');
  const dokumen = setOf('dokumen');

  const m = VERDICT_META[(rep.verdict as Verdict) ?? 'amber'];
  const ct = c?.contact ?? {};
  const ref = `RR-${String(rep.case_id).padStart(4, '0')}`;
  const tarikh = (rep.issued_at || rep.created_at || '').slice(0, 10);
  const isu: any[] = Array.isArray(rep.isu_kritikal) ? rep.isu_kritikal : [];

  const H = ({ children }: { children: any }) => (
    <div className="bg-[#1A1A2E] text-white text-[13px] font-bold px-4 py-2.5 rounded-lg mt-8 mb-4">{children}</div>
  );

  return (
    <main className="bg-[#f2efec] min-h-screen py-6 px-4 print:bg-white print:p-0">
      <style>{`@media print{.no-print{display:none!important}.sheet{box-shadow:none!important;margin:0!important;border-radius:0!important}}`}</style>
      <div className="max-w-3xl mx-auto flex justify-end mb-3 no-print"><CetakBtn /></div>

      <div className="sheet max-w-3xl mx-auto bg-white rounded-2xl shadow-sm p-7 sm:p-10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-2">
            <img src="/renorumah-mark.png" alt="" className="h-8 w-8" />
            <div>
              <div className="font-bold text-[15px]">RENORUMAH SDN BHD</div>
              <div className="text-[11px] text-ink-2">SSM: 202301005235 (1499154-X)</div>
            </div>
          </div>
          <div className="text-right text-[11px] text-ink-2">admin@renorumah.com<br />012-771 7543</div>
        </div>

        {/* Tajuk */}
        <div className="text-center mt-8 mb-6">
          <div className="font-display text-3xl font-semibold">Laporan Feasibility</div>
          <div className="text-brand font-semibold tracking-wide text-sm mt-1">RENOVATION FEASIBILITY REPORT</div>
        </div>

        {/* Info */}
        <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-[13.5px] border border-line rounded-xl p-4">
          <Row k="No. Laporan" v={ref} />
          <Row k="Tarikh" v={tarikh} />
          <Row k="Klien" v={ct.nama || '—'} />
          <Row k="Telefon" v={ct.telefon || '—'} />
          <Row k="Jenis rumah" v={[HOUSE[c?.house_type] || c?.house_type, c?.storeys ? `${c?.storeys} tingkat` : null].filter(Boolean).join(' · ')} />
          <Row k="Pihak Berkuasa" v={COUNCIL[c?.council_code] || c?.council_code || '—'} />
        </div>

        {/* Verdict */}
        <div className="rounded-2xl p-6 border-2 mt-6" style={{ backgroundColor: m.bg, borderColor: m.ring }}>
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: m.color }}>Keputusan</div>
          <div className="text-3xl font-bold mt-1" style={{ color: m.color }}>{m.label}</div>
          <div className="text-[15px] mt-1" style={{ color: m.color }}>{m.tag}</div>
        </div>

        {rep.ringkasan && <p className="text-[14.5px] leading-relaxed text-ink mt-5 whitespace-pre-line">{rep.ringkasan}</p>}

        {/* Area-by-area */}
        {(areas ?? []).length > 0 && (
          <>
            <H>Penemuan Tapak</H>
            <div className="space-y-6">
              {(areas ?? []).map((a: any, i: number) => (
                <div key={a.id}>
                  <div className="font-semibold text-[15px] mb-2">{i + 1}. {a.title || 'Area'}</div>
                  {Array.isArray(a.photos) && a.photos.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {a.photos.map((u: string) => <img key={u} src={u} alt="" className="w-full h-40 object-cover rounded-lg border border-line" />)}
                    </div>
                  )}
                  {a.finding && <p className="text-[14px] leading-relaxed text-ink">{a.finding}</p>}
                  {a.action && <p className="text-[13.5px] leading-relaxed text-brand-dark font-medium mt-1">→ {a.action}</p>}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Isu kritikal */}
        {isu.length > 0 && (
          <>
            <H>Isu Kritikal</H>
            <div className="space-y-2">
              {isu.map((x: any, i: number) => (
                <div key={i} className="flex gap-2.5 bg-[#fdeeec] border border-[#f3c9c7] rounded-xl p-3">
                  <span className="text-brand font-bold">⚠</span>
                  <span className="text-[13.5px] text-ink leading-snug">{x.text ?? x}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Timeline */}
        {timeline.length > 0 && (
          <>
            <H>Anggaran Timeline</H>
            <table className="w-full text-[13.5px] border border-line rounded-lg overflow-hidden">
              <tbody>
                {timeline.map((t: any, i: number) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="p-2.5">{t.peringkat}</td>
                    <td className="p-2.5 text-right text-ink-2 whitespace-nowrap">{[t.min, t.max].filter(Boolean).join('–')} hari</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Dokumen */}
        {dokumen.length > 0 && (
          <>
            <H>Dokumen Diperlukan</H>
            <ul className="space-y-1.5">
              {dokumen.map((d: any, i: number) => (
                <li key={i} className="text-[13.5px] flex gap-2"><span className="text-brand">•</span>{d.nama}{d.wajib ? <span className="text-ink-2 text-[12px]">({d.wajib})</span> : null}</li>
              ))}
            </ul>
          </>
        )}

        {/* Deposit note */}
        <div className="bg-soft rounded-xl p-4 mt-8 text-[13px] text-ink-2 leading-relaxed">
          Deposit RM250 anda dikreditkan penuh ke yuran submission jika anda teruskan dengan RENORUMAH. Laporan ini adalah penilaian awal profesional; angka muktamad tertakluk pada pelan dan dokumen lengkap.
        </div>

        {/* Footer */}
        <div className="border-t border-line mt-8 pt-4 text-[11px] text-ink-2 flex justify-between">
          <span>RENORUMAH · Laporan Feasibility · {ref}</span>
          <span>SULIT — untuk kegunaan klien</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center mt-4 no-print">
        <a href="https://wa.me/60127717543" className="text-ink-2 text-sm font-semibold hover:text-brand">Ada soalan? Hubungi kami — 012-771 7543</a>
      </div>
    </main>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between gap-3 border-b border-line/60 pb-1"><span className="text-ink-2">{k}</span><span className="font-medium text-right">{v}</span></div>;
}
