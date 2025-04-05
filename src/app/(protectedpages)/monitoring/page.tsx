"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Loader2, Search, Plus, RefreshCw, AlertCircle, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

// Define interfaces for our data types
interface Subreddit {
  id: string
  name: string
  subscribers: number
  lastMonitored: string
  status: "active" | "paused" | "error"
  agentCount: number
  description: string
}

// Hardcoded data
const subreddits: Subreddit[] = [
  {
    id: "1",
    name: "SaaS",
    subscribers: 45000,
    lastMonitored: "10 minutes ago",
    status: "active",
    agentCount: 2,
    description:
      "A community for SaaS founders, developers, and enthusiasts to discuss Software as a Service businesses.",
  },
  {
    id: "2",
    name: "startups",
    subscribers: 1200000,
    lastMonitored: "15 minutes ago",
    status: "active",
    agentCount: 1,
    description: "r/startups is the place to discuss startup problems and solutions.",
  },
  {
    id: "3",
    name: "marketing",
    subscribers: 350000,
    lastMonitored: "20 minutes ago",
    status: "active",
    agentCount: 1,
    description: "For marketing professionals to discuss and ask questions related to the marketing industry.",
  },
  {
    id: "4",
    name: "EntrepreneurRideAlong",
    subscribers: 180000,
    lastMonitored: "25 minutes ago",
    status: "active",
    agentCount: 1,
    description: "A place to share progress, ask questions, and learn about starting your own business.",
  },
  {
    id: "5",
    name: "ProductHunt",
    subscribers: 75000,
    lastMonitored: "30 minutes ago",
    status: "paused",
    agentCount: 1,
    description: "A community for Product Hunt users and makers to discuss products and share feedback.",
  },
  {
    id: "6",
    name: "datascience",
    subscribers: 520000,
    lastMonitored: "1 hour ago",
    status: "active",
    agentCount: 1,
    description: "A place for data science practitioners and professionals to discuss and ask questions.",
  },
  {
    id: "7",
    name: "CustomerSuccess",
    subscribers: 42000,
    lastMonitored: "2 hours ago",
    status: "error",
    agentCount: 1,
    description: "A community for customer success professionals to share best practices and ask questions.",
  },
  {
    id: "8",
    name: "socialmedia",
    subscribers: 230000,
    lastMonitored: "3 hours ago",
    status: "active",
    agentCount: 1,
    description: "A place to discuss social media marketing, management, and strategy.",
  },
]

export default function MonitoringPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [filteredSubreddits, setFilteredSubreddits] = useState<Subreddit[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setFilteredSubreddits(subreddits)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter subreddits based on search query and status filter
    let filtered = [...subreddits]

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (subreddit) =>
          subreddit.name.toLowerCase().includes(query) || subreddit.description.toLowerCase().includes(query),
      )
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((subreddit) => subreddit.status === statusFilter)
    }

    setFilteredSubreddits(filtered)
  }, [searchQuery, statusFilter])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Subreddit Monitoring</h1>
          <p className="text-muted-foreground">Manage and monitor the subreddits your agents are tracking</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh All
          </Button>
          <Button size="sm" asChild>
            <Link href="/agents/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Subreddit
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Subreddits</CardTitle>
          <CardDescription>Search and filter the subreddits you're monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search subreddits..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">
            Showing {filteredSubreddits.length} of {subreddits.length} subreddits
          </p>
        </div>

        <TabsContent value="grid">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredSubreddits.map((subreddit) => (
              <Card key={subreddit.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">r/{subreddit.name}</CardTitle>
                    <div
                      className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                        subreddit.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : subreddit.status === "paused"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}
                    >
                      {subreddit.status === "active" && <CheckCircle className="h-3 w-3" />}
                      {subreddit.status === "paused" && <Clock className="h-3 w-3" />}
                      {subreddit.status === "error" && <AlertCircle className="h-3 w-3" />}
                      <span className="capitalize">{subreddit.status}</span>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">{subreddit.description}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">Subscribers</p>
                      <p className="font-medium">{subreddit.subscribers.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Used in</p>
                      <p className="font-medium">
                        {subreddit.agentCount} agent{subreddit.agentCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Last monitored</p>
                      <p className="font-medium">{subreddit.lastMonitored}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <div className="flex justify-between w-full">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`https://reddit.com/r/${subreddit.name}`} target="_blank" rel="noopener noreferrer">
                        View Subreddit
                      </Link>
                    </Button>
                    {/* <div className="flex items-center gap-2">
                      <Label htmlFor={`monitor-${subreddit.id}`} className="text-xs">
                        Monitor
                      </Label>
                      <Switch id={`monitor-${subreddit.id}`} checked={subreddit.status === "active"} />
                    </div> */}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                  <div className="col-span-3">Subreddit</div>
                  <div className="col-span-3">Subscribers</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Used In</div>
                  <div className="col-span-2">Last Monitored</div>
                </div>
                {filteredSubreddits.map((subreddit) => (
                  <div
                    key={subreddit.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-muted/50"
                  >
                    <div className="col-span-3">
                      <div className="font-medium">r/{subreddit.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">{subreddit.description}</div>
                    </div>
                    <div className="col-span-3">{subreddit.subscribers.toLocaleString()}</div>
                    <div className="col-span-2">
                      <div
                        className={`flex items-center gap-1 text-xs w-fit px-2 py-1 rounded-full ${
                          subreddit.status === "active"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                            : subreddit.status === "paused"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}
                      >
                        {subreddit.status === "active" && <CheckCircle className="h-3 w-3" />}
                        {subreddit.status === "paused" && <Clock className="h-3 w-3" />}
                        {subreddit.status === "error" && <AlertCircle className="h-3 w-3" />}
                        <span className="capitalize">{subreddit.status}</span>
                      </div>
                    </div>
                    <div className="col-span-2">
                      {subreddit.agentCount} agent{subreddit.agentCount !== 1 ? "s" : ""}
                    </div>
                    <div className="col-span-2">{subreddit.lastMonitored}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

