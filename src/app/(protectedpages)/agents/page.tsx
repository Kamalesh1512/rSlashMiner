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
import { CreateAgentButton } from "@/components/agents/create-agent-button";

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="hover:shadow-xl transition-shadow duration-300 cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {agent.name}
                    <Badge
                      variant={
                        agent.status === "active" ? "premium" : "destructive"
                      }
                      className="text-sm"
                    >
                      {agent.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Leads Generated:{" "}
                    {agent.totalLeadsGenerated
                      ? formatDistanceToNow(
                          new Date(agent.totalLeadsGenerated),
                          {
                            addSuffix: true,
                          }
                        )
                      : "Never"}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Link href={`/agents/${agent.id}`}>
                    <Button size="sm" variant="secondary">
                      View Details
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
