import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { createReadOnlySupabaseServerClient } from "@/lib/supabase/server";
import UserAccessPanel, { type PortalUser } from "@/components/user-access-panel";
import styles from "@/components/user-access-panel.module.css";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createReadOnlySupabaseServerClient();
  const { data: authData, error: authError } = await supabase.auth.getClaims();
  const email = typeof authData?.claims?.email === "string" ? authData.claims.email : null;

  if (authError || !email) {
    redirect("/login");
  }

  if (!isAdminEmail(email)) {
    redirect("/");
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_active, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Could not load portal accounts.", error);
    throw new Error("Unable to load account access settings.");
  }

  const users: PortalUser[] = data.map((profile) => ({
    id: profile.id,
    email: profile.email,
    display_name: profile.display_name,
    role: profile.role,
    is_active: profile.is_active,
    created_at: profile.created_at,
    isAdmin: isAdminEmail(profile.email),
  }));

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <a href="/">Cotople</a>
          <p>Workspace administration</p>
        </div>
        <span>Admin</span>
      </header>
      <UserAccessPanel users={users} />
    </main>
  );
}
