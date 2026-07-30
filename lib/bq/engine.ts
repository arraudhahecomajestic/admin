import type { KerjaDef } from './config';

export interface CatalogRow {
  scope_code: string;
  description: string;
  unit: string | null;
  default_rate: number;
}

export interface ItemBQ {
  scope_code: string;
  description: string;
  qty: number;
  unit: string | null;
  rate: number;
  amount: number;
  kategori: string;
}

export interface BQ {
  items: ItemBQ[];
  subtotal: number;
}

const round2 = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

// Deterministik: qty dari dimensi borang × faktor, rate dari catalog_items.
// (Lapisan AI estimate qty = Fasa 2.)
export function binaBQ(
  dipilih: string[],
  dims: { built_up: number; bilik_air: number },
  catalog: CatalogRow[],
  kerjaDef: KerjaDef[],
): BQ {
  const byCode: Record<string, CatalogRow> = {};
  catalog.forEach((c) => { byCode[c.scope_code] = c; });

  const items: ItemBQ[] = [];
  for (const code of dipilih) {
    const def = kerjaDef.find((k) => k.scope_code === code);
    const cat = byCode[code];
    if (!def || !cat) continue;

    let qty: number;
    if (def.asas === 'built_up') qty = round2((dims.built_up || 0) * def.faktor);
    else if (def.asas === 'bilik_air') qty = round2((dims.bilik_air || 0) * def.faktor);
    else qty = def.faktor; // fixed (lumpsum)

    const rate = Number(cat.default_rate) || 0;
    items.push({
      scope_code: code,
      description: cat.description || def.label,
      qty,
      unit: cat.unit,
      rate,
      amount: round2(qty * rate),
      kategori: def.kategori,
    });
  }

  const subtotal = round2(items.reduce((s, i) => s + i.amount, 0));
  return { items, subtotal };
}
