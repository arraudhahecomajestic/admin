// Engine verdict Approval Checker — deterministik.
// Falsafah (dari brief): AMBER outcome paling biasa by design. Sebab boleh
// datang dari jawapan owner sendiri walaupun library peraturan belum diisi;
// bila profil majlis diisi, dia tambah tajam (boleh naik GREEN).

export type Verdict = 'green' | 'amber' | 'red';

export interface Reason { level: Verdict; text: string; }

export interface ApprovalAnswers {
  council_code: string;      // mpkj | sepang | lain
  house_type: string;        // teres | semid | banglo
  storeys: number;           // 1 | 2
  lot_position?: string;     // intermediate | end
  work_types: string[];      // boleh lebih satu skop
  work_details?: any;        // ukuran per-kerja (L×D, 2 tingkat)
  poskod?: string;
  size_ft?: number | null;
  unapproved: string;        // ya | tak | takpasti
  touches_boundary: string;  // ya | tak | takpasti
  ownership: string;         // individu | strata | takpasti
  start_when?: string;
}

export interface ApprovalProfile {
  setback_rear_ft: number | null;
  setback_side_ft: number | null;
  setback_front_ft: number | null;
  max_coverage_pct: number | null;
  needs_pe_double: boolean | null;
  neighbour_consent_required: boolean | null;
  notes: string | null;
}

export interface ApprovalResult {
  verdict: Verdict;
  reasons: Reason[];
  serviced: boolean; // majlis dalam liputan kita?
}

const RANK: Record<Verdict, number> = { green: 0, amber: 1, red: 2 };
const worst = (a: Verdict, b: Verdict): Verdict => (RANK[a] >= RANK[b] ? a : b);

