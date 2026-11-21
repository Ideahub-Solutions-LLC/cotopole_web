"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ContactInput = {
  firstName: string; middleName: string; lastName: string; phone: string; email: string; company: string;
  position: string; website: string; address: string; photoPath?: string; isFavorite: boolean;
  rating: "hot" | "warm" | "cold" | ""; followUpStatus: "pending" | "contacted" | "done"; note: string;
  eventId?: string; captureMethod?: "manual" | "image" | "qr" | "mixed";
  duplicateResolution?: "new" | "phone_match" | "email_match" | "admin_resolved";
  businessCardPath?: string; selfiePath?: string; ocrRawText?: string;
};

export type EventInput = { name: string; startsAt: string; location: string; notes: string; status: "active" | "archived" };

function required(value: string, label: string) { const trimmed = value.trim(); if (!trimmed) throw new Error(`${label} is required.`); return trimmed; }
function optional(value: string) { return value.trim() || null; }
function isContactsSchemaCacheError(message?: string) {
  return Boolean(message && /could not find the ['"]?[^'"]+['"]? column of ['"]?contacts['"]? in the schema cache/i.test(message));
}
function workspaceSchemaMigrationMessage() {
  return "The workspace database is missing contact fields. Apply supabase/migrations/20261121070000_contact_address_schema_cache.sql in Supabase, then try again.";
}
function validateContact(input: ContactInput) {
  const firstName = required(input.firstName, "First name");
  const lastName = required(input.lastName, "Last name");
  if (!input.phone.trim() && !input.email.trim()) throw new Error("Add a phone number or an email.");
  return { firstName, lastName };
}
async function getClientAndUser() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === "string" ? data.claims.sub : null;
  if (error || !userId) throw new Error("You must be signed in to manage workspace data.");
  return { supabase, userId };
}
function contactRow(input: ContactInput, userId?: string) {
  const names = validateContact(input);
  return { first_name: names.firstName, middle_name: optional(input.middleName), last_name: names.lastName, phone: optional(input.phone), email: optional(input.email), company: optional(input.company), position: optional(input.position), website: optional(input.website), address: optional(input.address), photo_path: optional(input.photoPath ?? ""), is_favorite: input.isFavorite, ...(userId ? { created_by_profile_id: userId } : {}) };
}
function occurrenceRow(input: ContactInput, eventId: string, contactId: string, userId: string) {
  return { event_id: eventId, contact_id: contactId, captured_by_profile_id: userId, capture_method: input.captureMethod ?? "manual", duplicate_resolution: input.duplicateResolution ?? "new", notes: optional(input.note), rating: input.rating || null, follow_up_status: input.followUpStatus, business_card_path: optional(input.businessCardPath ?? ""), selfie_path: optional(input.selfiePath ?? ""), ocr_raw_text: optional(input.ocrRawText ?? "") };
}
export async function createContact(input: ContactInput) {
  const { supabase, userId } = await getClientAndUser();
  const { data: contact, error } = await supabase.from("contacts").insert(contactRow(input, userId)).select("id").single();
  if (error) {
    if (isContactsSchemaCacheError(error.message)) throw new Error(workspaceSchemaMigrationMessage());
    throw new Error(error.message);
  }
  if (!contact) throw new Error("Unable to create contact.");
  if (input.eventId) { const occurrence = await supabase.from("event_occurrences").insert(occurrenceRow(input, input.eventId, contact.id, userId)); if (occurrence.error) throw new Error(occurrence.error.message); }
  revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
export async function updateContact(id: string, input: ContactInput) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase.from("contacts").update({ ...contactRow(input), updated_at: new Date().toISOString() }).eq("id", id);
  if (error) {
    if (isContactsSchemaCacheError(error.message)) throw new Error(workspaceSchemaMigrationMessage());
    throw new Error(error.message);
  }
  const existing = await supabase.from("event_occurrences").select("id").eq("contact_id", id).order("captured_at", { ascending: false }).limit(1).maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (input.eventId) { const occurrence = existing.data ? await supabase.from("event_occurrences").update(occurrenceRow(input, input.eventId, id, userId)).eq("id", existing.data.id) : await supabase.from("event_occurrences").insert(occurrenceRow(input, input.eventId, id, userId)); if (occurrence.error) throw new Error(occurrence.error.message); }
  revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
export async function deleteContact(id: string) {
  const { supabase } = await getClientAndUser();
  const linked = await supabase.from("event_occurrences").delete().eq("contact_id", id); if (linked.error) throw new Error(linked.error.message);
  const { error } = await supabase.from("contacts").delete().eq("id", id); if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
export async function createEvent(input: EventInput) {
  const { supabase, userId } = await getClientAndUser();
  const { error } = await supabase.from("events").insert({ name: required(input.name, "Event name"), starts_at: required(input.startsAt, "Start time"), location: optional(input.location), notes: optional(input.notes), status: input.status, owner_profile_id: userId });
  if (error) throw new Error(error.message); revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
export async function updateEvent(id: string, input: EventInput) {
  const { supabase } = await getClientAndUser();
  const { error } = await supabase.from("events").update({ name: required(input.name, "Event name"), starts_at: required(input.startsAt, "Start time"), location: optional(input.location), notes: optional(input.notes), status: input.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message); revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
export async function deleteEvent(id: string) {
  const { supabase } = await getClientAndUser();
  const linked = await supabase.from("event_occurrences").delete().eq("event_id", id); if (linked.error) throw new Error(linked.error.message);
  const { error } = await supabase.from("events").delete().eq("id", id); if (error) throw new Error(error.message);
  revalidatePath("/"); revalidatePath("/contacts"); revalidatePath("/events");
}
