alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists is_active boolean not null default false;

update public.profiles p
set email = lower(u.email),
    display_name = coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, ''), '@', 1)),
    role = case when lower(coalesce(u.email, '')) = 'ludwig@marketingmediacloud.com' then 'admin'::public.profile_role else p.role end,
    is_active = case when lower(coalesce(u.email, '')) = 'ludwig@marketingmediacloud.com' then true else p.is_active end
from auth.users u
where p.id = u.id;

insert into public.profiles (id, email, display_name, role, is_active)
select
  u.id,
  lower(u.email),
  coalesce(nullif(u.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(u.email, ''), '@', 1)),
  case when lower(coalesce(u.email, '')) = 'ludwig@marketingmediacloud.com' then 'admin'::public.profile_role else 'staff'::public.profile_role end,
  lower(coalesce(u.email, '')) = 'ludwig@marketingmediacloud.com'
from auth.users u
where u.email is not null
on conflict (id) do nothing;

alter table public.profiles alter column email set not null;
create unique index if not exists profiles_email_unique_idx on public.profiles (email);

create or replace function public.sync_portal_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  is_admin boolean := lower(coalesce(new.email, '')) = 'ludwig@marketingmediacloud.com';
begin
  insert into public.profiles (id, email, display_name, role, is_active)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(coalesce(new.email, ''), '@', 1)),
    case when is_admin then 'admin'::public.profile_role else 'staff'::public.profile_role end,
    is_admin
  )
  on conflict (id) do update
  set email = excluded.email,
      role = case when is_admin then 'admin'::public.profile_role else public.profiles.role end,
      is_active = case when is_admin then true else public.profiles.is_active end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.sync_portal_profile();

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
after update of email on auth.users
for each row execute function public.sync_portal_profile();

create or replace function public.is_portal_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select lower(coalesce((select auth.jwt() ->> 'email'), '')) = 'ludwig@marketingmediacloud.com';
$$;

create or replace function public.is_active_portal_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_portal_admin()
    or exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.is_active
    );
$$;

drop policy if exists "authenticated users can read portal data" on public.profiles;
drop policy if exists "authenticated users can read events" on public.events;
drop policy if exists "authenticated users can read contacts" on public.contacts;
drop policy if exists "authenticated users can read occurrences" on public.event_occurrences;
drop policy if exists "authenticated users can read audit events" on public.audit_events;
drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "approved users can read events" on public.events;
drop policy if exists "approved users can read contacts" on public.contacts;
drop policy if exists "approved users can read occurrences" on public.event_occurrences;
drop policy if exists "approved users can read audit events" on public.audit_events;
drop policy if exists "admin can manage profiles" on public.profiles;
drop policy if exists "admin can manage events" on public.events;
drop policy if exists "admin can manage contacts" on public.contacts;
drop policy if exists "admin can manage event occurrences" on public.event_occurrences;
drop policy if exists "admin can manage audit events" on public.audit_events;

create policy "users can read own profile" on public.profiles for select to authenticated
using (id = (select auth.uid()) or public.is_portal_admin());
create policy "approved users can read events" on public.events for select to authenticated
using (public.is_active_portal_user());
create policy "approved users can read contacts" on public.contacts for select to authenticated
using (public.is_active_portal_user());
create policy "approved users can read occurrences" on public.event_occurrences for select to authenticated
using (public.is_active_portal_user());
create policy "approved users can read audit events" on public.audit_events for select to authenticated
using (public.is_active_portal_user());

create policy "admin can manage profiles" on public.profiles for all to authenticated
using (public.is_portal_admin()) with check (public.is_portal_admin());
create policy "admin can manage events" on public.events for all to authenticated
using (public.is_portal_admin()) with check (public.is_portal_admin());
create policy "admin can manage contacts" on public.contacts for all to authenticated
using (public.is_portal_admin()) with check (public.is_portal_admin());
create policy "admin can manage event occurrences" on public.event_occurrences for all to authenticated
using (public.is_portal_admin()) with check (public.is_portal_admin());
create policy "admin can manage audit events" on public.audit_events for all to authenticated
using (public.is_portal_admin()) with check (public.is_portal_admin());
