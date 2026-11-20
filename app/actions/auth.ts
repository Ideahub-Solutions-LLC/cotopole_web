"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminEmail } from "@/lib/auth";
import { getSiteUrl, getSupabaseConfig } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type AuthFormState = {
  error?: string;
};

export async function signInWithPassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const config = getSupabaseConfig();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const expectedUsername = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
  const username = formData.get("username");
  const password = formData.get("password");

  if (!config || !adminEmail) {
    return { error: "Admin sign-in is not configured. Contact your workspace administrator." };
  }

  if (
    typeof username !== "string" ||
    username.trim().toLowerCase() !== expectedUsername ||
    typeof password !== "string" ||
    !password
  ) {
    return { error: "The username or password is incorrect." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: adminEmail,
    password,
  });

  if (error || !isAdminEmail(data.user?.email)) {
    return { error: "The username or password is incorrect." };
  }

  redirect("/");
}

export async function signInWithGoogle(
  _previousState: AuthFormState,
  _formData: FormData,
): Promise<AuthFormState> {
  const config = getSupabaseConfig();
  if (!config) {
    return { error: "Google sign-in is not configured yet. Contact your workspace administrator." };
  }

  const requestHeaders = await headers();
  const configuredSiteUrl = getSiteUrl();
  const forwardedHost = requestHeaders.get("x-forwarded-host")?.split(",")[0]?.trim();
  const forwardedProto = requestHeaders.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestHost = forwardedHost ?? requestHeaders.get("host");
  const requestOrigin = requestHeaders.get("origin");

  if (!configuredSiteUrl && !requestOrigin && !requestHost) {
    return { error: "Unable to start Google sign-in. Please try again." };
  }

  let originUrl: URL;
  try {
    originUrl = configuredSiteUrl
      ? new URL(configuredSiteUrl)
      : requestOrigin
        ? new URL(requestOrigin)
        : new URL(`${forwardedProto ?? "https"}://${requestHost}`);
  } catch {
    return { error: "Unable to start Google sign-in. Please try again." };
  }

  if (!configuredSiteUrl && requestHost && originUrl.host.toLowerCase() !== requestHost.toLowerCase()) {
    return { error: "Unable to start Google sign-in. Please try again." };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: new URL("/auth/callback", originUrl).toString(),
      queryParams: { prompt: "select_account" },
    },
  });

  if (error || !data.url) {
    return { error: "Google sign-in could not be started. Please try again." };
  }

  redirect(data.url);
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }

  redirect("/login");
}
