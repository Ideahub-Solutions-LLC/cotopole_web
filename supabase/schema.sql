-- Cotople Portal: Supabase-ready event lead capture model
create extension if not exists "pgcrypto";

create type public.profile_role as enum ('admin', 'staff');
create type public.event_status as enum ('active', 'archived');
create type public.capture_method as enum ('manual', 'image', 'qr', 'mixed');
create type public.lead_temperature as enum ('Hot', 'Warm', 'Cold');
create type public.follow_up_status as enum ('Ready to follow up', 'Needs review', 'Synced');

create table public.profiles (id uuid primary key references auth.users(id) on delete cascade, email text not null, display_name text not null, role public.profile_role not null default 'staff', is_active boolean not null default false, avatar_color text, created_at timestamptz not null default now());
create unique index profiles_email_unique_idx on public.profiles(email);
create table public.events (id uuid primary key default gen_random_uuid(), name text not null, starts_at timestamptz not null, ends_at timestamptz, status public.event_status not null default 'active', notes text, owner_profile_id uuid references public.profiles(id), created_at timestamptz not null default now());
create table public.contacts (id uuid primary key default gen_random_uuid(), first_name text not null, last_name text, role text, company text, email text, email_normalized text generated always as (lower(nullif(trim(email), ''))) stored, phone text, phone_normalized text, temperature public.lead_temperature not null default 'Warm', follow_up_status public.follow_up_status not null default 'Needs review', note text, card_photo_path text, selfie_path text, created_by_profile_id uuid references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index contacts_email_normalized_idx on public.contacts(email_normalized);
create index contacts_phone_normalized_idx on public.contacts(phone_normalized);
create table public.event_occurrences (id uuid primary key default gen_random_uuid(), event_id uuid not null references public.events(id) on delete cascade, contact_id uuid not null references public.contacts(id) on delete restrict, captured_by_profile_id uuid references public.profiles(id), captured_at timestamptz not null default now(), capture_method public.capture_method not null default 'manual', notes text, duplicate_resolution text, sync_status text not null default 'synced', created_at timestamptz not null default now());
create index event_occurrences_event_idx on public.event_occurrences(event_id, captured_at desc);
create index event_occurrences_contact_idx on public.event_occurrences(contact_id, captured_at desc);
create table public.audit_events (id uuid primary key default gen_random_uuid(), actor_profile_id uuid references public.profiles(id), event_type text not null, entity_type text, entity_id uuid, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());

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

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.contacts enable row level security;
alter table public.event_occurrences enable row level security;
alter table public.audit_events enable row level security;

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
