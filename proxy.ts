import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail } from "./lib/auth";
import { getSupabaseConfig } from "./lib/supabase/config";

function copyAuthResponse(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }

  return target;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = pathname === "/login" || pathname === "/auth/callback";
  const config = getSupabaseConfig();

  if (!config) {
    if (isPublicRoute) return NextResponse.next({ request });

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("setup", "1");
    return NextResponse.redirect(loginUrl);
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const email = typeof claims?.email === "string" ? claims.email : null;
  const userId = typeof claims?.sub === "string" ? claims.sub : null;

  if (error || !email || !userId) {
    if (isPublicRoute) return response;

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return copyAuthResponse(response, NextResponse.redirect(loginUrl));
  }

  const isAdmin = isAdminEmail(email);
  if (!isAdmin) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_active")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.error("Could not verify portal user approval.", profileError);
      if (pathname === "/access-pending") return response;

      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/access-pending";
      pendingUrl.search = "?reason=verify";
      return copyAuthResponse(response, NextResponse.redirect(pendingUrl));
    }

    if (!profile?.is_active) {
      if (pathname === "/access-pending") return response;

      const pendingUrl = request.nextUrl.clone();
      pendingUrl.pathname = "/access-pending";
      pendingUrl.search = "";
      return copyAuthResponse(response, NextResponse.redirect(pendingUrl));
    }
  }

  if (pathname === "/access-pending" || pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/";
    dashboardUrl.search = "";
    return copyAuthResponse(response, NextResponse.redirect(dashboardUrl));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
