# Cotople Portal

Next.js dashboard for Cotople's event contact-capture workflow.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The dashboard uses demo records in `lib/data.ts` until Supabase credentials and API-backed queries are connected. Add the public Supabase URL and anon key to `.env.local` when the project is ready for live data.

The Supabase-ready schema is in `supabase/schema.sql`. It keeps contacts global and attaches each mobile capture to an event through `event_occurrences`, matching the existing Cotople system documentation.
