import { signOut } from "@/app/actions/auth";
import styles from "./page.module.css";

type AccessPendingProps = {
  searchParams: Promise<{ reason?: string }>;
};

export default async function AccessPending({ searchParams }: AccessPendingProps) {
  const { reason } = await searchParams;
  const verificationFailed = reason === "verify";

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.icon} aria-hidden="true">{verificationFailed ? "!" : "✓"}</div>
        <p className={styles.eyebrow}>Cotople workspace</p>
        <h1>{verificationFailed ? "Access could not be verified" : "Waiting for administrator approval"}</h1>
        <p>
          {verificationFailed
            ? "We couldn't check your account access right now. Please try again later or contact your administrator."
            : "Your Google account is signed in, but dashboard access is disabled until an administrator approves it."}
        </p>
        <form action={signOut}>
          <button type="submit">Sign out</button>
        </form>
      </section>
    </main>
  );
}
