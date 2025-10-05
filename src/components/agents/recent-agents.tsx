"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
} from "@/components/ui/sidebar"
import { Bot } from "lucide-react"
import { Agent } from "@/lib/constants/types"

interface RecentAgentsProps {
  recentAgents: Agent[]
}

const RecentAgents = ({ recentAgents }: RecentAgentsProps) => {
  const pathname = usePathname()
  const displayAgents = recentAgents.slice(0, 5)

  return (
    <>
      <SidebarGroupLabel>Recent Agents</SidebarGroupLabel>
      <SidebarMenu>
        {displayAgents.map((agent) => {
          const isActive =
            pathname === `/agents/${agent.id}` ||
            pathname.startsWith(`/agents/${agent.id}/`)

          return (
            <SidebarMenuItem key={agent.id}>
              <SidebarMenuButton
                asChild
                isActive={isActive}
                tooltip={agent.name}
              >
                <Link href={`/agents/${agent.id}`}>
                  <Bot className="h-4 w-4" />
                  <span className="truncate">{agent.name}</span>
                </Link>
              </SidebarMenuButton>

              {/* Status badge using agent.color + notificationFrequency */}
              <SidebarMenuBadge>
                <span
                  className="h-3 w-3 rounded-full mr-1"
                  style={{ backgroundColor: agent.color }}
                />
                <span className="text-[10px] text-muted-foreground">
                  {agent.notificationFrequency}
                </span>
              </SidebarMenuBadge>
            </SidebarMenuItem>
          )
        })}

        {recentAgents.length > 5 && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/agents">
                <span className="text-xs text-muted-foreground">
                  View all agents
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </>
  )
}

export default RecentAgents
