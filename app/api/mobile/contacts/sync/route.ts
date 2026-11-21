import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { authenticateMobileRequest, createSupabaseServiceClient } from "@/lib/mobile-contact-sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 1_000_000;
const MAX_CONTACTS_PER_REQUEST = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;

const headers = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
};

function reply(body: unknown, status = 200) {
  return Response.json(body, { status, headers });
}

function errorResponse(code: string, message: string, status: number) {
  return reply({ error: { code, message } }, status);
}

function validOptionalText(value: unknown, max: number) {
  return value === undefined || value === null || (typeof value === "string" && value.trim().length <= max);
}

function contactDTO(row: Record<string, unknown>) {
  return {
    id: row.id,
    first_name: row.first_name,
    middle_name: row.middle_name,
    last_name: row.last_name,
    position: row.position,
    company: row.company,
    email: row.email,
    phone: row.phone,
    website: row.website,
    address: row.address,
    photo_path: row.photo_path,
    is_favorite: row.is_favorite,
    note: row.note,
    created_at: row.created_at,
    updated_at: row.updated_at,
    deleted: Boolean(row.deleted_at),
  };
}

function validContact(input: unknown): input is Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) return false;
  const value = input as Record<string, unknown>;
  if (typeof value.local_id !== "string" || value.local_id.trim().length === 0 || value.local_id.length > 128) return false;
  if (value.id !== undefined && value.id !== null && (typeof value.id !== "string" || !UUID.test(value.id))) return false;
  if (value.deleted !== undefined && typeof value.deleted !== "boolean") return false;
  if (value.is_favorite !== undefined && typeof value.is_favorite !== "boolean") return false;
  for (const field of ["first_name", "middle_name", "last_name", "position", "company", "email", "phone", "website", "address", "photo_path", "note"]) {
    if (!validOptionalText(value[field], 10_000)) return false;
  }
  if (!value.deleted && (typeof value.first_name !== "string" || typeof value.last_name !== "string" || !value.first_name.trim() || !value.last_name.trim())) return false;
  for (const field of ["base_updated_at", "client_updated_at"]) {
    if (value[field] !== undefined && (typeof value[field] !== "string" || !ISO_DATE.test(value[field]))) return false;
  }
  return true;
}

async function pullScopedContacts(service: ReturnType<typeof createSupabaseServiceClient>, userId: string, deviceId: string, cursor: string | null) {
  let query = service
    .from("mobile_contact_sync_scope")
    .select("local_contact_id, contact:contacts(id, first_name, middle_name, last_name, position, company, email, phone, website, address, photo_path, is_favorite, note, created_at, updated_at, deleted_at)")
    .eq("user_id", userId)
    .eq("device_id", deviceId);
  if (cursor) query = query.gt("contacts.updated_at", cursor);
  const { data, error } = await query.order("updated_at", { ascending: true });
  if (error) throw new Error(error.message);

  return (data ?? []).flatMap((row: any) => {
    const contact = Array.isArray(row.contact) ? row.contact[0] : row.contact;
    return contact ? [{ local_id: row.local_contact_id, ...contactDTO(contact) }] : [];
  });
}

