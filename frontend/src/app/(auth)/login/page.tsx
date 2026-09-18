import { redirect } from "next/navigation";
import { LoginAuthClient } from "@/components/platform/auth/login/LoginAuthClient";
import { getLoginPath, parseLoginRole } from "@/lib/integrate/auth/routes";

type LoginPageProps = {
  searchParams: Promise<{ registered?: string; role?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const role = parseLoginRole(params.role);

  if (role !== "student") {
    const next = new URLSearchParams();
    if (params.registered === "1") next.set("registered", "1");
    const query = next.toString();
    redirect(query ? `${getLoginPath(role)}?${query}` : getLoginPath(role));
  }

  const initialMessage =
    params.registered === "1"
      ? "Your account was created successfully. Please log in to continue."
      : undefined;

  return <LoginAuthClient role="student" initialMessage={initialMessage} />;
}
