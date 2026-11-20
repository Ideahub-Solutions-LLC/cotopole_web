-- Move the portal's initial demo records into the real Supabase tables.
insert into public.events (id, name, starts_at, ends_at, status)
values
  ('00000000-0000-0000-0000-000000000001', 'Future of Work Summit', '2026-11-18T09:00:00Z', '2026-11-20T17:00:00Z', 'active'),
  ('00000000-0000-0000-0000-000000000002', 'Design Leaders Dinner', '2026-11-12T18:00:00Z', '2026-11-12T22:00:00Z', 'archived'),
  ('00000000-0000-0000-0000-000000000003', 'RevOps Roundtable', '2026-12-04T09:00:00Z', '2026-12-04T17:00:00Z', 'active'),
  ('00000000-0000-0000-0000-000000000004', 'People Analytics Forum', '2026-12-15T09:00:00Z', '2026-12-15T17:00:00Z', 'active'),
  ('00000000-0000-0000-0000-000000000005', 'Customer Experience Week', '2026-10-21T09:00:00Z', '2026-10-23T17:00:00Z', 'archived')
on conflict (id) do nothing;

insert into public.contacts (id, first_name, last_name, role, company, email, phone, temperature, follow_up_status, note)
values
  ('00000000-0000-0000-0000-000000000101', 'Jordan', 'Lee', 'Head of Partnerships', 'Northstar Labs', 'jordan@northstarlabs.co', '+1 415 555 0198', 'Hot', 'Ready to follow up', 'Runs partnerships across 3 regions. Asked for the enterprise case study and pricing by Friday.'),
  ('00000000-0000-0000-0000-000000000102', 'Sofia', 'Patel', 'Founder & CEO', 'Kite & Co.', 'sofia@kiteandco.com', '+1 310 555 0142', 'Warm', 'Synced', 'Interested in a lighter-weight rollout for her consulting team. Reconnect after their planning week.'),
  ('00000000-0000-0000-0000-000000000103', 'Marcus', 'Alvarez', 'VP, Growth', 'Polaris Health', 'marcus@polarishealth.io', '+1 646 555 0117', 'Hot', 'Ready to follow up', 'Strong fit for the referral program. Mentioned a board meeting next Tuesday.'),
  ('00000000-0000-0000-0000-000000000104', 'Emma', 'Carter', 'Marketing Director', 'Fieldnote', 'emma@fieldnote.co', '+1 212 555 0177', 'Warm', 'Needs review', 'Wants to see how the team handles event handoff and duplicate detection.'),
  ('00000000-0000-0000-0000-000000000105', 'Ravi', 'Kumar', 'Principal Consultant', 'Cedar Strategy', 'ravi@cedarstrategy.com', '+1 917 555 0134', 'Cold', 'Synced', 'Met during the afternoon break. Send the short product overview.'),
  ('00000000-0000-0000-0000-000000000106', 'Noah', 'Williams', 'COO', 'Vantage Retail', 'noah@vantageretail.com', '+1 206 555 0106', 'Warm', 'Synced', 'Exploring a shared team workspace for a distributed sales group.')
on conflict (id) do nothing;

insert into public.event_occurrences (event_id, contact_id, captured_at, capture_method, sync_status)
select x.event_id, x.contact_id, x.captured_at::timestamptz, 'manual', 'synced'
from (values
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, '2026-11-19T09:42:00Z'),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, '2026-11-19T09:21:00Z'),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000103'::uuid, '2026-11-19T08:54:00Z'),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000104'::uuid, '2026-11-19T08:40:00Z'),
  ('00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000105'::uuid, '2026-11-19T08:17:00Z'),
  ('00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000106'::uuid, '2026-11-18T19:30:00Z')
) as x(event_id, contact_id, captured_at)
where not exists (select 1 from public.event_occurrences eo where eo.event_id = x.event_id and eo.contact_id = x.contact_id);

drop policy if exists "admin can manage events" on public.events;
drop policy if exists "admin can manage contacts" on public.contacts;
drop policy if exists "admin can manage event occurrences" on public.event_occurrences;

create policy "approved users can manage events" on public.events for all to authenticated
using (public.is_active_portal_user()) with check (public.is_active_portal_user());
create policy "approved users can manage contacts" on public.contacts for all to authenticated
using (public.is_active_portal_user()) with check (public.is_active_portal_user());
create policy "approved users can manage event occurrences" on public.event_occurrences for all to authenticated
using (public.is_active_portal_user()) with check (public.is_active_portal_user());
