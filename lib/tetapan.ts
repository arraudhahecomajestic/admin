import { sbAdmin } from '@/lib/sb/admin';

// Tetapan sistem (kunci-nilai) — model duit + suis ciri. Corak e-Surau.
export interface Tetapan {
  margin_pct: number;
  reserve_pct: number;
  kos_frontend: number;
  jadual_deposit: number[];
  skop_waranti: string;
  [key: string]: any;
}

export const TETAPAN_DEFAULT: Tetapan = {
  margin_pct: 12,
  reserve_pct: 1,
  kos_frontend: 3000,
  jadual_deposit: [50, 45, 5],
  skop_waranti: 'waterproofing',
  harga_report_rm: 250,
};

export async function ambilTetapan(): Promise<Tetapan> {
  try {
    const admin = sbAdmin();
    const { data } = await admin.from('tetapan_sistem').select('kunci, nilai');
    const t: Tetapan = { ...TETAPAN_DEFAULT };
    (data ?? []).forEach((r: any) => { t[r.kunci] = r.nilai; });
    return t;
  } catch {
    return { ...TETAPAN_DEFAULT };
  }
}
