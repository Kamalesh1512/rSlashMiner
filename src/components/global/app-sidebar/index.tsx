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
import { Hash, Slash } from "lucide-react";
import NavMain from "./nav-main";
import NavFooter from "./nav-footer";
import RecentAgents from "./recent-agents";

interface Agent {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastRunAt: string | null;
  runCount: number;
}

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionTier?: string;
}

interface AppSidebarProps {
  recentAgents?: Agent[];
  user?: User;
}

const AppSidebar = ({
  recentAgents = [],
  user,
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) => {
  return (
    <Sidebar
      collapsible="icon"
      className="max-w-[275px] bg-background border-r"
      {...props}
    >
      <SidebarHeader className="pt-6 px-2 pb-0">
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:text-sidebar-accent-foreground gap-5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-500 text-black">
            <Slash className="h-5 w-5" />
          </div>
          <span className="truncate text-xl font-semibold">
            rSlashMiner
            <span className="text-xs block text-muted-foreground">
              
            </span>
          </span>
        </SidebarMenuButton>
      </SidebarHeader>

      <SidebarContent className="px-2 mt-6 gap-y-6">
        <SidebarGroup>
          <NavMain />
        </SidebarGroup>

        {recentAgents.length > 0 && (
          <SidebarGroup>
            <RecentAgents recentAgents={recentAgents} />
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavFooter user={user} />
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