export function nilaiApproval(a: ApprovalAnswers, profile: ApprovalProfile | null): ApprovalResult {
  const reasons: Reason[] = [];
  let verdict: Verdict = 'green';
  const push = (level: Verdict, text: string) => { reasons.push({ level, text }); verdict = worst(verdict, level); };

  // Diliputi = mana-mana majlis yang wujud dalam library (bukan "lain").
  const serviced = !!a.council_code && a.council_code !== 'lain';

  // Luar liputan — kita belum boleh beri panduan tepat.
  if (!serviced) {
    return {
      verdict: 'amber',
      serviced: false,
      reasons: [{
        level: 'amber',
        text: 'Buat masa ni kami hanya liputi kawasan MPKj (Kajang/Semenyih/Bangi) dan MPSepang. Untuk kawasan lain, pasukan kami boleh semak secara manual.',
      }],
    };
  }

  // Faktor 2 — hakmilik strata: biasanya TAK BOLEH extension / ubah facade → MERAH.
  if (a.ownership === 'strata') {
    push('red', 'Rumah strata biasanya tidak dibenarkan membuat extension atau mengubah facade rumah. Ada laluan lain yang mungkin boleh — pasukan kami boleh cadangkan alternatif dalam laporan.');
  } else if (a.ownership === 'takpasti') {
    push('amber', 'Jenis hakmilik belum pasti. Rumah strata biasanya tidak dibenarkan extension — ini perlu disahkan dahulu.');
  }

  const works = Array.isArray(a.work_types) ? a.work_types : [];

  // Kedudukan lot — rumah intermediate tiada ruang tepi untuk extension.
  if (works.includes('ext_tepi') && a.lot_position === 'intermediate') {
    push('red', 'Rumah intermediate (tengah) tiada ruang tepi untuk extension — hanya lot corner / end boleh ke tepi. Kerja belakang / atas mungkin masih boleh; kami boleh cadangkan alternatif.');
  }

  // Balcony teres 2 tingkat — perlu kebenaran jiran kiri & kanan.
  if (works.includes('balkoni') && a.house_type === 'teres' && a.storeys === 2) {
    push('amber', 'Balcony untuk teres 2 tingkat memerlukan surat kebenaran jiran KIRI & KANAN sebelum boleh diluluskan.');
  }

  // Faktor 5 — struktur sedia ada tanpa kelulusan (paling kritikal).
  if (a.unapproved === 'ya') {
    push('amber', 'Ada struktur yang sedia dibina tanpa kelulusan. Ini jadi kes "regularisation" — dan jika majlis mengeluarkan saman, penalti boleh mencecah 10–20 kali ganda yuran majlis. Lebih selamat diuruskan betul dari awal.');
  } else if (a.unapproved === 'takpasti') {
    push('amber', 'Anda tak pasti sama ada ada struktur tanpa kelulusan. Ini perlu disahkan dulu kerana ia boleh ubah keseluruhan laluan permohonan.');
  }

  // Faktor 7 — sentuh sempadan jiran.
  if (a.touches_boundary === 'ya') {
    const need = profile?.neighbour_consent_required;
    if (need === false) {
      push('amber', 'Kerja anda menyentuh sempadan jiran. Perlu pastikan jarak dan susun atur mematuhi syarat majlis.');
    } else {
      push('amber', 'Kerja anda menyentuh sempadan jiran — biasanya memerlukan kebenaran jiran bersebelahan dan mematuhi jarak minimum. Perlu disemak.');
    }
  } else if (a.touches_boundary === 'takpasti') {
    push('amber', 'Anda tak pasti sama ada kerja menyentuh sempadan jiran. Jarak sempadan adalah punca penolakan paling biasa — perlu disemak.');
  }

  // Faktor 6 — double storey / tambah tingkat perlu jurutera.
  if (a.storeys === 2 || works.includes('tambah_tingkat')) {
    if (profile?.needs_pe_double) {
      push('amber', 'Kerja 2 tingkat / tambah tingkat memerlukan pengesahan Jurutera Profesional (PE) — ada kos dan langkah tambahan.');
    } else if (profile?.needs_pe_double === null || profile?.needs_pe_double === undefined) {
      push('amber', 'Kerja 2 tingkat / tambah tingkat mungkin memerlukan pengesahan jurutera. Perlu disemak mengikut syarat majlis.');
    }
  }

  // Faktor 1 & 4 — setback / coverage. Bergantung data profil.
  const adaDataProfil = profile && (
    profile.setback_rear_ft != null || profile.setback_side_ft != null || profile.max_coverage_pct != null
  );
  if (!adaDataProfil) {
    push('amber', 'Jarak sempadan (setback) dan had liputan tapak untuk jenis rumah anda di majlis ini masih perlu disemak oleh pasukan kami untuk pengesahan tepat.');
  } else {
    reasons.push({
      level: 'green',
      text: 'Parameter asas jenis rumah anda ada dalam rujukan majlis kami — pengesahan penuh dibuat dalam laporan.',
    });
  }

  // Kalau tiada apa-apa flag AMBER pun (jarang), kekal indikasi positif.
  if (verdict === 'green' && reasons.length === 0) {
    reasons.push({ level: 'green', text: 'Tiada isu ketara dikesan dari maklumat awal. Pengesahan penuh dalam laporan feasibility.' });
  }

  return { verdict, reasons, serviced: true };
}

export const VERDICT_META: Record<Verdict, { label: string; tag: string; color: string; bg: string; ring: string }> = {
  green: { label: 'HIJAU', tag: 'Nampak berkemungkinan diluluskan', color: '#146c37', bg: '#e9f7ee', ring: '#bfe6cd' },
  amber: { label: 'KUNING', tag: 'Boleh diluluskan, tetapi perlu semakan pakar', color: '#8a5a00', bg: '#fdf3e2', ring: '#f0d9a8' },
  red:   { label: 'MERAH', tag: 'Kurang berkemungkinan seperti yang digambarkan', color: '#C21F1C', bg: '#fdeeec', ring: '#f3c9c7' },
};
