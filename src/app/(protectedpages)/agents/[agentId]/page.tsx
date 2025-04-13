"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Loader2, Settings, Play, Pause, RefreshCw, BarChart3, AlertCircle, Trash2 } from "lucide-react"
import Link from "next/link"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Agent } from "@/lib/constants/types"
import { useAgentStore } from "@/store/agentstore"
import { toast } from "sonner"
import { getRunsInLastNDays, timeAgo } from "@/lib/utils"
import { AgentConfigTab } from "./_components/agent-config-tab"



export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data:session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const agents = useAgentStore((state)=>state.agents)
  const [agent,setAgent] = useState<Agent | null>()
  const [isRunning, setIsRunning] = useState(false)

  const agentId = params.agentId as string
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      const foundAgent = agents.find((a) => a.id === agentId)
      // console.log("Found agent",foundAgent)
      setAgent(foundAgent || null)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [agentId,agents])

  const toggleAgentStatus = () => {
    if (!agent) return

    setAgent({
      ...agent,
      isActive: !agent.isActive,
    })
  }

  const runAgentNow = async () => {
    setIsRunning(true)

    const agentId = agent?.id

    try {
      const response = await fetch("/api/agents/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to run agent")
      }

      toast.success("Agent run completed",{
        description: `Found ${data.resultsCount} relevant results.`,
      })

          // Simulate agent running
    setTimeout(() => {
      if (agent) {
        setAgent({
          ...agent,
          lastRunAt: new Date(),
          runCount: agent.runCount + 1,
        })
      }
    }, 3000)
    } catch (error) {


      toast.error( "Agent run failed",{
        description: error instanceof Error ? error.message : "An unexpected error occurred",
      })
    } finally {
      setIsRunning(false)
    }

  }

  const deleteAgent = () => {
    // In a real app, this would call an API to delete the agent
    router.push("/agents")
  }

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The agent you're looking for doesn't exist or you don't have access to it.
        </p>
        <Button asChild>
          <Link href="/agents">Back to Agents</Link>
        </Button>
      </div>
    )
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const last24Days = getRunsInLastNDays(agent.lastRunAt,agent.runCount,1)
  const last7Days = getRunsInLastNDays(agent.lastRunAt,agent.runCount,7)
  const last30Days = getRunsInLastNDays(agent.lastRunAt,agent.runCount,30)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <Badge variant={agent.isActive ? "premium" : "outline"} className="text-primary">{agent.isActive ? "Active" : "Paused"}</Badge>
          </div>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="default" size="sm" onClick={runAgentNow} disabled={isRunning || !agent.isActive}>
            {isRunning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Now
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Created</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(new Date(agent.createdAt))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{timeAgo(agent.updatedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.lastRunAt ? timeAgo(agent.lastRunAt) : "Never"}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.runCount}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="settings">Configuration/Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monitored Subreddits</CardTitle>
                <CardDescription>Subreddits this agent is monitoring for relevant content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.subreddits.map((subreddit) => (
                    <Badge key={subreddit.id} variant="outline">
                      r/{subreddit.subredditName}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tracked Keywords</CardTitle>
                <CardDescription>Keywords and phrases this agent is looking for</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.keywords.map((keyword) => (
                    <Badge key={keyword.id} variant="outline">
                      {keyword.keyword}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>Summary of this agent's monitoring activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                    <div>Metric</div>
                    <div>Last 24 Hours</div>
                    <div>Last 7 Days</div>
                    <div>Last 30 Days</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div>Runs Completed</div>
                    <div>{last24Days}</div>
                    <div>{last7Days}</div>
                    <div>{last30Days}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div>Matches Found</div>
                    <div>3</div>
                    <div>12</div>
                    {agent.results && <div>{agent.results.length}</div>}
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div>High Relevance Matches</div>
                    <div>1</div>
                    <div>5</div>
                    {agent.results && <div>{agent.results.filter((r) => r.relevanceScore >= 90).length}</div>}
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center">
                    <div>Average Relevance</div>
                    <div>87%</div>
                    <div>82%</div>
                    {agent.results && 
                    <div>
                      {Math.round(
                        agent.results.reduce((acc, r) => acc + r.relevanceScore, 0) / (agent.results.length || 1),
                      )}
                      %
                    </div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>The most recent matches found by this agent</CardDescription>
            </CardHeader>
            <CardContent>
              {agent.results && agent.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-muted-foreground text-center mt-2">
                    This agent hasn't found any matches yet. Try adjusting your keywords or subreddits.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agent.results && agent.results.map((result) => (
                    <div key={result.id} className="rounded-lg border p-4">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span>r/{result.subreddit}</span>
                            <span>•</span>
                            <span>{result.timestamp}</span>
                            <span>•</span>
                            <span>{result.type === "post" ? "Post" : "Comment"}</span>
                          </div>

                          <h3 className="text-lg font-medium mb-2">{result.title}</h3>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <div
                            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                              result.relevanceScore >= 90
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : result.relevanceScore >= 70
                                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {result.relevanceScore}% Relevant
                          </div>

                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/results?id=${result.id}`}>View Details</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-center">
                    <Button asChild variant="outline">
                      <Link href={`/results?agent=${agent.id}`}>View All Results</Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>


        <TabsContent value="settings">
          <div className="">
            <AgentConfigTab agent={agent} subscription={session?.user.subscriptionTier as string}/>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

