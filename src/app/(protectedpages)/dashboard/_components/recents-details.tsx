"use client";
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
import { BarChart3, Bot, Loader2, TrendingUp, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { useAgentStore } from "@/store/agentstore";
import { Agent } from "@/lib/constants/types";

const RecentDetails = () => {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const { agents } = useAgentStore();
  const [agent, setAgent] = useState<Agent | null>();
  const [stats, setStats] = useState({
    activeAgents: 0,
    totalResults: 0,
    potentialLeads: 0,
    keywords: 0,
  });

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setStats({
        activeAgents: agents.filter((a) => a.isActive === true).length,
        totalResults: agents.reduce((count, agent) => {
          return count + (agent.results?.length ?? 0);
        }, 0),
        potentialLeads: agents.reduce((count, agent) => {
          const relevantCount = (agent.results ?? []).reduce(
            (resCount, result) => {
              return resCount + (result.relevanceScore >= 90 ? 1 : 0);
            },
            0
          );
          return count + relevantCount;
        }, 0),
        keywords: agents.reduce((acc, agent) => acc + agent.keywords.length, 0),
      });
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [agents]);

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
              Tracking Keywords
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.keywords}</div>
            <p className="text-xs text-muted-foreground">
              Active keywords tracking
            </p>
          </CardContent>
        </Card>
      </div>
      <div>
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
                        Tracking {agent.keywords.length} Keyword
                        {agent.keywords.length !== 1 ? "s" : ""}
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
      </div>
    </div>
  );
};

export default RecentDetails;
