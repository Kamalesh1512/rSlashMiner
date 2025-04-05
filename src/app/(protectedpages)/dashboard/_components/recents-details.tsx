'use client'
import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { agents, recentResults } from "@/lib/constants/constants";
import { BarChart3, Bot, Loader2, TrendingUp, Users } from "lucide-react";
import { useSession } from "next-auth/react";

// Define interfaces for our data types
export interface RecentResult {
  id: string;
  title: string;
  subreddit: string;
  timestamp: string;
  content: string;
  relevanceScore: number;
  agentId: string;
}

interface Agent {
  id: string;
  name: string;
  subredditCount: number;
  status: "active" | "paused";
}

const RecentDetails = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalResults: 0,
    potentialLeads: 0,
    monitoredSubreddits: 0,
  });

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        activeAgents: agents.filter((a) => a.isActive === true).length,
        totalResults: recentResults.length,
        potentialLeads: recentResults.filter((r) => r.relevanceScore >= 80)
          .length,
        monitoredSubreddits: agents.reduce(
          (acc, agent) => acc + agent.subreddits.length,
          0
        ),
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
            <p className="text-xs text-muted-foreground">
              Monitoring Reddit for opportunities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Results</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResults}</div>
            <p className="text-xs text-muted-foreground">
              Matches found in the last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Potential Leads
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.potentialLeads}</div>
            <p className="text-xs text-muted-foreground">
              High-relevance matches identified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monitored Subreddits
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.monitoredSubreddits}
            </div>
            <p className="text-xs text-muted-foreground">
              Active subreddit monitoring
            </p>
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
              <CardDescription>
                Your most recent matches from Reddit monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Iterate through recent results */}
              {recentResults.slice(0, 3).map((result) => (
                <div key={result.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{result.title}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          r/{result.subreddit}
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {result.timestamp}
                        </span>
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
              <CardDescription>
                Status and performance of your Reddit monitoring agents
              </CardDescription>
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
                          Monitoring {agent.subreddits.length} subreddit
                          {agent.subreddits.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            agent.isActive ? "bg-green-500" : "bg-amber-500"
                          }`}
                        ></div>
                        <span className="text-sm">
                          {agent.isActive ? "Active" : "Paused"}
                        </span>
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
    </div>
  );
};

export default RecentDetails;
