"use server";

import { revalidatePath } from "next/cache";
import { isAdminEmail } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AccessFormState = {
  profileId?: string;
  error?: string;
  success?: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateUserAccess(
  _previousState: AccessFormState,
  formData: FormData,
): Promise<AccessFormState> {
  const profileId = formData.get("profileId");
  const enabled = formData.get("enabled");

  if (typeof profileId !== "string" || !uuidPattern.test(profileId) || (enabled !== "true" && enabled !== "false")) {
    return { error: "The access request is invalid." };
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const actorEmail = typeof authData?.claims?.email === "string" ? authData.claims.email : null;

  if (authError || !isAdminEmail(actorEmail)) {
    return { profileId, error: "Only the administrator can change account access." };
  }

  const { data: target, error: targetError } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", profileId)
    .maybeSingle();

  if (targetError) {
    console.error("Could not load the target portal account.", targetError);
    return { profileId, error: "Could not verify this account. Please try again." };
  }

  if (!target) {
    return { profileId, error: "This account was not found." };
  }

  if (isAdminEmail(target.email)) {
    return { profileId, error: "Administrator access cannot be changed here." };
  }

  const { data: updated, error: updateError } = await supabase
    .from("profiles")
    .update({ is_active: enabled === "true" })
    .eq("id", profileId)
    .select("id")
    .maybeSingle();

  if (updateError) {
    console.error("Could not update portal user access.", updateError);
    return { profileId, error: "Could not update access. Please try again." };
  }

  if (!updated) {
    return { profileId, error: "This account could not be updated." };
  }

  revalidatePath("/admin/users");
  revalidatePath("/");
  return { profileId, success: enabled === "true" ? "Account approved." : "Account disabled." };
}
