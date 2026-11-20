# Cotople Portal

Next.js dashboard for Cotople's event contact-capture workflow.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dashboard uses demo records in `lib/data.ts` until Supabase API-backed queries are connected. Authentication uses Supabase Auth: configure the Supabase URL and anon key, enable Google as an OAuth provider, and set `ADMIN_EMAIL` and `ADMIN_USERNAME` in `.env.local` and in the production environment.

Create the admin account in Supabase Auth using the email in `ADMIN_EMAIL` and the chosen password. The username/password form maps the configured username to that Supabase account. The admin account is automatically enabled. New Google accounts are created as disabled users; approve or disable them from the admin-only **Settings** page at `/admin/users`. Disabled users are blocked at the route and database policy layers. Apply `supabase/schema.sql` for a new database, or `supabase/migrations/20261120030000_google_user_approval.sql` to upgrade an existing schema.

In Supabase Auth, enable Google and configure the Google OAuth client ID and secret. Add your local and production callback URLs to the provider's redirect allowlist: `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`. Configure the matching callback URL in the Google OAuth client. Never put the admin password, Google client secret, or Supabase service-role key in source control or any `NEXT_PUBLIC_` variable.
