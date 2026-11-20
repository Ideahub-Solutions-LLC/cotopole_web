"use client";

import { useActionState } from "react";
import { updateUserAccess, type AccessFormState } from "@/app/actions/access";
import styles from "./user-access-panel.module.css";

export type PortalUser = {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "staff";
  is_active: boolean;
  created_at: string;
  isAdmin: boolean;
};

const initialState: AccessFormState = {};

export default function UserAccessPanel({ users }: { users: PortalUser[] }) {
  const [state, action, pending] = useActionState(updateUserAccess, initialState);

  return (
    <section className={styles.panel} aria-labelledby="access-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>People</p>
          <h1 id="access-title">Account access</h1>
          <p>Google accounts stay disabled until you approve them here.</p>
        </div>
        <a className={styles.backLink} href="/">Back to dashboard</a>
      </div>

      {users.length === 0 ? (
        <p className={styles.empty}>No accounts found.</p>
      ) : (
        <div className={styles.userList}>
          {users.map((user) => {
            return (
              <article className={styles.userRow} key={user.id}>
                <div className={styles.avatar}>{user.display_name.slice(0, 1).toUpperCase()}</div>
                <div className={styles.identity}>
                  <strong>{user.display_name}</strong>
                  <span>{user.email}</span>
                </div>
                <span className={`${styles.status} ${user.is_active ? styles.enabled : styles.disabled}`}>
                  {user.isAdmin ? "Administrator" : user.is_active ? "Enabled" : "Disabled"}
                </span>
                {user.isAdmin ? (
                  <span className={styles.adminLabel}>Full access</span>
                ) : (
                  <form action={action} className={styles.actionForm}>
                    <input type="hidden" name="profileId" value={user.id} />
                    <input type="hidden" name="enabled" value={String(!user.is_active)} />
                    <button className={user.is_active ? styles.disableButton : styles.enableButton} type="submit" disabled={pending}>
                      {pending ? "Saving..." : user.is_active ? "Disable" : "Approve"}
                    </button>
                    {state.profileId === user.id && state.error && <small className={styles.error} role="alert">{state.error}</small>}
                    {state.profileId === user.id && state.success && <small className={styles.success} role="status">{state.success}</small>}
                  </form>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
