// Senarai kerja skop (MVP). scope_code hubungkan borang ↔ catalog_items (rate).
export interface KerjaDef {
  scope_code: string;
  label: string;
  kategori: string;
  asas: 'built_up' | 'bilik_air' | 'fixed'; // asas kira kuantiti
  faktor: number;                            // qty = built_up*f | bilik_air*f | f (fixed)
}

export const KERJA: KerjaDef[] = [
  { scope_code: 'elektrik.rewire',        label: 'Full rewiring + tukar DB box', kategori: 'Elektrik',      asas: 'built_up',  faktor: 1 },
  { scope_code: 'plumbing.full',          label: 'Tukar paip (seluruh rumah)',   kategori: 'Plumbing',      asas: 'built_up',  faktor: 1 },
  { scope_code: 'cat.penuh',              label: 'Cat dalam & luar',             kategori: 'Cat',           asas: 'built_up',  faktor: 1.8 },
  { scope_code: 'lantai.tukar',           label: 'Tukar lantai (jubin/vinyl)',   kategori: 'Lantai',        asas: 'built_up',  faktor: 1 },
  { scope_code: 'siling.plaster',         label: 'Plaster ceiling + cornice',    kategori: 'Siling',        asas: 'built_up',  faktor: 0.6 },
  { scope_code: 'bilikair.ubahsuai',      label: 'Ubah suai bilik air penuh',    kategori: 'Bilik air',     asas: 'bilik_air', faktor: 1 },
  { scope_code: 'waterproofing.bilikair', label: 'Waterproofing bilik air',      kategori: 'Waterproofing', asas: 'bilik_air', faktor: 1 },
  { scope_code: 'dapur.kabinet',          label: 'Kabinet dapur (atas & bawah)', kategori: 'Dapur',         asas: 'fixed',     faktor: 1 },
  { scope_code: 'grille.pintu',           label: 'Grille tingkap / pintu',       kategori: 'Kelengkapan',   asas: 'fixed',     faktor: 1 },
];

export const JENIS_RUMAH = ['Teres', 'Semi-D', 'Banglo', 'Kondo', 'Apartment', 'Flat / Kos rendah'];
