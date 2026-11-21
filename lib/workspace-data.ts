import "server-only";

import { createReadOnlySupabaseServerClient } from "@/lib/supabase/server";
import type { FollowUpStatus, Lead, LeadRating, WorkspaceEvent } from "@/lib/data";

export async function getContactsAndEvents() {
  const supabase = await createReadOnlySupabaseServerClient();
  const [contactsResult, eventsResult] = await Promise.all([
    supabase.from("contacts").select("id, first_name, last_name, phone, email, company, position, website, address, photo_path, is_favorite, created_at, event_occurrences(event_id, captured_at, notes, rating, follow_up_status, events(name))").order("created_at", { ascending: false }),
    supabase.from("events").select("id, name, starts_at, location, notes, status, created_at").order("starts_at", { ascending: false }),
  ]);
  let contactRows: any[] = contactsResult.data ?? [];
  let eventRows: any[] = eventsResult.data ?? [];
  if (contactsResult.error) {
    if (!isSchemaMismatch(contactsResult.error.message)) throw new Error(contactsResult.error.message);
    const legacy = await supabase.from("contacts").select("id, first_name, last_name, role, company, email, phone, temperature, follow_up_status, note, created_at, event_occurrences(event_id, captured_at, notes, events(name))").order("created_at", { ascending: false });
    if (legacy.error) throw new Error(legacy.error.message);
    contactRows = legacy.data ?? [];
  }
  if (eventsResult.error) {
    if (!isSchemaMismatch(eventsResult.error.message)) throw new Error(eventsResult.error.message);
    const legacy = await supabase.from("events").select("id, name, starts_at, ends_at, status, notes, created_at").order("starts_at", { ascending: false });
    if (legacy.error) throw new Error(legacy.error.message);
    eventRows = legacy.data ?? [];
  }

  const contacts: Lead[] = (contactRows ?? []).map((row: any) => {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ");
    const occurrence = row.event_occurrences?.[0];
    const capturedAt = occurrence?.captured_at ?? row.created_at;
    const followUpStatus = (occurrence?.follow_up_status ?? legacyFollowUpStatus(row.follow_up_status)) as FollowUpStatus;
    const rating = (occurrence?.rating ?? legacyRating(row.temperature)) as LeadRating | null;
    const status: Lead["status"] = followUpStatus === "contacted" ? "Ready to follow up" : followUpStatus === "done" ? "Synced" : "Needs review";
    return { id: row.id, initials: name.split(/\s+/).map((part: string) => part[0]).join("").slice(0, 2).toUpperCase(), name, middleName: row.middle_name ?? "", role: row.position ?? row.role ?? "", position: row.position ?? row.role ?? "", company: row.company ?? "", email: row.email ?? "", phone: row.phone ?? "", website: row.website ?? "", address: row.address ?? "", photoPath: row.photo_path, isFavorite: Boolean(row.is_favorite), rating, temperature: rating === "hot" ? "Hot" : rating === "cold" ? "Cold" : "Warm", followUpStatus, event: occurrence?.events?.name ?? "Unassigned", eventId: occurrence?.event_id, capturedBy: "Workspace team", capturedAt, capturedLabel: new Date(capturedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }), note: occurrence?.notes ?? row.note ?? "", color: ["violet", "teal", "orange", "pink", "blue", "indigo"][name.length % 6], status };
  });

  const events: WorkspaceEvent[] = (eventRows ?? []).map((row: any) => ({ id: row.id, name: row.name, startsAt: row.starts_at, notes: row.notes ?? "", date: formatEventDate(row.starts_at, row.ends_at), location: row.location ?? row.notes ?? "Workspace event", status: row.status === "active" ? (new Date(row.starts_at) <= new Date() ? "Live" : "Upcoming") : "Completed", contacts: 0, team: 0, owner: "Workspace team" }));
  return { contacts, events };
}

function isSchemaMismatch(message: string) {
  return /column .* does not exist|relationship .* does not exist/i.test(message);
}

function legacyRating(value: unknown): LeadRating | null {
  return value === "Hot" ? "hot" : value === "Cold" ? "cold" : value === "Warm" ? "warm" : null;
}

function legacyFollowUpStatus(value: unknown): FollowUpStatus {
  return value === "Ready to follow up" ? "contacted" : value === "Synced" ? "done" : "pending";
}

function formatEventDate(startsAt: string, endsAt?: string | null) {
  const start = new Date(startsAt);
  const end = endsAt ? new Date(endsAt) : null;
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  if (end && start.toDateString() !== end.toDateString()) return `${startLabel}–${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  return startLabel;
}