export async function POST(request: NextRequest) {
  const auth = await authenticateMobileRequest(request);
  if (!auth) return errorResponse("UNAUTHORIZED", "A valid Supabase access token is required.", 401);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) return errorResponse("PAYLOAD_TOO_LARGE", "The request body is too large.", 413);
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return errorResponse("UNSUPPORTED_MEDIA_TYPE", "Use application/json.", 415);

  let body: any;
  try {
    body = await request.json();
  } catch {
    return errorResponse("INVALID_JSON", "The request body must be valid JSON.", 400);
  }

  const deviceId = body?.device_id;
  const cursor = body?.cursor ?? null;
  const contacts = body?.contacts;
  if (typeof deviceId !== "string" || !UUID.test(deviceId) || (cursor !== null && (typeof cursor !== "string" || !ISO_DATE.test(cursor))) || !Array.isArray(contacts) || contacts.length > MAX_CONTACTS_PER_REQUEST || !contacts.every(validContact)) {
    return errorResponse("INVALID_REQUEST", "device_id, cursor, and up to 100 valid contacts are required.", 400);
  }

  const service = createSupabaseServiceClient();
  const userId = auth.user.id;
  const conflicts: Array<{ local_id: string; reason: string; server_contact?: unknown }> = [];

  for (const input of contacts as Record<string, unknown>[]) {
    const localId = input.local_id as string;
    const { data: scope, error: scopeError } = await service
      .from("mobile_contact_sync_scope")
      .select("contact_id")
      .eq("user_id", userId)
      .eq("device_id", deviceId)
      .eq("local_contact_id", localId)
      .maybeSingle();
    if (scopeError) return errorResponse("SYNC_FAILED", "Unable to read the mobile sync scope.", 500);

    const contactId = scope?.contact_id ?? (input.id as string | undefined) ?? randomUUID();
    if (!scope && input.id) {
      const { data: claimed } = await service.from("mobile_contact_sync_scope").select("contact_id").eq("user_id", userId).eq("device_id", deviceId).eq("contact_id", input.id).maybeSingle();
      if (claimed && claimed.contact_id !== input.id) return errorResponse("INVALID_REQUEST", "A local contact is already mapped to another local record.", 409);
      const { data: existing } = await service.from("contacts").select("id").eq("id", input.id).maybeSingle();
      if (existing) {
        conflicts.push({ local_id: localId, reason: "CONTACT_NOT_IN_DEVICE_SCOPE" });
        continue;
      }
    }

    let existing: any = null;
    if (scope) {
      const { data, error } = await service.from("contacts").select("*").eq("id", contactId).maybeSingle();
      if (error) return errorResponse("SYNC_FAILED", "Unable to read a contact.", 500);
      existing = data;
    }

    const baseUpdatedAt = input.base_updated_at as string | undefined;
    if (existing && (!baseUpdatedAt || new Date(existing.updated_at).getTime() > new Date(baseUpdatedAt).getTime())) {
      conflicts.push({ local_id: localId, reason: "SERVER_WINS", server_contact: contactDTO(existing) });
      continue;
    }

    const deleted = input.deleted === true;
    const row = deleted ? { deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() } : {
      id: contactId,
      first_name: input.first_name,
      middle_name: input.middle_name ?? null,
      last_name: input.last_name,
      position: input.position ?? null,
      company: input.company ?? null,
      email: input.email ?? null,
      phone: input.phone ?? null,
      website: input.website ?? null,
      address: input.address ?? null,
      photo_path: input.photo_path ?? null,
      is_favorite: input.is_favorite ?? false,
      note: input.note ?? null,
      created_by_profile_id: userId,
      deleted_at: null,
      updated_at: new Date().toISOString(),
    };
    const { error: upsertError } = await service.from("contacts").upsert(row, { onConflict: "id" });
    if (upsertError) return errorResponse("SYNC_FAILED", "Unable to save a contact.", 500);

    const { error: linkError } = await service.from("mobile_contact_sync_scope").upsert({ user_id: userId, device_id: deviceId, local_contact_id: localId, contact_id: contactId, updated_at: new Date().toISOString() }, { onConflict: "user_id,device_id,local_contact_id" });
    if (linkError) return errorResponse("SYNC_FAILED", "Unable to save the mobile sync scope.", 500);
  }

  const nextCursor = new Date().toISOString();
  let syncedContacts: unknown[] = [];
  try { syncedContacts = await pullScopedContacts(service, userId, deviceId, cursor); } catch { return errorResponse("SYNC_FAILED", "Unable to read synchronized contacts.", 500); }
  return reply({ data: { contacts: syncedContacts, conflicts }, meta: { next_cursor: nextCursor, request_time: nextCursor } });
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { ...headers, Allow: "POST, OPTIONS" } });
}
