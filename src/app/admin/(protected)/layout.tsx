import { AdminShell } from "@/components/layout/admin-shell";
import { getCurrentAdmin } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  return <AdminShell admin={admin}>{children}</AdminShell>;
}
