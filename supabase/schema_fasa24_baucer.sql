-- ============================================================
-- e-Surau · Skema Fasa 24 (Baucer Bayaran — medan tambahan perbelanjaan)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

alter table perbelanjaan add column if not exists bayar_kepada text;
alter table perbelanjaan add column if not exists cara_bayar text;
alter table perbelanjaan add column if not exists no_rujukan_bayar text;
alter table perbelanjaan add column if not exists no_baucer text unique;

-- Auto no_baucer: BV2026-0001
create sequence if not exists seq_no_baucer start 1;

create or replace function set_no_baucer() returns trigger as $$
begin
  if new.no_baucer is null then
    new.no_baucer := 'BV' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('seq_no_baucer')::text, 4, '0');
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists trg_no_baucer on perbelanjaan;
create trigger trg_no_baucer before insert on perbelanjaan
  for each row execute function set_no_baucer();

-- Beri no_baucer kepada rekod sedia ada yang belum ada
update perbelanjaan
set no_baucer = 'BV' || to_char(coalesce(tarikh, current_date), 'YYYY') || '-' || lpad(nextval('seq_no_baucer')::text, 4, '0')
where no_baucer is null;
