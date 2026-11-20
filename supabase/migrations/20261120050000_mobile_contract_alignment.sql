-- Align the portal schema with the mobile app's Event, Contact and Occurrence models.
-- This migration is additive/compatibility-minded so existing portal records remain readable.

alter table public.events add column if not exists location text;
alter table public.events add column if not exists updated_at timestamptz not null default now();

alter table public.contacts add column if not exists position text;
alter table public.contacts add column if not exists website text;
alter table public.contacts add column if not exists address text;
alter table public.contacts add column if not exists photo_path text;
alter table public.contacts add column if not exists is_favorite boolean not null default false;
alter table public.contacts add column if not exists updated_at timestamptz not null default now();

-- Preserve data from the original portal naming while making mobile's field canonical.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contacts' and column_name = 'role') then
    execute 'update public.contacts set position = coalesce(position, role) where role is not null';
  end if;
end $$;

alter table public.event_occurrences add column if not exists rating text;
alter table public.event_occurrences add column if not exists follow_up_status text not null default 'pending';
alter table public.event_occurrences add column if not exists business_card_path text;
alter table public.event_occurrences add column if not exists selfie_path text;
alter table public.event_occurrences add column if not exists ocr_raw_text text;
alter table public.event_occurrences add column if not exists updated_at timestamptz not null default now();
alter table public.event_occurrences alter column duplicate_resolution set default 'new';

-- Move legacy contact-level follow-up values onto each contact's latest occurrence.
do $$
begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'contacts' and column_name = 'temperature') then
    execute $sql$
      update public.event_occurrences o
      set rating = lower(c.temperature::text),
          follow_up_status = case c.follow_up_status::text
            when 'Ready to follow up' then 'contacted'
            when 'Synced' then 'done'
            else 'pending'
          end,
          notes = coalesce(o.notes, c.note)
      from public.contacts c
      where c.id = o.contact_id
        and o.id = (select o2.id from public.event_occurrences o2 where o2.contact_id = c.id order by o2.captured_at desc limit 1)
    $sql$;
  end if;
end $$;

create index if not exists event_occurrences_rating_idx on public.event_occurrences(rating);
create index if not exists contacts_position_idx on public.contacts(position);
