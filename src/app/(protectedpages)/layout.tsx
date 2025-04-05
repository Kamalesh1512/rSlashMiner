
import AppSidebar from "@/components/global/app-sidebar";
import UpperInfoBar from "@/components/global/upper-info-bar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import React from "react";

const ProtectedLayout = async ({ children }: { children: React.ReactNode }) => {

const session = await auth()
  if (!session?.user) {
    redirect("/login");
  }
  const recentAgents = []
  return(
  <SidebarProvider>
    <AppSidebar
      user={session.user}
      recentAgents={ []}
    />
    <SidebarInset>
        <SidebarTrigger/>
        <UpperInfoBar/>
      <div className="p-4">{children}</div>
    </SidebarInset>

  </SidebarProvider>)
};

export default ProtectedLayout;
