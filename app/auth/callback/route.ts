import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const oauthError = request.nextUrl.searchParams.get("error");
  if (oauthError) {
    console.error("Google OAuth callback returned an error.", {
      error: oauthError,
      description: request.nextUrl.searchParams.get("error_description"),
    });
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL("/login?error=google", request.url));
  }

  return NextResponse.redirect(new URL("/", request.url));
}
