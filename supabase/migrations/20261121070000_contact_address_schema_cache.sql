-- Repair older deployments where the mobile contact contract was not applied
-- or is not yet visible to PostgREST's schema cache.
alter table public.contacts add column if not exists middle_name text;
alter table public.contacts add column if not exists position text;
alter table public.contacts add column if not exists website text;
alter table public.contacts add column if not exists address text;
alter table public.contacts add column if not exists photo_path text;
alter table public.contacts add column if not exists is_favorite boolean not null default false;
alter table public.contacts add column if not exists updated_at timestamptz not null default now();

-- Ask PostgREST to refresh its view of the database immediately.
notify pgrst, 'reload schema';
