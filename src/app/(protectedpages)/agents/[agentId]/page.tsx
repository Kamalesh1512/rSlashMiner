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
import { Agent, agents } from "@/lib/constants/constants"



export default function AgentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [agent, setAgent] = useState<Agent | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const agentId = params.agentId as string

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      const foundAgent = agents.find((a) => a.id === agentId)
      setAgent(foundAgent || null)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [agentId])

  const toggleAgentStatus = () => {
    if (!agent) return

    setAgent({
      ...agent,
      isActive: !agent.isActive,
    })
  }

  const runAgentNow = () => {
    setIsRunning(true)

    // Simulate agent running
    setTimeout(() => {
      if (agent) {
        setAgent({
          ...agent,
          lastRunAt: new Date().toISOString(),
          runCount: agent.runCount + 1,
        })
      }
      setIsRunning(false)
    }, 3000)
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <Badge variant={agent.isActive ? "default" : "secondary"}>{agent.isActive ? "Active" : "Paused"}</Badge>
          </div>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/agents/${agent.id}/settings`}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={runAgentNow} disabled={isRunning || !agent.isActive}>
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
          <Button variant={agent.isActive ? "destructive" : "default"} size="sm" onClick={toggleAgentStatus}>
            {agent.isActive ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Resume
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
            <div className="text-2xl font-bold">{formatDate(agent.createdAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(agent.updatedAt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Run</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agent.lastRunAt ? formatDate(agent.lastRunAt) : "Never"}</div>
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
          <TabsTrigger value="settings">Configuration</TabsTrigger>
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
                    <div>2</div>
                    <div>14</div>
                    <div>{agent.runCount}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div>Matches Found</div>
                    <div>3</div>
                    <div>12</div>
                    <div>{agent.results.length}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div>High Relevance Matches</div>
                    <div>1</div>
                    <div>5</div>
                    <div>{agent.results.filter((r) => r.relevanceScore >= 90).length}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 p-4 items-center">
                    <div>Average Relevance</div>
                    <div>87%</div>
                    <div>82%</div>
                    <div>
                      {Math.round(
                        agent.results.reduce((acc, r) => acc + r.relevanceScore, 0) / (agent.results.length || 1),
                      )}
                      %
                    </div>
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
              {agent.results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-muted-foreground text-center mt-2">
                    This agent hasn't found any matches yet. Try adjusting your keywords or subreddits.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {agent.results.map((result) => (
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
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Basic Configuration</CardTitle>
                <CardDescription>General settings for this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Industry</h3>
                  <p>{agent.configuration.industry}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Relevance Threshold</h3>
                  <p>{agent.configuration.relevanceThreshold}%</p>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Agent Status</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="agent-status">{agent.isActive ? "Active" : "Paused"}</Label>
                    <Switch id="agent-status" checked={agent.isActive} onCheckedChange={toggleAgentStatus} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>How you'll be notified about new matches</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Notification Method</h3>
                  <p>
                    {agent.configuration.notificationMethod === "email" && "Email Only"}
                    {agent.configuration.notificationMethod === "whatsapp" && "WhatsApp Only"}
                    {agent.configuration.notificationMethod === "both" && "Email and WhatsApp"}
                  </p>
                  {(agent.configuration.notificationMethod === "whatsapp" ||
                    agent.configuration.notificationMethod === "both") &&
                    agent.configuration.whatsappNumber && (
                      <p className="text-sm text-muted-foreground mt-1">
                        WhatsApp Number: {agent.configuration.whatsappNumber}
                      </p>
                    )}
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-1">Notification Frequency</h3>
                  <p>
                    {agent.configuration.notificationFrequency === "realtime" && "Real-time (As Found)"}
                    {agent.configuration.notificationFrequency === "hourly" && "Hourly Digest"}
                    {agent.configuration.notificationFrequency === "daily" && "Daily Digest"}
                    {agent.configuration.notificationFrequency === "weekly" && "Weekly Digest"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>When this agent runs to check for new content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-1">Schedule Type</h3>
                  <p>
                    {agent.configuration.scheduleType === "always"
                      ? "Run continuously (as allowed by your subscription)"
                      : "Run on specific days/times"}
                  </p>
                </div>

                {agent.configuration.scheduleType === "specific" && (
                  <>
                    <div>
                      <h3 className="text-sm font-medium mb-1">Days</h3>
                      <div className="flex flex-wrap gap-2">
                        {agent.configuration.scheduleDays &&
                          Object.entries(agent.configuration.scheduleDays)
                            .filter(([_, isEnabled]) => isEnabled)
                            .map(([day]) => (
                              <Badge key={day} variant="outline">
                                {day.charAt(0).toUpperCase() + day.slice(1)}
                              </Badge>
                            ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-1">Time</h3>
                      <p>{agent.configuration.scheduleTime}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>Destructive actions for this agent</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Agent
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the agent "{agent.name}" and all of
                        its monitoring history.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAgent} className="bg-destructive text-destructive-foreground">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

