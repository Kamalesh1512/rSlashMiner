"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useSession } from "next-auth/react"
import { Loader2, Plus, Settings, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from "date-fns"
import { toast } from "sonner"
import { Agent } from "@/lib/constants/types"
import { useAgentStore } from "@/store/agentstore"


export default function AgentsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const {agents, setAgents} = useAgentStore()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }

    if (status === "authenticated") {
      fetchAgents()
    }
  }, [status, router])

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents")
      }
      console.log("server response",data)
      setAgents(data.agents)
      console.log("Client-side",agents)
    } catch (error) {
      toast.error("Error",{
        description: error instanceof Error ? error.message : "Failed to fetch agents",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col justify-center items-center">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Agents</h1>
            <p className="text-muted-foreground">Manage your Reddit monitoring agents and view their results.</p>
          </div>
        </div>

        {agents.length === 0 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle>No agents found</CardTitle>
              <CardDescription>You haven't created any Reddit monitoring agents yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-muted-foreground py-8">
                Create your first agent to start monitoring Reddit for potential customers.
              </p>
            </CardContent>
            <CardFooter className="flex justify-center">
              <Button asChild>
                <Link href="/agents/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Agent
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="truncate">{agent.name}</CardTitle>
                    <Badge variant={agent.isActive ? "premium" : "secondary"} className="text-primary">
                      {agent.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Monitoring</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.subreddits.slice(0, 3).map((sub) => (
                          <Badge key={sub.subredditName} variant="outline" className="text-xs">
                            r/{sub.subredditName}
                          </Badge>
                        ))}
                        {agent.subreddits.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.subreddits.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.keywords.slice(0, 3).map((kw) => (
                          <Badge key={kw.keyword} variant="outline" className="text-xs">
                            {kw.keyword}
                          </Badge>
                        ))}
                        {agent.keywords.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{agent.keywords.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-3 w-3" />
                        {agent.lastRunAt ? (
                          <span>Last run {formatDistanceToNow(new Date(agent.lastRunAt), { addSuffix: true })}</span>
                        ) : (
                          <span>Never run</span>
                        )}
                      </div>
                      <div>Runs: {agent.runCount}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 flex justify-between">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/agents/${agent.id}`}>View Agent</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}

