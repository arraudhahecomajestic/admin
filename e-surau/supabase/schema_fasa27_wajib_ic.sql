-- ============================================================
-- e-Surau · Skema Fasa 27 (Wajibkan gambar IC masa DAFTAR — server-side)
-- Menambah semakan supaya pendaftaran TANPA gambar IC ditolak.
-- Jalankan SELEPAS fasa 19.
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
  -- Wajib: swafoto, e-tandatangan & gambar IC (depan + belakang)
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
    kariah, gelaran, nama, no_kp, alamat_kp, alamat, no_telefon_rumah, telefon, emel,
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
