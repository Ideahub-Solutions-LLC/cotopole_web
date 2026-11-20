"use client";

import { useActionState } from "react";
import { signInWithGoogle, signInWithPassword, type AuthFormState } from "@/app/actions/auth";
import styles from "./login-page.module.css";

type LoginPageProps = {
  initialMessage?: string;
};

const initialState: AuthFormState = {};

function GoogleMark() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z" transform="translate(0 5)" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.44-4.1 7.14-10.14 7.14-17.56Z" />
      <path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z" transform="translate(0 5)" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.62-5.91c-2.12 1.42-4.84 2.26-8.28 2.26-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z" transform="translate(0 -5)" />
    </svg>
  );
}

export default function LoginPage({ initialMessage }: LoginPageProps) {
  const [passwordState, passwordAction, passwordPending] = useActionState(
    signInWithPassword,
    initialState,
  );
  const [googleState, googleAction, googlePending] = useActionState(
    signInWithGoogle,
    initialState,
  );
  const message = passwordState.error ?? googleState.error ?? initialMessage;

  return (
    <main className={styles.page}>
      <section className={styles.brandPanel} aria-label="Cotople introduction">
        <a className={styles.brand} href="/" aria-label="Cotople home">
          <img src="/cotople-logo.webp" alt="Cotople" />
        </a>

        <div className={styles.brandCopy}>
          <span className={styles.kicker}>Event contact intelligence</span>
          <h1>Make every introduction count.</h1>
          <p>Keep your event contacts, conversations, and next steps moving together.</p>
        </div>

        <div className={styles.productScene} aria-hidden="true">
          <div className={`${styles.productCard} ${styles.captureCard}`}>
            <div className={styles.cardEyebrow}><span /> Live event</div>
            <strong>Future of Work Summit</strong>
            <div className={styles.captureStats}><span><b>86</b> contacts</span><span className={styles.captureDelta}>+24 today</span></div>
            <div className={styles.progress}><i /></div>
            <div className={styles.progressCaption}><span>Event progress</span><b>72%</b></div>
          </div>
          <div className={`${styles.productCard} ${styles.contactCard}`}>
            <div className={styles.contactAvatar}>MC</div>
            <div className={styles.contactInfo}><strong>Maya Chen</strong><span>Partnerships · Northstar Labs</span></div>
            <span className={styles.hotBadge}>Hot lead</span>
          </div>
          <div className={`${styles.productCard} ${styles.insightCard}`}>
            <span className={styles.insightIcon}>✦</span>
            <span><b>Follow-up ready</b><small>18 conversations to revisit</small></span>
          </div>
          <div className={styles.sceneGlow} />
        </div>

        <blockquote className={styles.quote}>
          <p>“The most valuable thing you bring home from an event is the conversation.”</p>
          <footer><span className={styles.quoteMark}>C</span><span><b>The Cotople team</b><small>Our approach to every connection</small></span></footer>
        </blockquote>
      </section>

      <section className={styles.formPanel} aria-labelledby="login-title">
        <div className={styles.formWrap}>
          <div className={styles.mobileBrand}><img src="/cotople-logo.webp" alt="Cotople" /></div>
          <span className={styles.formKicker}>Your workspace awaits</span>
          <h2 id="login-title">Welcome back</h2>
          <p className={styles.formIntro}>Sign in to pick up where your team left off.</p>

          {message && <p className={styles.errorMessage} role="alert">{message}</p>}

          <form action={passwordAction} className={styles.credentialsForm}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" placeholder="admin" required />
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Enter your password" required />
            <button type="submit" className={styles.submitButton} disabled={passwordPending}>
              {passwordPending ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className={styles.divider}><span>or continue with</span></div>

          <form action={googleAction}>
            <button type="submit" className={styles.googleButton} disabled={googlePending}>
              <GoogleMark />
              {googlePending ? "Connecting to Google..." : "Sign in with Google"}
            </button>
          </form>

          <p className={styles.accessNote}>Google accounts have user access. Admin access is reserved for the workspace administrator.</p>
          <p className={styles.securityNote}><span className={styles.securityDot} /> Secure access to your Cotople workspace</p>
        </div>
        <footer className={styles.formFooter}>© 2026 Cotople <span>·</span> Built for better follow-up</footer>
      </section>
    </main>
  );
}
