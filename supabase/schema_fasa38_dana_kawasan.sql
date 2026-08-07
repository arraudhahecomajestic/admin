-- ============================================================
-- e-Surau · Skema Fasa 38
--  (1) Tanda dana kutipan "ditutup" (Ramadhan & Qurban)
--  (2) Simpan kawasan/fasa masa pendaftaran ahli
-- Jalankan di Supabase SQL Editor.
-- ============================================================

-- (1) Kolum ditutup pada kategori kutipan
alter table kategori_kutipan add column if not exists ditutup boolean not null default false;

-- Tandakan dana bermusim sebagai ditutup
update kategori_kutipan set ditutup = true
where nama ilike '%ramadhan%' or nama ilike '%qurban%';

-- Kemas kini paparan ringkasan supaya sertakan 'ditutup' (dilampir di hujung)
create or replace view v_kutipan_ringkasan as
select
  kk.id as kategori_id,
  kk.nama,
  kk.jenis_khairat,
  kk.urutan,
  coalesce(sum(k.jumlah), 0) as jumlah_terkumpul,
  coalesce(sum(k.jumlah) filter (where date_trunc('month', k.tarikh) = date_trunc('month', current_date)), 0) as jumlah_bulan_ini,
  (select k2.jumlah from kutipan k2 where k2.kategori_id = kk.id order by k2.tarikh desc, k2.dicipta desc limit 1) as terkini_jumlah,
  (select k2.tarikh  from kutipan k2 where k2.kategori_id = kk.id order by k2.tarikh desc, k2.dicipta desc limit 1) as terkini_tarikh,
  kk.ditutup
from kategori_kutipan kk
left join kutipan k on k.kategori_id = kk.id
where kk.papar_awam
group by kk.id, kk.nama, kk.jenis_khairat, kk.urutan, kk.ditutup
order by kk.urutan, kk.id;

grant select on v_kutipan_ringkasan to anon, authenticated;

-- (2) daftar_ahli: simpan kawasan/fasa sekali
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
  if nullif(payload->>'url_selfie','') is null then
    raise exception 'Swafoto (selfie) wajib untuk pengesahan.';
  end if;
  if nullif(payload->>'url_tandatangan','') is null then
    raise exception 'e-Tandatangan wajib untuk pengesahan.';
  end if;
  if nullif(payload->>'url_kp_depan','') is null or nullif(payload->>'url_kp_belakang','') is null then
    raise exception 'Gambar Kad Pengenalan (depan & belakang) wajib.';
  end if;

  insert into ahli_kariah (
    kariah, gelaran, nama, no_kp, alamat_kp, alamat, kawasan, no_telefon_rumah, telefon, emel,
    status_perkahwinan, tempoh_menetap_nilai, tempoh_menetap_unit,
    pengakuan, url_kp_depan, url_kp_belakang,
    url_tandatangan, url_selfie, disahkan_esign, tarikh_esign,
    status, peringkat, maklumat_disahkan, tarikh_kemaskini
  )
  values (
    nullif(payload->>'kariah',''),
    nullif(payload->>'gelaran',''),
    payload->>'nama',
    payload->>'no_kp',
    nullif(payload->>'alamat_kp',''),
    nullif(payload->>'alamat',''),
    nullif(payload->>'kawasan',''),
    nullif(payload->>'no_telefon_rumah',''),
    nullif(payload->>'telefon',''),
    nullif(payload->>'emel',''),
    nullif(payload->>'status_perkahwinan',''),
    nullif(payload->>'tempoh_menetap_nilai','')::int,
    coalesce(nullif(payload->>'tempoh_menetap_unit','')::unit_tempoh, 'tahun'),
    coalesce((payload->>'pengakuan')::boolean, false),
    nullif(payload->>'url_kp_depan',''),
    nullif(payload->>'url_kp_belakang',''),
    nullif(payload->>'url_tandatangan',''),
    nullif(payload->>'url_selfie',''),
    true,
    now(),
    'menunggu', 'baru', true, now()
  )
  returning id into v_ahli_id;

  if payload ? 'tanggungan' then
    for v_tgg in select * from jsonb_array_elements(payload->'tanggungan')
    loop
      insert into tanggungan (ahli_id, nama, no_kp, hubungan, tarikh_lahir, dilindungi_khairat, oku, masih_belajar)
      values (
        v_ahli_id,
        v_tgg->>'nama',
        nullif(v_tgg->>'no_kp',''),
        (coalesce(nullif(v_tgg->>'hubungan',''),'lain'))::hubungan_tanggungan,
        nullif(v_tgg->>'tarikh_lahir','')::date,
        coalesce((v_tgg->>'dilindungi_khairat')::boolean, true),
        coalesce((v_tgg->>'oku')::boolean, false),
        coalesce((v_tgg->>'masih_belajar')::boolean, false)
      );
    end loop;
  end if;

  if coalesce((payload->>'sertai_khairat')::boolean, false) then
    insert into keahlian_khairat (ahli_id, status)
    values (v_ahli_id, 'tertunggak')
    returning id into v_keahlian_id;
  end if;

  return jsonb_build_object('ok', true, 'ahli_id', v_ahli_id, 'keahlian_id', v_keahlian_id);
end;
$$;

grant execute on function daftar_ahli(jsonb) to anon, authenticated;
