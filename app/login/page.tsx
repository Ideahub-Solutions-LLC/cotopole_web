import LoginPage from "@/components/login-page";

type LoginPageProps = {
  searchParams: Promise<{ error?: string; setup?: string }>;
};

export default async function Login({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMessage = params.setup
    ? "Authentication is not configured yet. Add the Supabase and admin settings to continue."
    : params.error === "google"
      ? "Google sign-in did not complete. Please try again."
      : undefined;

  return <LoginPage initialMessage={initialMessage} />;
}
