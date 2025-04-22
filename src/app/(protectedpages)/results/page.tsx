"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Search, Download, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Agent } from "@/lib/constants/types"
import { useAgentStore } from "@/store/agentstore"

type Result = {
  
    id: string;
    agentId: string;
    author: string;
    content: string;
    createdAt: Date;
    processed: boolean;
    redditCommentId: string;
    redditPostId: string;
    subreddit: string;
    timestamp: string;
    relevanceScore: number;
    score: number;
    sentimentScore: number;
    url: string;
    matchedKeywords:string[],
    type?:'post' | 'comment'
}


export default function ResultsPage() {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [filteredResults, setFilteredResults] = useState<Result[]>([])
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [searchQuery, setSearchQuery] = useState("")
  const [relevanceFilter, setRelevanceFilter] = useState("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [timeFilter, setTimeFilter] = useState("all")
  const {agents} = useAgentStore()

  useEffect(() => {
    const timer = setTimeout(() => {
      const resultsFromAgents = agents.flatMap(agent =>
        (agent.results ??[]).map(result => ({
          ...result,
          agentId: agent.id,
          agentName: agent.name,
        }))
      );
      setAllResults(resultsFromAgents);
      setFilteredResults(resultsFromAgents);
      setIsLoading(false);
    }, 1000);
  
    return () => clearTimeout(timer);
  }, [agents]);

  useEffect(() => {
    // Filter results based on search query and filters
    let filtered = [...allResults]

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (result) =>
          result.content.toLowerCase().includes(query) ||
          result.matchedKeywords.some((keyword) => keyword.toLowerCase().includes(query)),
      )
    }

    // Apply relevance filter
    if (relevanceFilter !== "all") {
      const minRelevance = Number.parseInt(relevanceFilter)
      filtered = filtered.filter((result) => result.relevanceScore >= minRelevance)
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      filtered = filtered.filter((result) => result.agentId === agentFilter)
    }

    // Apply time filter
    if (timeFilter !== "all") {
      // In a real implementation, this would filter based on actual dates
      // For now, we'll just simulate it with our hardcoded data
      if (timeFilter === "today") {
        filtered = filtered.filter((result) => result.timestamp.includes("hour") || result.timestamp === "today")
      } else if (timeFilter === "week") {
        filtered = filtered.filter(
          (result) => !result.timestamp.includes("month") && !result.timestamp.includes("year"),
        )
      }
    }

    setFilteredResults(filtered)
  }, [searchQuery, relevanceFilter, agentFilter, timeFilter])

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Get unique agent IDs and names for the filter
  const agentList = Array.from(new Set(allResults.map((result) => result.agentId))).map((agentId) => {
    const agent = agents.find((result) => result.id === agentId)
    return {
      id: agentId,
      name: agent?.name as string || "Unknown Agent",
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Monitoring Results</h1>
          <p className="text-muted-foreground">View and analyze your Reddit monitoring results</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export Results
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter Results</CardTitle>
          <CardDescription>Narrow down results by relevance, agent, or time period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search in results..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Relevance</label>
              <Select value={relevanceFilter} onValueChange={setRelevanceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by relevance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Relevance</SelectItem>
                  <SelectItem value="90">High (90%+)</SelectItem>
                  <SelectItem value="80">Medium (80%+)</SelectItem>
                  <SelectItem value="70">Low (70%+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Agent</label>
              <Select value={agentFilter} onValueChange={setAgentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by agent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Agents</SelectItem>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Results ({filteredResults.length})</TabsTrigger>
          <TabsTrigger value="high">
            High Relevance ({filteredResults.filter((r) => r.relevanceScore >= 90).length})
          </TabsTrigger>
          <TabsTrigger value="posts">Posts ({filteredResults.filter((r) => r.type === "post").length})</TabsTrigger>
          <TabsTrigger value="comments">
            Comments ({filteredResults.filter((r) => r.type === "comment").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredResults.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Search className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No results found</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResults.map((result) => (
              <Card key={result.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>r/{result.subreddit}</span>
                        <span>•</span>
                        <span>{result.timestamp}</span>
                        <span>•</span>
                        <span>u/{result.author}</span>
                        <span>•</span>
                        <span>{result.type === "post" ? "Post" : "Comment"}</span>
                      </div>

                      <h3 className="text-lg font-medium mb-2">{result.author}</h3>
                      <p className="text-sm mb-4">"{result.content}"</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.matchedKeywords.map((keyword, index) => (
                          <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Found by:</span>
                        <Link href={`/agents/${result.agentId}`} className="text-primary hover:underline">
                          {}
                        </Link>
                      </div>
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
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Reddit
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {filteredResults.filter((r) => r.relevanceScore >= 90).length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <Search className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No high relevance results found</h3>
                <p className="text-muted-foreground text-center mt-2">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredResults
              .filter((r) => r.relevanceScore >= 90)
              .map((result) => (
                <Card key={result.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <span>r/{result.subreddit}</span>
                          <span>•</span>
                          <span>{result.timestamp}</span>
                          <span>•</span>
                          <span>u/{result.author}</span>
                          <span>•</span>
                          <span>{result.type === "post" ? "Post" : "Comment"}</span>
                        </div>

                        <h3 className="text-lg font-medium mb-2">{result.author}</h3>
                        <p className="text-sm mb-4">"{result.content}"</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {result.matchedKeywords.map((keyword, index) => (
                            <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                              {keyword}
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">Found by:</span>
                          <Link href={`/agents/${result.agentId}`} className="text-primary hover:underline">
                            {/* {result.agentName} */}
                          </Link>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <div className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 rounded-full px-3 py-1.5 text-sm font-medium">
                          {result.relevanceScore}% Relevant
                        </div>

                        <Button variant="outline" size="sm" asChild>
                          <a href={result.url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View on Reddit
                          </a>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
          )}
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          {filteredResults
            .filter((r) => r.type === "post")
            .map((result) => (
              <Card key={result.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>r/{result.subreddit}</span>
                        <span>•</span>
                        <span>{result.timestamp}</span>
                        <span>•</span>
                        <span>u/{result.author}</span>
                      </div>

                      <h3 className="text-lg font-medium mb-2">{result.author}</h3>
                      <p className="text-sm mb-4">"{result.content}"</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.matchedKeywords.map((keyword, index) => (
                          <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Found by:</span>
                        <Link href={`/agents/${result.agentId}`} className="text-primary hover:underline">
                          {/* {result.agentName} */}
                        </Link>
                      </div>
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
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Reddit
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="comments" className="space-y-4">
          {filteredResults
            .filter((r) => r.type === "comment")
            .map((result) => (
              <Card key={result.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <span>r/{result.subreddit}</span>
                        <span>•</span>
                        <span>{result.timestamp}</span>
                        <span>•</span>
                        <span>u/{result.author}</span>
                        <span>•</span>
                        <span>Comment</span>
                      </div>

                      <h3 className="text-lg font-medium mb-2">{result.author}</h3>
                      <p className="text-sm mb-4">"{result.content}"</p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {result.matchedKeywords.map((keyword, index) => (
                          <span key={index} className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">
                            {keyword}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">Found by:</span>
                        <Link href={`/agents/${result.agentId}`} className="text-primary hover:underline">
                          {/* {result.agentName} */}
                        </Link>
                      </div>
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
                        <a href={result.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View on Reddit
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
