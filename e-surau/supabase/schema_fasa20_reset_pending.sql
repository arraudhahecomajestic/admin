-- ============================================================
-- e-Surau · Skema Fasa 20 (Reset SEMUA ahli sedia ada ke PENDING)
-- Semua kariah yang telah didaftar/import WAJIB lalui semula proses:
--   Kemas kini terkini → Sokongan SU → Sokongan Pengerusi → Lulus.
--
-- AMARAN: Ini menetapkan SEMULA status, sokongan & kelulusan SEDIA ADA.
-- Jalankan SEKALI sahaja (one-time). Selepas ini, pendaftaran baharu
-- tetap bermula 'menunggu' seperti biasa.
-- Jalankan di Supabase SQL Editor.
-- ============================================================

update ahli_kariah set
  status              = 'menunggu',
  peringkat           = 'baru',
  maklumat_disahkan   = false,
  tarikh_kemaskini    = null,
  -- Bahagian B1: Ulasan Setiausaha / Pengerusi MPKK
  ulasan_su_sokong    = null,
  ulasan_su_catatan   = null,
  ulasan_su_oleh      = null,
  ulasan_su_tarikh    = null,
  -- Bahagian B2: Ulasan Nazir / Pengerusi Surau
  ulasan_nazir_sokong = null,
  ulasan_nazir_catatan= null,
  ulasan_nazir_oleh   = null,
  ulasan_nazir_tarikh = null,
  -- Bahagian C: Keputusan
  keputusan_oleh      = null,
  keputusan_tarikh    = null;

-- Semak bilangan rekod selepas reset
select status, count(*) from ahli_kariah group by status;
