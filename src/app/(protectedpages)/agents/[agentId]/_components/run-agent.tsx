"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  XCircle,
  Clock,
  Trash2,
  History,
} from "lucide-react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { toast } from "sonner";

type StepStatus = "running" | "completed" | "error" | "waiting" | "skipped";

interface Step {
  id: string;
  status: StepStatus;
  message: string;
  details?: string;
  timestamp: Date;
  progress: number;
  subreddit?: string;
}

interface RunHistoryItem {
  id: string;
  startedAt: Date;
  completedAt?: Date;
  success?: boolean;
  resultsCount: number;
  processedSubreddits: number;
  summary?: string;
  error?: string;
  steps: Step[];
}

export default function RunAgentPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<Step[]>([]);
  const [runResult, setRunResult] = useState<{
    success: boolean;
    summary: string;
    resultsCount: number;
    error?: string;
  } | null>(null);
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"current" | "history">("current");
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentRunIdRef = useRef<string | null>(null);

  const agentId = params.agentId as string;

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  useEffect(() => {
    // Check if user is authenticated
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      setIsLoading(false);

      // Try to load run history from localStorage
      const savedHistory = localStorage.getItem(`runHistory-${agentId}`);
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory) as RunHistoryItem[];
          // Convert string dates back to Date objects
          const processedHistory = parsedHistory.map((item) => ({
            ...item,
            startedAt: new Date(item.startedAt),
            completedAt: item.completedAt
              ? new Date(item.completedAt)
              : undefined,
            steps: item.steps.map((step) => ({
              ...step,
              timestamp: new Date(step.timestamp),
            })),
          }));
          setRunHistory(processedHistory);
        } catch (e) {
          console.error("Error parsing run history:", e);
        }
      }
    }
  }, [status, router, agentId]);

  // Save run history to localStorage whenever it changes
  useEffect(() => {
    if (runHistory.length > 0) {
      localStorage.setItem(`runHistory-${agentId}`, JSON.stringify(runHistory));
    }
  }, [runHistory, agentId]);

  const clearHistory = useCallback(() => {
    setRunHistory([]);
    localStorage.removeItem(`runHistory-${agentId}`);
  }, [agentId]);

  const runAgent = async () => {
    // Reset state for new run
    setIsRunning(true);
    setProgress(0);
    setSteps([]);
    setRunResult(null);
    setActiveTab("current");

    // Generate a unique ID for this run
    const runId = Date.now().toString();
    currentRunIdRef.current = runId;

    // Create a new run history item
    const newRunHistoryItem: RunHistoryItem = {
      id: runId,
      startedAt: new Date(),
      resultsCount: 0,
      processedSubreddits: 0,
      steps: [],
    };

    // Add to history
    setRunHistory((prev) => [newRunHistoryItem, ...prev]);

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Create a new EventSource connection
    const eventSource = new EventSource(
      `/api/agents/run/stream?agentId=${agentId}`
    );
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "step") {
          // Extract subreddit from step ID if available
          let subreddit: string | undefined;
          if (data.id.startsWith("subreddit-")) {
            const parts = data.id.split("-");
            const subredditIndex = Number.parseInt(parts[1]);
            subreddit = data.subredditName || `Subreddit ${subredditIndex + 1}`;
          } else if (data.id.includes("-")) {
            // For substeps, extract the parent subreddit
            const parentId = data.id.split("-")[0];
            if (parentId.startsWith("subreddit-")) {
              const parts = parentId.split("-");
              const subredditIndex = Number.parseInt(parts[1]);
              subreddit =
                data.subredditName || `Subreddit ${subredditIndex + 1}`;
            }
          }

          // Create step object
          const step: Step = {
            id: data.id,
            status: data.status,
            message: data.message,
            details: data.details,
            timestamp: new Date(),
            progress: data.progress || 0,
            subreddit,
          };

          // Update steps
          setSteps((prevSteps) => {
            // Check if this step already exists
            const existingStepIndex = prevSteps.findIndex(
              (s) => s.id === data.id
            );

            if (existingStepIndex >= 0) {
              // Update existing step
              const updatedSteps = [...prevSteps];
              updatedSteps[existingStepIndex] = {
                ...updatedSteps[existingStepIndex],
                status: data.status,
                message: data.message,
                details:
                  data.details || updatedSteps[existingStepIndex].details,
                timestamp: new Date(),
                progress:
                  data.progress || updatedSteps[existingStepIndex].progress,
              };
              return updatedSteps;
            } else {
              // Add new step
              return [...prevSteps, step];
            }
          });

          // Update run history
          setRunHistory((prevHistory) => {
            const currentRunIndex = prevHistory.findIndex(
              (run) => run.id === runId
            );
            if (currentRunIndex >= 0) {
              const updatedHistory = [...prevHistory];
              const currentRun = { ...updatedHistory[currentRunIndex] };

              // Update steps in the current run
              const existingStepIndex = currentRun.steps.findIndex(
                (s) => s.id === data.id
              );
              if (existingStepIndex >= 0) {
                currentRun.steps[existingStepIndex] = {
                  ...currentRun.steps[existingStepIndex],
                  status: data.status,
                  message: data.message,
                  details:
                    data.details || currentRun.steps[existingStepIndex].details,
                  timestamp: new Date(),
                  progress:
                    data.progress ||
                    currentRun.steps[existingStepIndex].progress,
                  subreddit,
                };
              } else {
                currentRun.steps.push({
                  id: data.id,
                  status: data.status,
                  message: data.message,
                  details: data.details,
                  timestamp: new Date(),
                  progress: data.progress || 0,
                  subreddit,
                });
              }

              updatedHistory[currentRunIndex] = currentRun;
              return updatedHistory;
            }
            return prevHistory;
          });

          // Update progress
          if (data.progress) {
            setProgress(data.progress);
          }
        } else if (data.type === "complete") {
          // Handle completion
          setRunResult({
            success: true,
            summary: data.summary,
            resultsCount: data.resultsCount,
          });
          setProgress(100);
          setIsRunning(false);

          // Update run history
          setRunHistory((prevHistory) => {
            const currentRunIndex = prevHistory.findIndex(
              (run) => run.id === runId
            );
            if (currentRunIndex >= 0) {
              const updatedHistory = [...prevHistory];
              updatedHistory[currentRunIndex] = {
                ...updatedHistory[currentRunIndex],
                completedAt: new Date(),
                success: true,
                resultsCount: data.resultsCount,
                processedSubreddits: data.processedSubreddits,
                summary: data.summary,
              };
              return updatedHistory;
            }
            return prevHistory;
          });

          toast.success("Agent run completed", {
            description: `Found ${data.resultsCount} relevant results.`,
          });

          // Close the connection
          eventSource.close();
          eventSourceRef.current = null;
        } else if (data.type === "error") {
          // Handle error
          setRunResult({
            success: false,
            summary: "",
            resultsCount: 0,
            error: data.error,
          });
          setIsRunning(false);

          // Update run history
          setRunHistory((prevHistory) => {
            const currentRunIndex = prevHistory.findIndex(
              (run) => run.id === runId
            );
            if (currentRunIndex >= 0) {
              const updatedHistory = [...prevHistory];
              updatedHistory[currentRunIndex] = {
                ...updatedHistory[currentRunIndex],
                completedAt: new Date(),
                success: false,
                error: data.error,
              };
              return updatedHistory;
            }
            return prevHistory;
          });

          toast.error("Agent run failed", {
            description: data.error,
          });

          // Close the connection
          eventSource.close();
          eventSourceRef.current = null;
        }
      } catch (error) {
        console.error("Error parsing event data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);

      setRunResult({
        success: false,
        summary: "",
        resultsCount: 0,
        error: "Connection error. Please try again.",
      });
      setIsRunning(false);

      // Update run history
      setRunHistory((prevHistory) => {
        const currentRunIndex = prevHistory.findIndex(
          (run) => run.id === runId
        );
        if (currentRunIndex >= 0) {
          const updatedHistory = [...prevHistory];
          updatedHistory[currentRunIndex] = {
            ...updatedHistory[currentRunIndex],
            completedAt: new Date(),
            success: false,
            error: "Connection error. Please try again.",
          };
          return updatedHistory;
        }
        return prevHistory;
      });

      toast.error("Connection error", {
        description: "Lost connection to the server. Please try again.",
      });

      // Close the connection
      eventSource.close();
      eventSourceRef.current = null;
    };
  };

  const cancelRun = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsRunning(false);
    setRunResult({
      success: false,
      summary: "",
      resultsCount: 0,
      error: "Agent run cancelled by user",
    });

    // Update run history
    if (currentRunIdRef.current) {
      setRunHistory((prevHistory) => {
        const currentRunIndex = prevHistory.findIndex(
          (run) => run.id === currentRunIdRef.current
        );
        if (currentRunIndex >= 0) {
          const updatedHistory = [...prevHistory];
          updatedHistory[currentRunIndex] = {
            ...updatedHistory[currentRunIndex],
            completedAt: new Date(),
            success: false,
            error: "Agent run cancelled by user",
          };
          return updatedHistory;
        }
        return prevHistory;
      });
    }

    toast.error("Run cancelled", {
      description: "Agent run was cancelled",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Group steps by subreddit
  const groupStepsBySubreddit = (stepsToGroup: Step[]) => {
    const groups: { [key: string]: Step[] } = {
      initialization: [],
      configuration: [],
    };

    // First, separate initialization and configuration steps
    stepsToGroup.forEach((step) => {
      if (step.id === "init") {
        groups["initialization"].push(step);
      } else if (step.id === "config") {
        groups["configuration"].push(step);
      } else if (step.subreddit) {
        // Group by subreddit
        if (!groups[step.subreddit]) {
          groups[step.subreddit] = [];
        }
        groups[step.subreddit].push(step);
      } else {
        // For steps without a subreddit, put in "other" category
        if (!groups["other"]) {
          groups["other"] = [];
        }
        groups["other"].push(step);
      }
    });

    return groups;
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Run Agent</h1>
        </div>

        {runHistory.length > 0 && (
          <Button variant="outline" size="sm" onClick={clearHistory}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear History
          </Button>
        )}
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "current" | "history")}
      >
        <TabsList>
          <TabsTrigger value="current">Current Run</TabsTrigger>
          <TabsTrigger value="history" disabled={runHistory.length === 0}>
            History ({runHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current">
          <Card>
            <CardHeader>
              <CardTitle>Manual Agent Run</CardTitle>
              <CardDescription>
                Run this agent now to search Reddit for relevant content
                matching your keywords and subreddits.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isRunning && steps.length === 0 && !runResult ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <p className="text-center text-muted-foreground max-w-md">
                    Running the agent will search Reddit for new content
                    matching your keywords in the selected subreddits. This
                    process may take a few minutes depending on the number of
                    subreddits and keywords.
                  </p>
                  <Button onClick={runAgent} size="lg">
                    Run Agent Now
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Steps grouped by subreddit */}
                  <div className="border rounded-md">
                    <Accordion type="multiple" className="w-full">
                      {/* Initialization steps */}
                      {steps.some((step) => step.id === "init") && (
                        <AccordionItem value="initialization">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0">
                                {steps.find((step) => step.id === "init")
                                  ?.status === "running" ? (
                                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                ) : steps.find((step) => step.id === "init")
                                    ?.status === "completed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : steps.find((step) => step.id === "init")
                                    ?.status === "error" ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">
                                  Agent Initialization
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 pt-0">
                            {steps
                              .filter((step) => step.id === "init")
                              .map((step) => (
                                <div
                                  key={step.id}
                                  className="pl-8 py-2 border-b last:border-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {step.message}
                                      </div>
                                      {step.details && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {step.details}
                                        </div>
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatTime(step.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Configuration steps */}
                      {steps.some((step) => step.id === "config") && (
                        <AccordionItem value="configuration">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0">
                                {steps.find((step) => step.id === "config")
                                  ?.status === "running" ? (
                                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                ) : steps.find((step) => step.id === "config")
                                    ?.status === "completed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : steps.find((step) => step.id === "config")
                                    ?.status === "error" ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">
                                  Agent Configuration
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 pt-0">
                            {steps
                              .filter((step) => step.id === "config")
                              .map((step) => (
                                <div
                                  key={step.id}
                                  className="pl-8 py-2 border-b last:border-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {step.message}
                                      </div>
                                      {step.details && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {step.details}
                                        </div>
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatTime(step.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </AccordionContent>
                        </AccordionItem>
                      )}

                      {/* Subreddit steps */}
                      {Object.entries(groupStepsBySubreddit(steps))
                        .filter(
                          ([key]) =>
                            key !== "initialization" &&
                            key !== "configuration" &&
                            key !== "other"
                        )
                        .map(([subreddit, subredditSteps]) => {
                          const isRunning = subredditSteps.some(
                            (step: Step) => step.status === "running"
                          );
                          const isSkipped = subredditSteps.some(
                            (step: Step) => step.status === "skipped"
                          );
                          const isCompleted = subredditSteps.every(
                            (step: Step) => step.status === "completed"
                          );
                          const hasError = subredditSteps.some(
                            (step: Step) => step.status === "error"
                          );

                          return (
                            <AccordionItem value={subreddit} key={subreddit}>
                              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                                <div className="flex items-center gap-3 w-full">
                                  <div className="flex-shrink-0">
                                    {isRunning ? (
                                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                    ) : isSkipped ? (
                                      <AlertCircle className="h-5 w-5 text-yellow-500" />
                                    ) : isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : hasError ? (
                                      <AlertCircle className="h-5 w-5 text-red-500" />
                                    ) : (
                                      <Clock className="h-5 w-5 text-muted-foreground" />
                                    )}
                                  </div>
                                  <div className="flex-grow">
                                    <div className="font-medium">
                                      Processing r/{subreddit}
                                    </div>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-3 pt-0">
                                {subredditSteps.map((step) => (
                                  <div
                                    key={step.id}
                                    className="pl-8 py-2 border-b last:border-0"
                                  >
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0">
                                        {step.status === "running" ? (
                                          <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                        ) : step.status === "skipped" ? (
                                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                                        ) : step.status === "completed" ? (
                                          <CheckCircle className="h-4 w-4 text-green-500" />
                                        ) : step.status === "error" ? (
                                          <AlertCircle className="h-4 w-4 text-red-500" />
                                        ) : (
                                          <Clock className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="flex-grow">
                                        <div className="font-medium">
                                          {step.message}
                                        </div>
                                        {step.details && (
                                          <div className="text-sm text-muted-foreground mt-1">
                                            {step.details}
                                          </div>
                                        )}
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {formatTime(step.timestamp)}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          );
                        })}

                      {/* Other steps */}
                      {steps.some(
                        (step) =>
                          !step.subreddit &&
                          step.id !== "init" &&
                          step.id !== "config"
                      ) && (
                        <AccordionItem value="other">
                          <AccordionTrigger className="px-4 py-3 hover:no-underline">
                            <div className="flex items-center gap-3 w-full">
                              <div className="flex-shrink-0">
                                {steps.find(
                                  (step) =>
                                    !step.subreddit &&
                                    step.id !== "init" &&
                                    step.id !== "config"
                                )?.status === "running" ? (
                                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                ) : steps.every(
                                    (step) =>
                                      step.status === "completed" ||
                                      step.subreddit ||
                                      step.id === "init" ||
                                      step.id === "config"
                                  ) ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : steps.some(
                                    (step) =>
                                      step.status === "error" &&
                                      !step.subreddit &&
                                      step.id !== "init" &&
                                      step.id !== "config"
                                  ) ? (
                                  <AlertCircle className="h-5 w-5 text-red-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-muted-foreground" />
                                )}
                              </div>
                              <div className="flex-grow">
                                <div className="font-medium">Other Steps</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-3 pt-0">
                            {steps
                              .filter(
                                (step) =>
                                  !step.subreddit &&
                                  step.id !== "init" &&
                                  step.id !== "config"
                              )
                              .map((step) => (
                                <div
                                  key={step.id}
                                  className="pl-8 py-2 border-b last:border-0"
                                >
                                  <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                      {step.status === "running" ? (
                                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                                      ) : step.status === "completed" ? (
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                      ) : step.status === "error" ? (
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex-grow">
                                      <div className="font-medium">
                                        {step.message}
                                      </div>
                                      {step.details && (
                                        <div className="text-sm text-muted-foreground mt-1">
                                          {step.details}
                                        </div>
                                      )}
                                      <div className="text-xs text-muted-foreground mt-1">
                                        {formatTime(step.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </AccordionContent>
                        </AccordionItem>
                      )}
                    </Accordion>
                  </div>

                  {/* Controls */}
                  <div className="flex justify-between">
                    {isRunning ? (
                      <Button variant="destructive" onClick={cancelRun}>
                        <XCircle className="mr-2 h-4 w-4" />
                        Cancel Run
                      </Button>
                    ) : (
                      <></>
                    )}

                    {!isRunning &&
                      runResult &&
                      (runResult.success ? (
                        <Button asChild>
                          <Link href={`/agents/${agentId}/results`}>
                            View Results
                          </Link>
                        </Button>
                      ) : (
                        <Button onClick={runAgent}>Try Again</Button>
                      ))}
                  </div>

                  {/* Result summary */}
                  {!isRunning && runResult && (
                    <div
                      className={`p-4 rounded-lg border ${
                        runResult.success
                          ? "border-green-200 bg-green-50 dark:bg-green-900/10 dark:border-green-900/30"
                          : "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {runResult.success ? (
                          <>
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <h3 className="font-medium">
                              Run Completed Successfully
                            </h3>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-5 w-5 text-red-500" />
                            <h3 className="font-medium">Run Failed</h3>
                          </>
                        )}
                      </div>
                      <p className="text-sm">
                        {runResult.success
                          ? runResult.summary
                          : runResult.error}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Run History</CardTitle>
              <CardDescription>
                View previous agent runs and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No Run History</h3>
                  <p className="text-muted-foreground text-center mt-2">
                    Run the agent to see history of executions
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {runHistory.map((historyItem) => (
                    <div key={historyItem.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">
                              Run on{" "}
                              {format(historyItem.startedAt, "MMM d, yyyy")}
                            </h3>
                            {historyItem.success !== undefined && (
                              <Badge
                                variant={
                                  historyItem.success
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {historyItem.success ? "Success" : "Failed"}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(historyItem.startedAt, "h:mm a")}
                            {historyItem.completedAt &&
                              ` - ${format(historyItem.completedAt, "h:mm a")}`}
                          </p>
                        </div>
                        <div className="text-right">
                          {historyItem.success && (
                            <p className="text-sm font-medium">
                              {historyItem.resultsCount} results from{" "}
                              {historyItem.processedSubreddits} subreddits
                            </p>
                          )}
                          {historyItem.completedAt && historyItem.startedAt && (
                            <p className="text-xs text-muted-foreground">
                              Duration:{" "}
                              {Math.round(
                                (historyItem.completedAt.getTime() -
                                  historyItem.startedAt.getTime()) /
                                  1000
                              )}{" "}
                              seconds
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Summary or error */}
                      {(historyItem.summary || historyItem.error) && (
                        <div
                          className={`p-3 rounded-md mb-4 ${
                            historyItem.success
                              ? "bg-green-50 dark:bg-green-900/10"
                              : "bg-red-50 dark:bg-red-900/10"
                          }`}
                        >
                          <p className="text-sm">
                            {historyItem.success
                              ? historyItem.summary
                              : historyItem.error}
                          </p>
                        </div>
                      )}

                      {/* Steps accordion (collapsed by default) */}
                      {historyItem.steps.length > 0 && (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="steps">
                            <AccordionTrigger>View Details</AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-2 mt-2">
                                {/* Group steps by subreddit */}
                                {Object.entries(
                                  groupStepsBySubreddit(historyItem.steps)
                                )
                                  .filter(([key]) => key !== "other")
                                  .map(([group, groupSteps]) => (
                                    <div
                                      key={group}
                                      className="border rounded-md p-3"
                                    >
                                      <h4 className="font-medium mb-2">
                                        {group === "initialization"
                                          ? "Agent Initialization"
                                          : group === "configuration"
                                          ? "Agent Configuration"
                                          : `r/${group}`}
                                      </h4>
                                      <div className="space-y-2">
                                        {groupSteps.map((step) => (
                                          <div
                                            key={step.id}
                                            className="text-sm"
                                          >
                                            <div className="flex items-start gap-2">
                                              <div className="mt-0.5">
                                                {step.status === "completed" ? (
                                                  <CheckCircle className="h-3 w-3 text-green-500" />
                                                ) : step.status === "error" ? (
                                                  <AlertCircle className="h-3 w-3 text-red-500" />
                                                ) : (
                                                  <div className="h-3 w-3 rounded-full bg-muted" />
                                                )}
                                              </div>
                                              <div>
                                                <p>{step.message}</p>
                                                {step.details && (
                                                  <p className="text-xs text-muted-foreground mt-0.5">
                                                    {step.details}
                                                  </p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
