"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { Loader2, Plus, Settings, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { Agent } from "@/lib/constants/types";
import { useAgentStore } from "@/store/agentstore";
import { QuickRunAgent } from "./[agentId]/_components/quick-agent-run";

export default function AgentsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const { agents, setAgents, updateAgentById } = useAgentStore();

  const [runningAgents, setRunningAgents] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }

    if (status === "authenticated") {
      fetchAgents();
    }
  }, [status, router]);

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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleRunComplete = (
    agentId: string,
    success: boolean,
    resultsCount: number
  ) => {
    // Update the agent's run count and last run time

    const count = agents.find((agent) => agent.id === agentId)?.runCount;

    updateAgentById(agentId, {
      runCount: count && count + 1,
    });
    // Remove from running agents
    setRunningAgents((prev) => {
      const updated = new Set(prev);
      updated.delete(agentId);
      return updated;
    });

    router.refresh();
  };

  return (
    <div className="flex flex-col justify-center items-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Your Agents</h1>
            <p className="text-muted-foreground">
              Manage your Reddit monitoring agents and view their results.
            </p>
          </div>
        </div>

        {agents.length === 0 ? (
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                "No Agents Yet — Time to Build Something Brilliant."
              </CardTitle>
              <CardDescription>
                Set it up in minutes — monitor, analyze, or automate with zero
                hassle.
              </CardDescription>
            </CardHeader>
            <CardContent></CardContent>
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
                    <Badge
                      variant={agent.isActive ? "premium" : "secondary"}
                      className="text-primary"
                    >
                      {agent.isActive ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {agent.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium mb-2">
                        Tracking Keywords
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.keywords.slice(0, 3).map((kw) => (
                          <Badge
                            key={kw.keyword}
                            variant="outline"
                            className="text-xs"
                          >
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
                          <span>
                            Last run{" "}
                            {formatDistanceToNow(new Date(agent.lastRunAt), {
                              addSuffix: true,
                            })}
                          </span>
                        ) : (
                          <span>Never run</span>
                        )}
                      </div>
                      <div>Runs: {agent.runCount}</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-3 flex flex-row items-start justify-between space-x-3">
                  <QuickRunAgent
                    agentId={agent.id}
                    onComplete={(success, resultsCount) =>
                      handleRunComplete(agent.id, success, resultsCount)
                    }
                  />
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
  );
}
