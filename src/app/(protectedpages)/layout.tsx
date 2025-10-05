import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import ProtectedLayoutClient from "@/components/layout-client/protectedLayoutClient";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <SidebarProvider>
      <ProtectedLayoutClient user={session.user}>
        {children}
      </ProtectedLayoutClient>
    </SidebarProvider>
  );
}
