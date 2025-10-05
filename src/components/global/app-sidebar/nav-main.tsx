"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Plus } from "lucide-react";
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuBadge,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { navItems, Agent } from "@/lib/constants/types";
import { useEffect, useState } from "react";

interface NavMainProps {
  agents?: Agent[];
  loading?: boolean;
}

const NavMain = ({ agents = [ ], loading = false }: NavMainProps) => {
  const pathname = usePathname();
  const [agentsOpen, setAgentsOpen] = useState(false);

  useEffect(() => {
    if (pathname) {
      setAgentsOpen(pathname === "/agents" || pathname.startsWith("/agents/"));
    }
  }, [pathname]);

  const hasAgents = agents.length > 0;

  return (
    <>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        {navItems.map((item) => {
          if (item.name === "Agents") {
            return (
              <Collapsible
                key={item.name}
                asChild
                open={agentsOpen}
                onOpenChange={setAgentsOpen}
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      className="data-[state=open]:bg-sidebar-accent/50 w-full justify-between"
                      tooltip={item.name}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-4 w-4 flex-shrink-0 mr-2" />
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {loading ? (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="cursor-default text-muted-foreground">
                            <span className="text-xs">Loading...</span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ) : hasAgents ? (
                        agents.map((agent) => {
                          const isAgentActive =
                            pathname === `/agents/${agent.id}` ||
                            pathname.startsWith(`/agents/${agent.id}/`);
                          return (
                            <SidebarMenuSubItem key={agent.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={isAgentActive}
                              >
                                <Link
                                  href={`/agents/${agent.id}`}
                                  className="flex items-center w-full"
                                >
                                  <span
                                    className="h-2 w-2 rounded-full mr-2 flex-shrink-0"
                                    style={{ backgroundColor: agent.color! }}
                                  />
                                  <span className="truncate flex-1 text-sm">
                                    {agent.name}
                                  </span>
                                  <SidebarMenuBadge className="ml-2">
                                    <span className="text-[9px] text-muted-foreground">
                                      {agent.notificationFrequency}
                                    </span>
                                  </SidebarMenuBadge>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })
                      ) : (
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton className="cursor-default text-muted-foreground">
                            <span className="text-xs">
                              No agents created yet
                            </span>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      )}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={item.name}
              >
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </>
  );
};

export default NavMain;
