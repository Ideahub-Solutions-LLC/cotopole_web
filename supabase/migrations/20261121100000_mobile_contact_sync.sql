-- Device-scoped contact synchronization.
-- A device can only pull contacts that it has previously uploaded/claimed.
create table if not exists public.mobile_contact_sync_scope (
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id uuid not null,
  local_contact_id text not null check (char_length(local_contact_id) between 1 and 128),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, device_id, local_contact_id),
  unique (user_id, device_id, contact_id)
);

create index if not exists mobile_contact_sync_scope_pull_idx
  on public.mobile_contact_sync_scope(user_id, device_id, updated_at desc);

alter table public.contacts add column if not exists deleted_at timestamptz;
create index if not exists contacts_updated_at_idx on public.contacts(updated_at desc);
create index if not exists contacts_deleted_at_idx on public.contacts(deleted_at) where deleted_at is not null;

alter table public.mobile_contact_sync_scope enable row level security;
create policy "users can read own mobile sync scope"
  on public.mobile_contact_sync_scope for select to authenticated
  using (user_id = (select auth.uid()) or public.is_portal_admin());

-- The API uses a server-only Supabase service key after verifying the user's JWT.
-- No client-facing policy grants arbitrary inserts or updates to this table.
