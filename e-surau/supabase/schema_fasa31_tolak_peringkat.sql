-- ============================================================
-- e-Surau · Skema Fasa 31 (Peringkat "ditolak" pada aliran semakan)
-- Supaya paparan peringkat tepat bila SU / Nazir TIDAK menyokong
-- (sebelum ini sentiasa "disokong_su" walaupun ditolak).
-- Jalankan baris ALTER TYPE ini SENDIRIAN di Supabase SQL Editor.
-- ============================================================

alter type peringkat_permohonan add value if not exists 'ditolak_su';
alter type peringkat_permohonan add value if not exists 'ditolak_nazir';
