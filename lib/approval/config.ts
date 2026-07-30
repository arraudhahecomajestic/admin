// Konfig borang Approval Checker — pilihan yang owner boleh jawab (bukan istilah teknikal).

export const JENIS_RUMAH_APPROVAL = [
  { key: 'teres', label: 'Teres' },
  { key: 'semid', label: 'Semi-D' },
  { key: 'banglo', label: 'Banglo' },
];

export const TINGKAT = [
  { key: 1, label: '1 tingkat' },
  { key: 2, label: '2 tingkat' },
];

export const JENIS_KERJA = [
  { key: 'ext_belakang', label: 'Tambah ruang belakang (rear extension)' },
  { key: 'ext_tepi', label: 'Tambah ruang tepi (side extension)' },
  { key: 'ext_depan', label: 'Tambah ruang depan / carporch' },
  { key: 'balkoni', label: 'Balcony / beranda' },
  { key: 'tambah_tingkat', label: 'Tambah tingkat atas' },
  { key: 'dapur', label: 'Extend / ubah dapur' },
  { key: 'pagar', label: 'Besarkan pagar / rumah sampah' },
  { key: 'lain', label: 'Lain-lain ubah suai' },
];

export const KEDUDUKAN_LOT = [
  { key: 'intermediate', label: 'Intermediate (tengah)' },
  { key: 'end', label: 'End lot / Corner (hujung)' },
];

// Kerja yang perlu ukuran (panjang × dalam → luas auto).
export const AREA_WORKS = ['ext_belakang', 'ext_tepi', 'ext_depan', 'balkoni'];

// Pengesan majlis ikut poskod — liputan Klang Valley + DBKL (KL).
// CORE (ada rules automatik): MPKj + MPSepang. Kawasan KV lain: dikesan &
// tangkap lead, tapi verdict jatuh "kena semak" sehingga rules diisi.
// Boundari poskod adalah anggaran permulaan — pasukan boleh perhalusi.
export interface CouncilHit { code: string; label: string; core: boolean }

const MPKJ = ['43000', '43100', '43200', '43300', '43500', '43650', '43700'];      // Kajang/Semenyih/Bangi/Balakong/Seri Kembangan
const SEPANG = ['43800', '43900', '43950'];                                          // Dengkil/Sepang
const ZONE: Record<string, [string, string]> = {
  '50': ['dbkl', 'Kuala Lumpur (DBKL)'], '51': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '52': ['dbkl', 'Kuala Lumpur (DBKL)'], '53': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '54': ['dbkl', 'Kuala Lumpur (DBKL)'], '55': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '56': ['dbkl', 'Kuala Lumpur (DBKL)'], '57': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '58': ['dbkl', 'Kuala Lumpur (DBKL)'], '59': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '60': ['dbkl', 'Kuala Lumpur (DBKL)'],
  '40': ['mbsa', 'Shah Alam (MBSA)'],
  '41': ['mpklang', 'Klang (MP Klang)'], '42': ['mpklang', 'Klang / Kuala Langat'],
  '46': ['mbpj', 'Petaling Jaya (MBPJ)'],
  '47': ['petaling', 'Daerah Petaling (PJ / Subang / Puchong)'],
  '48': ['mps', 'Selayang / Rawang (MPS)'],
  '62': ['putrajaya', 'Putrajaya'],
  '68': ['ampang', 'Ampang / Selayang'],
};

export function detectCouncil(poskod: string): CouncilHit {
  const p = (poskod || '').trim();
  if (p.length < 5) return { code: '', label: '', core: false };
  if (MPKJ.includes(p)) return { code: 'mpkj', label: 'Majlis Perbandaran Kajang (MPKj)', core: true };
  if (SEPANG.includes(p) || p.startsWith('63') || p.startsWith('64'))
    return { code: 'sepang', label: 'Majlis Perbandaran Sepang (MPSepang)', core: true };
  const z = ZONE[p.slice(0, 2)];
  if (z) return { code: z[0], label: z[1], core: false };
  return { code: 'lain', label: '', core: false };
}

export const YA_TAK_TAKPASTI = [
  { key: 'tak', label: 'Tidak' },
  { key: 'ya', label: 'Ya' },
  { key: 'takpasti', label: 'Tak pasti' },
];

export const HAKMILIK = [
  { key: 'individu', label: 'Individu (geran sendiri)' },
  { key: 'strata', label: 'Strata (ada JMB/management)' },
  { key: 'takpasti', label: 'Tak pasti' },
];

export const BILA_MULA = [
  { key: 'segera', label: 'Secepat mungkin' },
  { key: '1-3bulan', label: 'Dalam 1–3 bulan' },
  { key: '3-6bulan', label: 'Dalam 3–6 bulan' },
  { key: 'tinjau', label: 'Tengok-tengok dulu' },
];

export const COUNCIL_PILIHAN = [
  { key: 'mpkj', label: 'Kajang / Semenyih / Bangi (MPKj)' },
  { key: 'sepang', label: 'Sepang / Cyberjaya / KLIA (MPSepang)' },
  { key: 'lain', label: 'Kawasan lain' },
];
