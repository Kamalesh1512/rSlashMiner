"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Loader2,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Calendar,
  BarChart3,
  Activity,
  CheckCheck,
  XCircle,
  HourglassIcon,
  PlayCircle,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Agent } from "@/lib/constants/types";
import { useAgentStore } from "@/store/agentstore";
import { useScheduledRuns } from "@/hooks/usage-limits/use-scheduledruns";

interface ScheduledRun {
  id: string;
  agentId: string;
  scheduledFor: string;
  status: "pending" | "processing" | "completed" | "failed";
  startedAt?: string;
  completedAt?: string;
  result?: {
    success: boolean;
    resultsCount?: number;
    processedKeywords?: number;
    summary?: string;
    error?: string;
  };
  createdAt: string;
}

// Animation variants for Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 100 },
  },
};

export default function MonitoringPage() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  // const [agents, setAgents] = useState<Agent[]>([])

  const [scheduledRun, setScheduledRun] = useState<ScheduledRun[]>([]);
  const [filteredRuns, setFilteredRuns] = useState<ScheduledRun[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [agentFilter, setAgentFilter] = useState("all");
  const { scheduledRuns } = useScheduledRuns();
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    pending: 0,
    processing: 0,
  });

  const { agents } = useAgentStore();

  const fetchScheduledRuns = async () => {
    try {
      const response = await fetch("/api/notification/scheduled-runs");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch agents");
      }
      console.log("server response", data);
      setScheduledRun(data.runs);
    } catch (error) {
      toast.error("Error", {
        description:
          error instanceof Error ? error.message : "Failed to fetch agents",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data
  useEffect(() => {
    // Simulate loading data from API
    const timer = setTimeout(() => {
      fetchScheduledRuns();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Calculate stats
  useEffect(() => {
    if (scheduledRun.length > 0) {
      const newStats = {
        total: scheduledRun.length,
        completed: scheduledRun.filter((run) => run.status === "completed")
          .length,
        failed: scheduledRun.filter((run) => run.status === "failed").length,
        pending: scheduledRun.filter((run) => run.status === "pending").length,
        processing: scheduledRun.filter((run) => run.status === "processing")
          .length,
      };
      setStats(newStats);
    }
  }, [scheduledRuns]);

  // Filter runs based on search query, status filter, and agent filter
  useEffect(() => {
    let filtered = [...scheduledRun];

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((run) =>
        agents
          .find((res) => res.id == run.agentId)
          ?.name.toLowerCase()
          .includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((run) => run.status === statusFilter);
    }

    // Apply agent filter
    if (agentFilter !== "all") {
      filtered = filtered.filter((run) => run.agentId === agentFilter);
    }

    setFilteredRuns(filtered);
  }, [searchQuery, statusFilter, agentFilter, scheduledRuns]);

  // Handle manual trigger of agent run
  // const handleTriggerRun = async (agentId: string, agentName: string) => {
  //   try {
  //     // In a real app, this would call the API
  //     // await triggerAgentRun(agentId)

  //     // // For demo, we'll just add a new mock run
  //     // const newRun: ScheduledRun = {
  //     //   id: `run${Date.now()}`,
  //     //   agentId,
  //     //   agentName,
  //     //   scheduledFor: new Date().toISOString(),
  //     //   status: "pending",
  //     //   createdAt: new Date().toISOString(),
  //     // }

  //     setScheduledRuns((prev) => [newRun, ...prev]);

  //     toast.success(`Triggered run for ${agentName}`, {
  //       description: "The agent run has been scheduled and will start shortly.",
  //     });
  //   } catch (error) {
  //     toast.error(`Failed to trigger run for ${agentName}`, {
  //       description:
  //         error instanceof Error ? error.message : "Unknown error occurred",
  //     });
  //   }
  // };

  // Handle refresh
  const handleRefresh = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      fetchScheduledRuns();
      toast.success("Dashboard refreshed", {
        description: "Latest scheduler data has been loaded.",
      });
    }, 1000);
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!scheduledRuns.enabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Agents</CardTitle>
            <CardDescription>
              Agents with scheduled runs enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-6 space-y-5">
              {/* <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" /> */}
              <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-orange-600 bg-clip-text text-transparent">
                "Unlock more power — Upgrade your plan to go beyond limits!!"
              </h3>
              <div className="p-4 border rounded-md bg-muted text-muted-foreground text-sm">
                Monitoring Scheduled Agent Run is not available on your current plan.
              </div>
              <Button size="sm" asChild>
                <Link href="/settings">Upgrade Plan</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Filter agents that have scheduling enabled
  const scheduledAgents = agents.filter(
    (agent) => agent.configuration.scheduleRuns?.enabled === true
  );

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold">Scheduler Monitoring</h1>
          <p className="text-muted-foreground">
            Track and manage your scheduled agent runs
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button size="sm" asChild>
            <Link href="/agents/create">
              <Plus className="mr-2 h-4 w-4" />
              New Agent
            </Link>
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
      >
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled agent runs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round(
                    (stats.completed / stats.total) * 100
                  )}% success rate`
                : "No runs yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0
                ? `${Math.round(
                    (stats.failed / stats.total) * 100
                  )}% failure rate`
                : "No runs yet"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.pending + stats.processing}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.pending} pending, {stats.processing} processing
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Agents</CardTitle>
            <CardDescription>
              Agents with scheduled runs enabled
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduledAgents.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-lg font-medium">No Scheduled Agents</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  You don't have any agents with scheduled runs enabled.
                </p>
              </div>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {scheduledAgents.map((agent) => (
                  <motion.div key={agent.id} variants={itemVariants}>
                    <Card>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">
                            {agent.name}
                          </CardTitle>
                          <Badge
                            variant={agent.isActive ? "default" : "secondary"}
                          >
                            {agent.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <CardDescription className="line-clamp-2">
                          {agent.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Interval</p>
                            <p className="font-medium">
                              {agent.configuration.scheduleRuns?.interval ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Start Time</p>
                            <p className="font-medium">
                              {agent.configuration.scheduleRuns?.scheduleTime ||
                                "N/A"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Run</p>
                            <p className="font-medium">
                              {agent.lastRunAt
                                ? formatDistanceToNow(
                                    new Date(agent.lastRunAt),
                                    { addSuffix: true }
                                  )
                                : "Never"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Total Runs</p>
                            <p className="font-medium">{agent.runCount}</p>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-2">
                        <div className="flex justify-between w-full">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/agents/${agent.id}`}>View Agent</Link>
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Runs</CardTitle>
            <CardDescription>
              History of all scheduled agent runs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by agent name..."
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
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
              </div>

              {filteredRuns.length === 0 ? (
                <div className="text-center py-8">
                  <HourglassIcon className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-lg font-medium">
                    No Scheduled Runs Found
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {searchQuery ||
                    statusFilter !== "all" ||
                    agentFilter !== "all"
                      ? "Try adjusting your filters to see more results."
                      : "No scheduled runs have been created yet."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
                    <div className="col-span-3">Agent</div>
                    <div className="col-span-2">Scheduled For</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Results</div>
                    <div className="col-span-2">Duration</div>
                  </div>
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {filteredRuns.map((run) => (
                      <motion.div
                        key={run.id}
                        variants={itemVariants}
                        className="grid grid-cols-12 gap-4 p-4 items-center border-b last:border-0 hover:bg-muted/50"
                      >
                        <div className="col-span-3">
                          <div className="font-medium">
                            {agents &&
                              agents.find((res) => res.id == run.agentId)?.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            ID: {run.id.substring(0, 8)}...
                          </div>
                        </div>
                        <div className="col-span-2">
                          {formatDistanceToNow(new Date(run.scheduledFor), {
                            addSuffix: true,
                          })}
                        </div>
                        <div className="col-span-2">
                          <div
                            className={`flex items-center gap-1 text-xs w-fit px-2 py-1 rounded-full ${
                              run.status === "completed"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : run.status === "pending"
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
                                : run.status === "processing"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                                : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                            }`}
                          >
                            {run.status === "completed" && (
                              <CheckCircle className="h-3 w-3" />
                            )}
                            {run.status === "pending" && (
                              <Clock className="h-3 w-3" />
                            )}
                            {run.status === "processing" && (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            )}
                            {run.status === "failed" && (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            <span className="capitalize">{run.status}</span>
                          </div>
                        </div>
                        <div className="col-span-3">
                          {run.status === "completed" && run.result ? (
                            <div>
                              <div className="text-sm">
                                {run.result.resultsCount} results from{" "}
                                {run.result.processedKeywords} keywords
                              </div>
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {run.result.summary}
                              </div>
                            </div>
                          ) : run.status === "failed" && run.result ? (
                            <div className="text-xs text-red-500 line-clamp-1">
                              {run.result.error}
                            </div>
                          ) : run.status === "processing" ? (
                            <div className="text-xs text-muted-foreground">
                              Processing keywords...
                            </div>
                          ) : run.status === "pending" ? (
                            <div className="text-xs text-muted-foreground">
                              Waiting to start...
                            </div>
                          ) : (
                            <div className="text-xs text-muted-foreground">
                              No results available
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          {run.completedAt && run.startedAt ? (
                            <div className="text-sm">
                              {formatDuration(
                                new Date(run.startedAt),
                                new Date(run.completedAt)
                              )}
                            </div>
                          ) : run.startedAt ? (
                            <div className="text-sm">Running...</div>
                          ) : (
                            <div className="text-sm">-</div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Helper function to format duration between two dates
function formatDuration(start: Date, end: Date): string {
  const durationMs = end.getTime() - start.getTime();

  if (durationMs < 1000) {
    return `${durationMs}ms`;
  }

  if (durationMs < 60000) {
    return `${Math.round(durationMs / 1000)}s`;
  }

  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.round((durationMs % 60000) / 1000);

  return `${minutes}m ${seconds}s`;
}
