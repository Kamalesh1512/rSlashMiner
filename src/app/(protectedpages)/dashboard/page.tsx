"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Loader2, Bot, BarChart3, TrendingUp, Users, AlertCircle } from "lucide-react"
import Link from "next/link"

// Define interfaces for our data types
interface RecentResult {
  id: string
  title: string
  subreddit: string
  timestamp: string
  content: string
  relevanceScore: number
  agentId: string
}

interface Agent {
  id: string
  name: string
  subredditCount: number
  status: "active" | "paused"
}

// Hardcoded data
const recentResults: RecentResult[] = [
  {
    id: "1",
    title: "Looking for a tool to analyze customer feedback",
    subreddit: "SaaS",
    timestamp: "2 hours ago",
    content:
      "I'm looking for a tool that can help me analyze customer feedback from multiple sources. Any recommendations?",
    relevanceScore: 92,
    agentId: "1",
  },
  {
    id: "2",
    title: "Need help finding a Reddit monitoring solution",
    subreddit: "marketing",
    timestamp: "5 hours ago",
    content:
      "Does anyone know of a good tool to monitor Reddit for mentions of my brand? I've been doing it manually but it's too time-consuming.",
    relevanceScore: 98,
    agentId: "2",
  },
  {
    id: "3",
    title: "Frustrated with current analytics options",
    subreddit: "startups",
    timestamp: "1 day ago",
    content:
      "I've tried several analytics tools but none of them give me the insights I need for my specific industry. Anyone else facing this problem?",
    relevanceScore: 75,
    agentId: "1",
  },
  {
    id: "4",
    title: "Best way to track competitor mentions?",
    subreddit: "EntrepreneurRideAlong",
    timestamp: "2 days ago",
    content:
      "What's the best way to track when competitors are mentioned on social media? Specifically interested in Reddit and Twitter.",
    relevanceScore: 88,
    agentId: "3",
  },
  {
    id: "5",
    title: "How to find early adopters for B2B SaaS?",
    subreddit: "SaaS",
    timestamp: "3 days ago",
    content:
      "I'm struggling to find early adopters for my B2B SaaS product. Has anyone had success finding them on Reddit or other platforms?",
    relevanceScore: 85,
    agentId: "1",
  },
]

const agents: Agent[] = [
  {
    id: "1",
    name: "SaaS Product Monitor",
    subredditCount: 5,
    status: "active",
  },
  {
    id: "2",
    name: "Competitor Tracker",
    subredditCount: 3,
    status: "active",
  },
  {
    id: "3",
    name: "Product Hunt Monitor",
    subredditCount: 7,
    status: "paused",
  },
]

export default function DashboardPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalResults: 0,
    potentialLeads: 0,
    monitoredSubreddits: 0,
  })

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        activeAgents: agents.filter((a) => a.status === "active").length,
        totalResults: recentResults.length,
        potentialLeads: recentResults.filter((r) => r.relevanceScore >= 80).length,
        monitoredSubreddits: agents.reduce((acc, agent) => acc + agent.subredditCount, 0),
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeAgents}</div>
            <p className="text-xs text-muted-foreground">Monitoring Reddit for opportunities</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResults}</div>
            <p className="text-xs text-muted-foreground">Matches found in the last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Potential Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.potentialLeads}</div>
            <p className="text-xs text-muted-foreground">High-relevance matches identified</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monitored Subreddits</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monitoredSubreddits}</div>
            <p className="text-xs text-muted-foreground">Active subreddit monitoring</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recent" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recent">Recent Results</TabsTrigger>
          <TabsTrigger value="agents">Your Agents</TabsTrigger>
        </TabsList>
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Results</CardTitle>
              <CardDescription>Your most recent matches from Reddit monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Iterate through recent results */}
              {recentResults.slice(0, 3).map((result) => (
                <div key={result.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">r/{result.subreddit}</span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">{result.timestamp}</span>
                      </div>
                      <p className="mt-2 text-sm">"{result.content}"</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          result.relevanceScore >= 90
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : result.relevanceScore >= 70
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {result.relevanceScore}% Relevant
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/results">View All Results</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Your Agents</CardTitle>
              <CardDescription>Status and performance of your Reddit monitoring agents</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Iterate through agents */}
              {agents.map((agent) => (
                <div key={agent.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{agent.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Monitoring {agent.subredditCount} subreddit{agent.subredditCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            agent.status === "active" ? "bg-green-500" : "bg-amber-500"
                          }`}
                        ></div>
                        <span className="text-sm">{agent.status === "active" ? "Active" : "Paused"}</span>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/agents/${agent.id}`}>View</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href="/agents">Manage Agents</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Subscription status card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current plan and usage limits</CardDescription>
          </div>
          <Button asChild>
            <Link href="/settings/subscription">Upgrade</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Current Plan:</span>
              </div>
              <div className="font-medium">Free Tier</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Agent Creation:</span>
              </div>
              <div className="font-medium">3 of 1 used</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Monitoring Requests:</span>
              </div>
              <div className="font-medium">78 of 100 used</div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span>Resets In:</span>
              </div>
              <div className="font-medium">2 days</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

