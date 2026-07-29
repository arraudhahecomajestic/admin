-- ============================================================
-- e-Surau · Skema Fasa 5 (Pematuhan Borang JAIS Selangor)
-- Borang Pendaftaran Ahli Kariah Masjid & Surau Negeri Selangor.
-- Jalankan SELEPAS schema.sql .. fasa4.
-- ============================================================

-- ---------- ENUM tempoh menetap ----------
do $$ begin
  create type unit_tempoh as enum ('tahun', 'bulan');
exception when duplicate_object then null; end $$;

-- ============================================================
-- BAHAGIAN A — medan tambahan pada ahli_kariah
-- ============================================================
alter table ahli_kariah add column if not exists kariah text;                 -- Nama masjid/surau
alter table ahli_kariah add column if not exists alamat_kp text;              -- Alamat dalam KP/Passport
-- (kolum sedia ada `alamat` digunakan sebagai Alamat Tempat Tinggal Sekarang)
alter table ahli_kariah add column if not exists no_telefon_rumah text;       -- No. Telefon Rumah
-- (kolum sedia ada `telefon` digunakan sebagai No. H/P)
alter table ahli_kariah add column if not exists tempoh_menetap_nilai int;    -- Tempoh menetap
alter table ahli_kariah add column if not exists tempoh_menetap_unit unit_tempoh default 'tahun';
alter table ahli_kariah add column if not exists pengakuan boolean not null default false; -- Bahagian A no.8
-- Salinan kad pengenalan — snap kamera (KYC): depan & belakang
alter table ahli_kariah add column if not exists url_kp_depan text;
alter table ahli_kariah add column if not exists url_kp_belakang text;

-- ============================================================
-- BAHAGIAN B — Ulasan (2 peringkat sokongan)
-- ============================================================
-- Ulasan 1: Pengerusi MPKK/JPP / Setiausaha Masjid/Surau
alter table ahli_kariah add column if not exists ulasan_su_sokong boolean;
alter table ahli_kariah add column if not exists ulasan_su_catatan text;
alter table ahli_kariah add column if not exists ulasan_su_oleh text;
alter table ahli_kariah add column if not exists ulasan_su_tarikh date;
-- Ulasan 2: Nazir Masjid / Pengerusi Surau
alter table ahli_kariah add column if not exists ulasan_nazir_sokong boolean;
alter table ahli_kariah add column if not exists ulasan_nazir_catatan text;
alter table ahli_kariah add column if not exists ulasan_nazir_oleh text;
alter table ahli_kariah add column if not exists ulasan_nazir_tarikh date;

-- ============================================================
-- BAHAGIAN C — Keputusan Permohonan (JK Kariah/Surau)
-- Status akhir kekal di kolum `status` (menunggu/lulus/tolak).
-- ============================================================
alter table ahli_kariah add column if not exists keputusan_oleh text;
alter table ahli_kariah add column if not exists keputusan_tarikh date;

-- Peringkat aliran kerja (untuk paparkan status proses kepada pemohon)
do $$ begin
  create type peringkat_permohonan as enum
    ('baru', 'disokong_su', 'disokong_nazir', 'selesai');
exception when duplicate_object then null; end $$;
alter table ahli_kariah add column if not exists peringkat peringkat_permohonan not null default 'baru';

-- ============================================================
-- Kemas kini RPC daftar_ahli — terima semua medan Bahagian A
-- ============================================================
create or replace function daftar_ahli(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ahli_id uuid;
  v_keahlian_id uuid;
  v_tgg jsonb;
begin
  insert into ahli_kariah (
    kariah, nama, no_kp, alamat_kp, alamat, no_telefon_rumah, telefon, emel,
    status_perkahwinan, tempoh_menetap_nilai, tempoh_menetap_unit,
    pengakuan, url_kp_depan, url_kp_belakang, status, peringkat
  )
  values (
    nullif(payload->>'kariah',''),
    payload->>'nama',
    payload->>'no_kp',
    nullif(payload->>'alamat_kp',''),
    nullif(payload->>'alamat',''),
    nullif(payload->>'no_telefon_rumah',''),
    nullif(payload->>'telefon',''),
    nullif(payload->>'emel',''),
    nullif(payload->>'status_perkahwinan',''),
    nullif(payload->>'tempoh_menetap_nilai','')::int,
    coalesce(nullif(payload->>'tempoh_menetap_unit','')::unit_tempoh, 'tahun'),
    coalesce((payload->>'pengakuan')::boolean, false),
    nullif(payload->>'url_kp_depan',''),
    nullif(payload->>'url_kp_belakang',''),
    'menunggu', 'baru'
  )
  returning id into v_ahli_id;

  -- Tanggungan (jika ada)
  if payload ? 'tanggungan' then
    for v_tgg in select * from jsonb_array_elements(payload->'tanggungan')
    loop
      insert into tanggungan (ahli_id, nama, no_kp, hubungan, tarikh_lahir, dilindungi_khairat)
      values (
        v_ahli_id,
        v_tgg->>'nama',
        nullif(v_tgg->>'no_kp',''),
        (coalesce(nullif(v_tgg->>'hubungan',''),'lain'))::hubungan_tanggungan,
        nullif(v_tgg->>'tarikh_lahir','')::date,
        coalesce((v_tgg->>'dilindungi_khairat')::boolean, true)
      );
    end loop;
  end if;

  -- Opt-in khairat
  if coalesce((payload->>'sertai_khairat')::boolean, false) then
    insert into keahlian_khairat (ahli_id, status)
    values (v_ahli_id, 'tertunggak')
    returning id into v_keahlian_id;
  end if;

  return jsonb_build_object('ok', true, 'ahli_id', v_ahli_id, 'keahlian_id', v_keahlian_id);
end;
$$;

grant execute on function daftar_ahli(jsonb) to anon, authenticated;

-- ============================================================
-- STORAGE: bucket untuk salinan kad pengenalan
-- (Jalankan di Supabase; jika ralat "already exists" — abaikan)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('salinan-kp', 'salinan-kp', false)
on conflict (id) do nothing;

-- Benarkan orang awam MUAT NAIK salinan KP semasa pendaftaran
do $$ begin
  create policy "awam muat naik salinan kp" on storage.objects
    for insert to anon, authenticated
    with check (bucket_id = 'salinan-kp');
exception when duplicate_object then null; end $$;
