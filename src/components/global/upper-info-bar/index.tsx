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

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === "/dashboard") return "Dashboard";
    if (pathname === "/agents") return "Agents";
    if (pathname.startsWith("/agents/") && pathname.includes("/results"))
      return "Agent Results";
    if (pathname.startsWith("/agents/") && pathname.includes("/settings"))
      return "Agent Settings";
    if (pathname.startsWith("/agents/") && pathname.includes("/create"))
      return "Create Agent";
    if (pathname.startsWith("/agents/")) return "Agent Details";
    if (pathname === "/results") return "All Results";
    if (pathname === "/monitoring") return "Monitoring";
    if (pathname === "/notifications") return "Notifications";
    if (pathname === "/settings") return "Settings";
    if (pathname === "/settings/profile") return "Profile Settings";
    if (pathname === "/settings/subscription") return "Subscription Settings";
    if (pathname === "/settings/security") return "Security Settings";
    if (pathname === "/help") return "Help & Support";
    return "rSlashMiner";
  };

  return (
    <div className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-10">
      <div className="flex items-center justify-between gap-5">
        {!isMobile && <SidebarTrigger />}
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative w-64 hidden md:block">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search..." className="pl-8" />
        </div>

        {pathname === "/agents" && (
          <Button asChild>
            <Link href="/agents/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Agent
            </Link>
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-[300px] overflow-auto">
              <DropdownMenuItem className="flex flex-col items-start cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">New match found</span>
                  <Badge variant="outline" className="text-xs">
                    5m ago
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your agent "SaaS Monitor" found a new potential customer in
                  r/startups
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Agent completed run</span>
                  <Badge variant="outline" className="text-xs">
                    1h ago
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  "Product Hunt Monitor" completed its scheduled run with 2 new
                  matches
                </p>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex flex-col items-start cursor-pointer">
                <div className="flex items-center justify-between w-full">
                  <span className="font-medium">Weekly report available</span>
                  <Badge variant="outline" className="text-xs">
                    1d ago
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Your weekly monitoring report is now available to view
                </p>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/notifications"
                className="justify-center text-center"
              >
                View all notifications
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default UpperInfoBar;
