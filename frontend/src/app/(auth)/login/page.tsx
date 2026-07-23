import { LoginAuthClient } from "@/components/platform/auth/login/LoginAuthClient";

type LoginPageProps = {
  searchParams: Promise<{ registered?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialMessage =
    params.registered === "1"
      ? "Your account was created successfully. Please log in to continue."
      : undefined;

  return <LoginAuthClient initialMessage={initialMessage} />;
}
