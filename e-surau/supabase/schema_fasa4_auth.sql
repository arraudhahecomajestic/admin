-- ============================================================
-- e-Surau · Skema Fasa 4 (Auth Berperanan — Supabase Auth)
-- Jalankan SELEPAS schema.sql, fasa2, fasa3.
-- Menambah: profil pengguna terpaut auth.users, peranan (RBAC),
-- fungsi pembantu, dan polisi RLS berasaskan peranan.
-- ============================================================

-- ---------- ENUM peranan ----------
do $$ begin
  create type peranan_jenis as enum ('admin', 'bendahari', 'ajk', 'ahli');
exception when duplicate_object then null; end $$;

-- ============================================================
-- PROFIL — satu baris untuk setiap pengguna auth
-- ============================================================
create table if not exists profil (
  id        uuid primary key references auth.users(id) on delete cascade,
  nama      text,
  emel      text,
  ahli_id   uuid references ahli_kariah(id) on delete set null,
  peranan   peranan_jenis not null default 'ahli',
  dicipta   timestamptz not null default now()
);

-- Auto-cipta profil bila pengguna baharu daftar melalui Supabase Auth
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profil (id, nama, emel)
  values (new.id, new.raw_user_meta_data->>'nama', new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_auth_user_baharu on auth.users;
create trigger trg_auth_user_baharu
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- FUNGSI PEMBANTU peranan (guna dalam polisi RLS)
-- ============================================================
create or replace function auth_peranan()
returns peranan_jenis language sql stable security definer set search_path = public as $$
  select peranan from profil where id = auth.uid();
$$;

create or replace function is_staf()
returns boolean language sql stable as $$
  select auth_peranan() in ('admin','bendahari','ajk');
$$;

create or replace function is_admin_atau_bendahari()
returns boolean language sql stable as $$
  select auth_peranan() in ('admin','bendahari');
$$;

-- ============================================================
-- POLISI RLS berasaskan peranan
-- (staf boleh urus; ahli baca rekod sendiri)
-- ============================================================
alter table profil enable row level security;

drop policy if exists "profil: baca sendiri" on profil;
create policy "profil: baca sendiri" on profil
  for select using (id = auth.uid() or is_staf());

drop policy if exists "profil: admin urus" on profil;
create policy "profil: admin urus" on profil
  for all using (auth_peranan() = 'admin') with check (auth_peranan() = 'admin');

-- Ahli kariah: staf urus penuh; ahli baca rekod sendiri
drop policy if exists "ahli: staf urus" on ahli_kariah;
create policy "ahli: staf urus" on ahli_kariah
  for all using (is_staf()) with check (is_staf());

drop policy if exists "ahli: baca sendiri" on ahli_kariah;
create policy "ahli: baca sendiri" on ahli_kariah
  for select using (
    id = (select ahli_id from profil where profil.id = auth.uid())
  );

-- Kewangan: staf urus; ahli baca kutipan/invois sendiri
drop policy if exists "kutipan: staf urus" on kutipan;
create policy "kutipan: staf urus" on kutipan
  for all using (is_staf()) with check (is_staf());

drop policy if exists "kutipan: ahli baca sendiri" on kutipan;
create policy "kutipan: ahli baca sendiri" on kutipan
  for select using (
    ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

drop policy if exists "perbelanjaan: staf urus" on perbelanjaan;
create policy "perbelanjaan: staf urus" on perbelanjaan
  for all using (is_admin_atau_bendahari()) with check (is_admin_atau_bendahari());

drop policy if exists "invois: staf urus" on invois;
create policy "invois: staf urus" on invois
  for all using (is_staf()) with check (is_staf());

drop policy if exists "invois: ahli baca sendiri" on invois;
create policy "invois: ahli baca sendiri" on invois
  for select using (
    ahli_id = (select ahli_id from profil where profil.id = auth.uid())
  );

-- Nota: operasi pentadbiran dari server masih boleh guna service_role
-- (bypass RLS). Polisi di atas membolehkan akses terus berasaskan peranan
-- untuk masa depan (portal ahli & pengurangan kebergantungan service_role).

-- ============================================================
-- CADANGAN: selepas cipta pengguna admin pertama di Supabase Auth,
-- jalankan sekali untuk jadikan dia admin:
--   update profil set peranan='admin' where emel='EMEL_ADMIN_ANDA';
-- ============================================================
