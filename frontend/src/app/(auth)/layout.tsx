export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-brand-backdrop fixed inset-0 flex min-h-0 flex-col overflow-hidden">
      {children}
    </main>
  );
}
