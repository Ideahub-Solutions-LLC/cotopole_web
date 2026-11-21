import "server-only";

import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServiceClient } from "@/lib/supabase/service";

export async function authenticateMobileRequest(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  const config = getSupabaseConfig();
  if (!match || !config) return null;

  const authClient = createClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const { data, error } = await authClient.auth.getUser(match[1]);
  if (error || !data.user) return null;
  return { accessToken: match[1], user: data.user };
}

export { createSupabaseServiceClient };
