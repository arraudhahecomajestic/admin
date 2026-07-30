-- ============================================================
-- RENORUMAH — Fasa Approval: Payment (CHIP) — teras
-- Lajur bayaran pada approval_cases + harga report boleh edit.
-- Idempotent.
-- ============================================================

alter table public.approval_cases add column if not exists chip_purchase_id text;
alter table public.approval_cases add column if not exists amount            numeric;
alter table public.approval_cases add column if not exists paid_at           timestamptz;

create index if not exists approval_cases_chip_idx on public.approval_cases(chip_purchase_id);

-- Harga report (RM) — boleh ubah dari admin (Settings). Default 250.
insert into public.tetapan_sistem (kunci, nilai, label) values
  ('harga_report_rm', '250', 'Harga Laporan Feasibility (RM)')
on conflict (kunci) do nothing;
