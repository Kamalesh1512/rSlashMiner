"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Loader2,
  Settings,
  Play,
  Pause,
  RefreshCw,
  BarChart3,
  AlertCircle,
  Trash2,
  ExternalLink,
  CalendarDays,
  Clock,
  Repeat,
  TrendingUp,
  Search,
  Sparkles,
  Percent,
  MessageSquareMoreIcon,
} from "lucide-react";
import Link from "next/link";
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
} from "@/components/ui/alert-dialog";
import { Agent } from "@/lib/constants/types";
import { useAgentStore } from "@/store/agentstore";
import { toast } from "sonner";
import {
  getResultsInLastNDays,
  getRunsInLastNDays,
  timeAgo,
} from "@/lib/utils";
import { AgentConfigTab } from "./_components/agent-config-tab";
import RunAgent from "./_components/run-agent";

export default function AgentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const { agents, setAgents } = useAgentStore();
  const [agent, setAgent] = useState<Agent | null>();
  const [isRunning, setIsRunning] = useState(false);

  const agentId = params.agentId as string;
  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      const foundAgent = agents.find((a) => a.id === agentId);
      setAgent(foundAgent || null);
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [agentId, agents]);

  const fetchAgents = async () => {
    try {
      const response = await fetch("/api/agents");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }
      setAgents(data.agents);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to fetch agents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAgents();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const toggleAgentStatus = () => {
    if (!agent) return;

    setAgent({
      ...agent,
      isActive: !agent.isActive,
    });
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex h-[calc(100vh-5rem)] flex-col items-center justify-center">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The agent you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Button asChild>
          <Link href="/agents">Back to Agents</Link>
        </Button>
      </div>
    );
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const last24Days = getRunsInLastNDays(agent.lastRunAt, agent.runCount, 1);
  const last7Days = getRunsInLastNDays(agent.lastRunAt, agent.runCount, 7);
  const last30Days = getRunsInLastNDays(agent.lastRunAt, agent.runCount, 30);

  const last24hrsResults = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.length as number,
    1
  );
  const last7DaysResults = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.length as number,
    7
  );
  const last30DaysResults = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.length as number,
    30
  );

  const last24HrsRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.filter((r) => r.relevanceScore >= 90).length as number,
    1
  );
  const last7DaysRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.filter((r) => r.relevanceScore >= 90).length as number,
    7
  );
  const last30DaysRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    agent.results?.filter((r) => r.relevanceScore >= 90).length as number,
    30
  );

  let avgRelevence;

  if (agent.results) {
    avgRelevence = Math.round(
      agent.results.reduce((acc, r) => acc + r.relevanceScore, 0) /
        ((agent.results.length as number) || 1)
    );
  }

  const last24HrsAvgRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    avgRelevence as number,
    1
  );
  const last7DaysAvgRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    avgRelevence as number,
    7
  );
  const last30DaysAvgRelevance = getResultsInLastNDays(
    agent.lastRunAt,
    avgRelevence as number,
    30
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg md:text-2xl font-bold">{agent.name}</h1>
            <Badge
              variant={agent.isActive ? "premium" : "outline"}
              className="text-black"
            >
              {agent.isActive ? "Active" : "Paused"}
            </Badge>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground">
            {agent.description}
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="sm:text-sm sm:min-w-fit md:max-w-fit">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {/* <TabsTrigger value="runagent">Run Agent</TabsTrigger> */}
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="settings">Agent Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Agent Overview */}
            <Card className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle>Agent Overview</CardTitle>
                <CardDescription>
                  An overview of the agent's core information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mt-2">
                  <div className="flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Created</div>
                      <div className="font-semibold text-foreground">
                        {formatDate(new Date(agent.createdAt))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Last Updated</div>
                      <div className="font-semibold text-foreground">
                        {timeAgo(agent.updatedAt)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Repeat className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Last Run</div>
                      <div className="font-semibold text-foreground">
                        {agent.lastRunAt ? timeAgo(agent.lastRunAt) : "Never"}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="text-muted-foreground">Total Runs</div>
                      <div className="font-semibold text-foreground">
                        {agent.runCount}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tracked Keywords */}
            <Card className="hover:shadow-md transition">
              <CardHeader>
                <CardTitle>Tracked Keywords</CardTitle>
                <CardDescription>
                  Keywords and phrases this agent is monitoring
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {agent.keywords.length > 0 ? (
                    agent.keywords.map((keyword) => (
                      <Badge key={keyword.id} variant="outline">
                        {keyword.keyword}
                      </Badge>
                    ))
                  ) : (
                    <div className="text-muted-foreground text-sm">
                      No keywords tracked yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Agent Performance */}
            <Card className="md:col-span-2 hover:shadow-md transition">
              <CardHeader>
                <CardTitle>Agent Performance</CardTitle>
                <CardDescription>
                  Summary of this agent's monitoring activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border text-xs md:text-base">
                  <div className="grid grid-cols-4 gap-4 p-4 font-medium border-b">
                    <div>Metric</div>
                    <div>Last 24 Hours</div>
                    <div>Last 7 Days</div>
                    <div>Last 30 Days</div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div className="flex items-center gap-1">
                      <Repeat className="w-4 h-4 text-muted-foreground" />
                      Runs Completed
                    </div>
                    <div>{last24Days}</div>
                    <div>{last7Days}</div>
                    <div>{last30Days}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div className="flex items-center gap-1">
                      <Search className="w-4 h-4 text-muted-foreground" />
                      Matches Found
                    </div>
                    <div>{last24hrsResults}</div>
                    <div>{last7DaysResults}</div>
                    <div>{last30DaysResults}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 items-center border-b">
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-4 h-4 text-muted-foreground" />
                      High Relevance
                    </div>
                    <div>{last24HrsRelevance}</div>
                    <div>{last7DaysRelevance}</div>
                    <div>{last30DaysRelevance}</div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 p-4 items-center">
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger className="flex items-center gap-1">
                          <Percent className="w-4 h-4 text-muted-foreground" />
                          Avg. Relevance
                        </TooltipTrigger>
                        <TooltipContent>
                          Average score based on relevance rating of matches
                          found.
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div>{last24HrsAvgRelevance}%</div>
                    <div>{last7DaysAvgRelevance}%</div>
                    <div>{last30DaysAvgRelevance}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* <TabsContent value="runagent">
          <RunAgent />
        </TabsContent> */}

        <TabsContent value="results">
          {agent.results && agent.results.length === 0 ? (
            <Card>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-10">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No results yet</h3>
                  <p className="text-muted-foreground text-center mt-2">
                    This agent hasn't found any matches yet. Try adjusting your
                    keywords.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {agent.results &&
                agent.results.slice(0, 3).map((result) => (
                  <Card key={result.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <span>r/{result.subreddit}</span>
                            <span>•</span>
                            {/* <span>
                              {result.redditPostId ? "Post" : "Comment"}
                            </span>
                            <span>•</span> */}
                          </div>
                          <h3 className="text-lg font-medium mb-2">
                            "{`${result.content.slice(0, 75)}...`}"
                          </h3>
                          <p className="text-sm mb-4">{result.author}</p>

                          <div className="flex flex-wrap gap-2 mb-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <div
                                className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm border ${
                                  result.relevanceScore >= 85
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : result.relevanceScore >= 70
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {result.relevanceScore}% Relevant
                              </div>

                              {/* <div
                                className={`rounded-full px-2.5 py-1 text-xs font-medium shadow-sm border flex items-center gap-1 ${
                                  result.sentimentScore >= 75
                                    ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                    : result.sentimentScore >= 50
                                    ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                    : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                }`}
                              >
                                {result.sentimentScore >= 75
                                  ? "😊"
                                  : result.sentimentScore >= 50
                                  ? "😐"
                                  : "😠"}{" "}
                                {result.sentimentScore}
                              </div> */}
                              <div className="flex items-center gap-1 text-sm text-primary">
                                <MessageSquareMoreIcon className="w-4 h-4" />
                                <span>
                                  {result.numComments === "1"
                                    ? `${result.numComments} Comment`
                                    : `${result.numComments} Comments`}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-start justify-between gap-2 text-xs">
                            <span className="text-muted-foreground text-xs lg:text-xs">
                              {formatDate(new Date(result.createdAt))}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-4">
                          <div className="flex flex-row items-center justify-between">
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={result.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View on Reddit
                              </a>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

              <div className="flex justify-center">
                <Button asChild variant="outline">
                  <Link href={`/results?agent=${agent.id}`}>
                    View All Results
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <div className="">
            <AgentConfigTab
              agent={agent}
              subscription={session?.user.subscriptionTier as string}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
