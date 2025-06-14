"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, XCircle, CheckCircle, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface QuickRunAgentProps {
  agentId: string;
  onComplete?: (success: boolean, resultsCount: number) => void;
}

export function QuickRunAgent({ agentId, onComplete }: QuickRunAgentProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liveMessage, setLiveMessage] = useState<string | null>(null);
  const [manualRun, setManualRun] = useState<{
    canRun: boolean;
    runCount: number;
    interval: string;
    type: string;
  } | null>(null);
  const [result, setResult] = useState<{
    success: boolean;
    resultsCount: number;
    error?: string;
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const router = useRouter();

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);
  const runAgent = async () => {
    // Reset state for new run
    setIsRunning(true);
    setProgress(0);
    setResult(null);

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
        if (data.message) {
          setLiveMessage(data.message);
        }

        if (data.type === "step") {
          // Update progress
          if (data.progress) {
            setProgress(data.progress);
          }
        } else if (data.type === "complete") {
          // Handle completion
          setResult({
            success: true,
            resultsCount: data.resultsCount,
          });
          console.log("Agent Run Results:", result);
          setProgress(100);
          setIsRunning(false);

          toast.success("Agent run completed", {
            description: `Found ${data.resultsCount} relevant results.`,
          });

          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(true, data.resultsCount);
          }

          // Close the connection
          eventSource.close();
          eventSourceRef.current = null;
        } else if (data.type === "error") {
          // Handle error
          setResult({
            success: false,
            resultsCount: 0,
            error: data.error,
          });
          setIsRunning(false);

          toast.error("Agent run failed", {
            description: data.error,
          });

          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(false, 0);
          }

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

      setResult({
        success: false,
        resultsCount: 0,
        error: "Connection error. Please try again.",
      });
      setIsRunning(false);

      toast.error("Connection error", {
        description: "Lost connection to the server. Please try again.",
      });

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(false, 0);
      }

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
    setResult({
      success: false,
      resultsCount: 0,
      error: "Agent run cancelled by user",
    });

    toast.error("Run cancelled", {
      description: "Agent run was cancelled",
    });

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(false, 0);
    }
  };
  const handleRunAgent = async () => {
    try {
      const response = await fetch("/api/usage-limits/manual-run");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch run limits");
      }

      setManualRun(data.manualRun);


      if (data.manualRun?.canRun) {
        runAgent(); // ✅ Proceed if allowed
      } else {
        toast.error("Manual run limit reached", {
          description: `You’ve used all ${data.manualRun?.runCount} manual runs. Resets ${data.manualRun?.interval}.`,
        });
      }
    } catch (error) {
      toast.error("Error checking usage", {
        description:
          error instanceof Error
            ? error.message
            : "Failed to check manual run availability",
      });
    }
  };

  return (
    <div className="w-full space-y-2">
      {!isRunning && !result? (
        <Button
          variant="default"
          size="sm"
          className="w-fit"
          onClick={handleRunAgent}
        >
          <Play className="mr-2 h-3 w-3" />
          Run Agent
        </Button>
      ) : (
        <div className="space-y-2">
          {isRunning && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>{liveMessage ?? "Running agent..."}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={cancelRun}
              >
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </motion.div>
          )}

          {!isRunning && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between"
            >
              {result.success ? (
                <>
                  <div className="flex flex-col items-center text-xs">
                    <div className="flex flex-row items-center">
                      <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                      <span>Found {result.resultsCount} results</span>
                    </div>
                    <div className="flex flex-row justify-between items-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => router.push("/results")}
                      >
                        View Results
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleRunAgent}
                      >
                        Run Again
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center text-xs">
                    <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                    <span className="truncate max-w-[120px]">
                      {result.error || "Failed to run"}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={runAgent}
                  >
                    Retry
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
    //   <div className="w-full space-y-2">
    //   {!isRunning && !result ? (
    //     manualRun?.canRun ? (
    //       <Button
    //         variant="default"
    //         size="sm"
    //         className="w-fit"
    //         onClick={handleRunAgent}
    //       >
    //         <Play className="mr-2 h-3 w-3" />
    //         Run Agent
    //       </Button>
    //     ) : (
    //       <div className="text-sm text-muted-foreground border p-3 rounded-md bg-muted">
    //         You’ve reached the manual run limit
    //         {<strong>{manualRun?.runCount}</strong>}. Resets every{" "}
    //         {<strong>{manualRun?.interval}</strong>}. Upgrade your plan to increase usage.
    //       </div>
    //     )
    //   ) : (
    //     <div className="space-y-2">
    //       {isRunning && (
    //         <motion.div
    //           initial={{ opacity: 0, y: 5 }}
    //           animate={{ opacity: 1, y: 0 }}
    //           className="space-y-2"
    //         >
    //           <div className="flex justify-between items-center text-xs text-muted-foreground">
    //             <span>{liveMessage ?? "Running agent..."}</span>
    //             <span>{progress}%</span>
    //           </div>
    //           <Progress value={progress} className="h-1.5" />
    //           <Button
    //             variant="ghost"
    //             size="sm"
    //             className="w-full h-7 text-xs"
    //             onClick={cancelRun}
    //           >
    //             <XCircle className="mr-1 h-3 w-3" />
    //             Cancel
    //           </Button>
    //         </motion.div>
    //       )}

    //       {!isRunning && result && (
    //         <motion.div
    //           initial={{ opacity: 0 }}
    //           animate={{ opacity: 1 }}
    //           className="flex items-center justify-between"
    //         >
    //           {result.success ? (
    //             <div className="flex flex-col items-center text-xs">
    //               <div className="flex flex-row items-center">
    //                 <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
    //                 <span>Found {result.resultsCount} results</span>
    //               </div>
    //               <div className="flex flex-row justify-between items-center">
    //                 <Button
    //                   variant="ghost"
    //                   size="sm"
    //                   className="h-7 text-xs"
    //                   onClick={() => router.push("/results")}
    //                 >
    //                   View Results
    //                 </Button>
    //                 <Button
    //                   variant="ghost"
    //                   size="sm"
    //                   className="h-7 text-xs"
    //                   onClick={runAgent}
    //                   disabled={!manualRun?.canRun}
    //                 >
    //                   Run Again
    //                 </Button>
    //               </div>
    //             </div>
    //           ) : (
    //             <>
    //               <div className="flex items-center text-xs">
    //                 <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
    //                 <span className="truncate max-w-[120px]">
    //                   {result.error || "Failed to run"}
    //                 </span>
    //               </div>
    //               <Button
    //                 variant="ghost"
    //                 size="sm"
    //                 className="h-7 text-xs"
    //                 onClick={runAgent}
    //                 disabled={!manualRun?.canRun}
    //               >
    //                 Retry
    //               </Button>
    //             </>
    //           )}
    //         </motion.div>
    //       )}
    //     </div>
    //   )}
    // </div>
  );
}
