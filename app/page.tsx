import { redirect } from "next/navigation";
import Dashboard from "@/components/dashboard";
import { isAdminEmail } from "@/lib/auth";
import { createReadOnlySupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createReadOnlySupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;

  if (error || !claims || !email) {
    redirect("/login");
  }

  const isAdmin = isAdminEmail(email);
  if (!isAdmin) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", claims.sub)
      .maybeSingle();

    if (profileError) {
      console.error("Could not verify portal user approval.", profileError);
      redirect("/access-pending?reason=verify");
    }

    if (!profile?.is_active) {
      redirect("/access-pending");
    }
  }

  const metadata = claims.user_metadata;
  const metadataName =
    metadata &&
    typeof metadata === "object" &&
    "full_name" in metadata &&
    typeof metadata.full_name === "string"
      ? metadata.full_name
      : email.split("@")[0];
  const displayName = isAdminEmail(email) ? "Workspace admin" : metadataName;

  return <Dashboard userEmail={email} userName={displayName} isAdmin={isAdmin} />;
}
