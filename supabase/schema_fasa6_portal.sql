-- ============================================================
-- e-Surau · Skema Fasa 6 (Portal Ahli — login ahli kariah)
-- Jalankan SELEPAS fasa 1-5.
-- Auto-pautkan akaun login ahli ke rekod ahli_kariah ikut emel.
-- ============================================================

-- Kemas kini trigger: bila pengguna baharu daftar, cipta profil DAN
-- pautkan ke rekod ahli_kariah yang sepadan emel (jika ada).
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profil (id, nama, emel)
  values (new.id, new.raw_user_meta_data->>'nama', new.email)
  on conflict (id) do nothing;

  -- Pautkan ke rekod ahli sedia ada (padan emel) — jadikan peranan 'ahli'
  update profil p
     set ahli_id = (
        select a.id from ahli_kariah a
        where a.emel is not null
          and lower(a.emel) = lower(new.email)
        order by a.tarikh_daftar desc
        limit 1
     )
   where p.id = new.id and p.ahli_id is null;

  return new;
end; $$;

-- RPC bantuan: pautkan akaun semasa ke rekod ahli ikut emel (jika trigger
-- terlepas kerana rekod dicipta selepas akaun). Boleh dipanggil oleh ahli.
create or replace function pautkan_akaun_ahli()
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_emel text; v_ahli uuid;
begin
  if auth.uid() is null then return jsonb_build_object('ok', false, 'sebab', 'tiada sesi'); end if;
  select emel into v_emel from profil where id = auth.uid();
  if v_emel is null then return jsonb_build_object('ok', false, 'sebab', 'tiada emel'); end if;

  select id into v_ahli from ahli_kariah
    where emel is not null and lower(emel) = lower(v_emel)
    order by tarikh_daftar desc limit 1;

  if v_ahli is not null then
    update profil set ahli_id = v_ahli where id = auth.uid();
  end if;
  return jsonb_build_object('ok', v_ahli is not null, 'ahli_id', v_ahli);
end; $$;

grant execute on function pautkan_akaun_ahli() to authenticated;

-- RLS: ahli boleh baca keahlian khairat & yuran mereka sendiri
alter table keahlian_khairat enable row level security;
alter table yuran_khairat    enable row level security;

drop policy if exists "khairat: ahli baca sendiri" on keahlian_khairat;
create policy "khairat: ahli baca sendiri" on keahlian_khairat
  for select using (
    is_staf() or ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

drop policy if exists "yuran: ahli baca sendiri" on yuran_khairat;
create policy "yuran: ahli baca sendiri" on yuran_khairat
  for select using (
    is_staf() or keahlian_id in (
      select k.id from keahlian_khairat k
      where k.ahli_id = (select ahli_id from profil where profil.id = auth.uid())
    )
  );
