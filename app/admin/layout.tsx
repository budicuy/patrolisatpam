import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminLayoutShell } from "./_components/admin-layout-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <AdminLayoutShell user={session.user}>{children}</AdminLayoutShell>;
}
