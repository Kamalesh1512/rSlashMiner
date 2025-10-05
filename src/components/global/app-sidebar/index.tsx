"use client";

import type React from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { Slash } from "lucide-react";
import NavMain from "./nav-main";
import NavFooter from "./nav-footer";
import { Agent } from "@/lib/constants/types";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionTier?: string | null;
  subscriptionExpiresAt?: Date | null;
}

interface AppSidebarProps {
  recentAgents?: Agent[];
  user?: User;
  loading?:boolean
}

const AppSidebar = ({
  recentAgents = [], 
  user,
  loading,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar
      collapsible="icon"
      className="max-w-[275px] min-w-[60px] bg-background border-r"
      {...props}
    >
      <SidebarHeader className="pt-6 px-2 pb-0">
        <SidebarMenuButton
          size={"lg"}
          className="data-[state=open]:text-sidebar-accent-foreground gap-5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-black shrink-0">
            <Slash />
          </div>
          <span className="truncate text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
            Skroub
            <span className="text-xs block text-muted-foreground"></span>
          </span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-6 gap-y-6">
        <SidebarGroup>
          <NavMain agents={recentAgents} loading={loading} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavFooter user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
