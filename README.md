# Cotople Portal

Next.js dashboard for Cotople's event contact-capture workflow.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dashboard uses demo records in `lib/data.ts` until Supabase API-backed queries are connected. Authentication uses Supabase Auth: configure the Supabase URL and anon key, set `NEXT_PUBLIC_SITE_URL` to the public HTTPS origin of this Worker, enable Google as an OAuth provider, and set `ADMIN_EMAIL` and `ADMIN_USERNAME` in `.env.local` and in the production environment.

Create the admin account in Supabase Auth using the email in `ADMIN_EMAIL` and the chosen password. The username/password form maps the configured username to that Supabase account. The admin account is automatically enabled. New Google accounts are created as disabled users; approve or disable them from the admin-only **Settings** page at `/admin/users`. Disabled users are blocked at the route and database policy layers. Apply `supabase/schema.sql` for a new database, or `supabase/migrations/20261120030000_google_user_approval.sql` to upgrade an existing schema.

In Supabase Auth, enable Google and configure the Google OAuth client ID and secret. Add your local and production callback URLs to Supabase Auth's redirect URL allowlist: `http://localhost:3000/auth/callback` and `https://<your-domain>/auth/callback`. In the Google Cloud OAuth client, add the Supabase callback URL shown in the Supabase Google provider settings (normally `https://<project-ref>.supabase.co/auth/v1/callback`) as an Authorized redirect URI; do not add the app callback URL there. Never put the admin password, Google client secret, or Supabase service-role key in source control or any `NEXT_PUBLIC_` variable.

### Cloudflare Worker configuration

Set these values on the deployed Worker before testing Google sign-in. Run each command from the repository root; Wrangler prompts for the value and does not print it afterward:

```bash
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL --name cotopole-web
npx wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY --name cotopole-web
npx wrangler secret put NEXT_PUBLIC_SITE_URL --name cotopole-web
npx wrangler secret put ADMIN_EMAIL --name cotopole-web
npx wrangler secret put ADMIN_USERNAME --name cotopole-web
```

Use the same public origin for `NEXT_PUBLIC_SITE_URL` that users visit, for example `https://portal.example.com`, without a trailing path. After setting the values, redeploy the Worker. In the Cloudflare dashboard these are under **Workers & Pages → cotopole-web → Settings → Variables and Secrets**. The Supabase project URL and anon key must be available at Worker runtime; putting them only in `.env.local` does not configure Cloudflare.
