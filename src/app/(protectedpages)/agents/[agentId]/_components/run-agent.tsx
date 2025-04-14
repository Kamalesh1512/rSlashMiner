"use client";

import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { toast } from "sonner";

type StepStatus = "running" | "completed" | "error" | "waiting";

interface Step {
  id: string;
  status: StepStatus;
  message: string;
  details?: string;
  timestamp: Date;
  progress: number;
}

export default function RunAgent() {
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
  const eventSourceRef = useRef<EventSource | null>(null);

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
    }
  }, [status, router]);

  const runAgent = async () => {
    // Reset state
    setIsRunning(true);
    setProgress(0);
    setSteps([]);
    setRunResult(null);

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
          // Handle step update
          setSteps((prevSteps) => {
            // Check if this step already exists
            const existingStepIndex = prevSteps.findIndex(
              (step) => step.id === data.id
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
              };
              return updatedSteps;
            } else {
              // Add new step
              return [
                ...prevSteps,
                {
                  id: data.id,
                  status: data.status,
                  message: data.message,
                  details: data.details,
                  timestamp: new Date(),
                  progress: data.progress || 0,
                },
              ];
            }
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

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold">Run Agent</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Agent Run</CardTitle>
          <CardDescription>
            Run this agent now to search Reddit for relevant content matching
            your keywords and subreddits.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!isRunning && steps.length === 0 && !runResult ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-center text-muted-foreground max-w-md">
                Running the agent will search Reddit for new content matching
                your keywords in the selected subreddits. This process may take
                a few minutes depending on the number of subreddits and
                keywords.
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

              {/* Steps list */}
              <div className="border rounded-md">
                <Accordion type="multiple" className="w-full">
                  {steps.map((step, index) => (
                    <AccordionItem value={step.id} key={step.id}>
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <div className="flex-shrink-0">
                            {step.status === "running" && (
                              <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            )}
                            {step.status === "completed" && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {step.status === "error" && (
                              <AlertCircle className="h-5 w-5 text-red-500" />
                            )}
                            {step.status === "waiting" && (
                              <Clock className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-grow">
                            <div className="font-medium">{step.message}</div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(step.timestamp)}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-3 pt-0">
                        <div className="pl-8 text-sm text-muted-foreground">
                          {step.details || "No additional details available"}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
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
                    {runResult.success ? runResult.summary : runResult.error}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
