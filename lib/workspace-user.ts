import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { createReadOnlySupabaseServerClient } from "@/lib/supabase/server";

export async function getWorkspaceUser() {
  const supabase = await createReadOnlySupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;

  if (error || !claims || !email) redirect("/login");

  const isAdmin = isAdminEmail(email);
  if (!isAdmin) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", claims.sub)
      .maybeSingle();

    if (profileError || !profile?.is_active) redirect(profileError ? "/access-pending?reason=verify" : "/access-pending");
  }

  const metadata = claims.user_metadata;
  const userName = metadata && typeof metadata === "object" && "full_name" in metadata && typeof metadata.full_name === "string"
    ? metadata.full_name
    : email.split("@")[0];

  return { userEmail: email, userName: isAdmin ? "Workspace admin" : userName, isAdmin };
}
