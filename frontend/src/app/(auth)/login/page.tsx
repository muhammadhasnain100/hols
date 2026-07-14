import { Suspense } from "react";
import { AuthShell } from "@/components/platform/auth/AuthShell";
import { LoginForm } from "@/components/platform/auth/login";

type LoginPageProps = {
  searchParams: Promise<{ registered?: string }>;
};

function LoginFormFallback() {
  return (
    <div className="rounded-[1.75rem] border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(21,39,68,0.12)] backdrop-blur-xl md:p-8">
      <div className="h-56 animate-pulse rounded-2xl bg-primary/5" />
    </div>
  );
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMessage =
    params.registered === "1"
      ? "Your account was created successfully. Please log in to continue."
      : undefined;

  return (
    <AuthShell
      eyebrow="Sign in"
      title="Welcome back"
    >
      <Suspense fallback={<LoginFormFallback />}>
        <LoginForm initialMessage={initialMessage} />
      </Suspense>
    </AuthShell>
  );
}
