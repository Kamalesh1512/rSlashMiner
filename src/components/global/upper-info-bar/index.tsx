"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import NotificationBell from "./notification-bell";
import { CreateAgentButton } from "@/components/agents/create-agent-button";

interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  subscriptionTier?: string;
}

interface UpperInfoBarProps {
  user?: User;
}

const UpperInfoBar = ({ user }: UpperInfoBarProps) => {
  const { isMobile } = useSidebar();
  const pathname = usePathname();
  // const { agents, setAgents, updateAgentById } = useAgentStore();

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-10">
      <div className="flex items-center justify-between gap-5">
        {!isMobile && <SidebarTrigger />}
        {/* <h1 className="text-xl font-semibold">{getPageTitle()}</h1> */}
      </div>

      <div className="flex items-center gap-4">
        <CreateAgentButton userId={user?.id!} />
        {/* <NotificationBell /> */}
      </div>
    </div>
  );
};

export default UpperInfoBar;
