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
import { Bot, CheckCircle2, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Agent {
  id: string
  name: string
  description: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastRunAt: string | null
  runCount: number
}

interface RecentAgentsProps {
  recentAgents: Agent[]
}

const RecentAgents = ({ recentAgents }: RecentAgentsProps) => {
  const pathname = usePathname()

  // Only show the 5 most recent agents
  const displayAgents = recentAgents.slice(0, 5)

  return (
    <>
      <SidebarGroupLabel>Recent Agents</SidebarGroupLabel>
      <SidebarMenu>
        {displayAgents.map((agent) => {
          const isActive = pathname === `/agents/${agent.id}` || pathname.startsWith(`/agents/${agent.id}/`)
          const lastRun = agent.lastRunAt
            ? formatDistanceToNow(new Date(agent.lastRunAt), { addSuffix: true })
            : "Never run"

          return (
            <SidebarMenuItem key={agent.id}>
              <SidebarMenuButton asChild isActive={isActive} tooltip={agent.name}>
                <Link href={`/agents/${agent.id}`}>
                  <Bot className="h-4 w-4" />
                  <span className="truncate">{agent.name}</span>
                </Link>
              </SidebarMenuButton>

              {agent.isActive ? (
                <SidebarMenuBadge>
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                </SidebarMenuBadge>
              ) : (
                <SidebarMenuBadge>
                  <AlertCircle className="h-3 w-3 text-amber-500" />
                </SidebarMenuBadge>
              )}
            </SidebarMenuItem>
          )
        })}

        {recentAgents.length > 5 && (
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/agents">
                <span className="text-xs text-muted-foreground">View all agents</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </>
  )
}

export default RecentAgents

