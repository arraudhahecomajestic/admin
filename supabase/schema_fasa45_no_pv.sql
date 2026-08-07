-- ============================================================
-- e-Surau · Fasa 45 — Sambung siri No. PV / Baucer ikut format sedia ada
-- Format lama: YYYYMM + nombor berturutan 3 digit  (cth: 202608027)
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- 1) Ubah fungsi auto-jana supaya ikut format PV manual anda.
create or replace function set_no_baucer() returns trigger as $$
begin
  if new.no_baucer is null then
    new.no_baucer := to_char(current_date, 'YYYYMM')
                     || lpad(nextval('seq_no_baucer')::text, 3, '0');
  end if;
  return new;
end; $$ language plpgsql;

-- 2) Sambung nombor berturutan selepas PV manual terakhir.
--    Terakhir digunakan = 026; tambah 6 lagi secara manual (027-032).
--    setval(...,32,true)  =>  nextval seterusnya = 033.
select setval('seq_no_baucer', 32, true);
