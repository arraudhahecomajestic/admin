import type { Tetapan } from './tetapan';

// Kira P&L dalaman RR dari harga owner + tetapan (model % — Fasa 2).
// (Margin dijumpai pasaran via bidding = Fasa 3.)
export interface PnL {
  ownerPrice: number;
  margin: number;
  contractor: number;
  reserve: number;
  frontEnd: number;
  net: number;
  marginPct: number;
  netPct: number;
}

export function computePnL(ownerPrice: number, t: Tetapan): PnL {
  const p = Math.max(0, Number(ownerPrice) || 0);
  const margin = Math.round((p * (Number(t.margin_pct) || 0)) / 100);
  const contractor = p - margin;
  const reserve = Math.round((p * (Number(t.reserve_pct) || 0)) / 100);
  const frontEnd = Number(t.kos_frontend) || 0;
  const net = margin - reserve - frontEnd;
  return {
    ownerPrice: p, margin, contractor, reserve, frontEnd, net,
    marginPct: p ? Math.round((margin / p) * 1000) / 10 : 0,
    netPct: p ? Math.round((net / p) * 1000) / 10 : 0,
  };
}
