export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main
      className="auth-brand-backdrop flex min-h-svh flex-1 flex-col"
      style={{
        background:
          "radial-gradient(100% 90% at 100% 0%, rgba(221, 228, 102, 0.75) 0%, transparent 55%), radial-gradient(90% 85% at 0% 100%, rgba(141, 195, 225, 0.7) 0%, transparent 58%), radial-gradient(70% 70% at 70% 80%, rgba(56, 83, 164, 0.28) 0%, transparent 60%), linear-gradient(150deg, #dceaf5 0%, #e8eef8 35%, #eef3d8 70%, #dfe9f4 100%)",
        backgroundColor: "#e8eef8",
      }}
    >
      {children}
    </main>
  );
}
