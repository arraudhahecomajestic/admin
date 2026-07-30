// Talian paip projek (pipeline) — guna projects.status.
export const STAGES = [
  { key: 'new',         label: 'Lead baru',      color: '#6E6E73' },
  { key: 'qualified',   label: 'Layak',          color: '#2F6FED' },
  { key: 'inspection',  label: 'Site visit',     color: '#7c3aed' },
  { key: 'quoted',      label: 'Quote dihantar', color: '#B9770E' },
  { key: 'signed',      label: 'Sign + deposit', color: '#0f766e' },
  { key: 'in_progress', label: 'Kerja jalan',    color: '#C21F1C' },
  { key: 'completed',   label: 'Siap',           color: '#1FA855' },
] as const;

export const LOST = { key: 'lost', label: 'Hilang', color: '#9a938d' };

export function stageInfo(s?: string | null) {
  if (s === 'lost') return LOST;
  return STAGES.find((x) => x.key === s) ?? { key: s ?? 'new', label: s ?? 'Lead baru', color: '#6E6E73' };
}

export function stageIndex(s?: string | null) {
  return STAGES.findIndex((x) => x.key === s);
}
