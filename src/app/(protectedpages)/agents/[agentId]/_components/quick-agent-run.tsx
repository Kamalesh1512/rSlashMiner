"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Play, XCircle, CheckCircle, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"

interface QuickRunAgentProps {
  agentId: string
  onComplete?: (success: boolean, resultsCount: number) => void
}

export function QuickRunAgent({ agentId, onComplete }: QuickRunAgentProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<{
    success: boolean
    resultsCount: number
    error?: string
  } | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Clean up event source on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const runAgent = async () => {
    // Reset state for new run
    setIsRunning(true)
    setProgress(0)
    setResult(null)

    // Close any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    // Create a new EventSource connection
    const eventSource = new EventSource(`/api/agents/run/stream?agentId=${agentId}`)
    eventSourceRef.current = eventSource

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === "step") {
          // Update progress
          if (data.progress) {
            setProgress(data.progress)
          }
        } else if (data.type === "complete") {
          // Handle completion
          setResult({
            success: true,
            resultsCount: data.resultsCount,
          })
          setProgress(100)
          setIsRunning(false)

          toast.success("Agent run completed",{
            description: `Found ${data.resultsCount} relevant results.`,
          })

          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(true, data.resultsCount)
          }

          // Close the connection
          eventSource.close()
          eventSourceRef.current = null
        } else if (data.type === "error") {
          // Handle error
          setResult({
            success: false,
            resultsCount: 0,
            error: data.error,
          })
          setIsRunning(false)

          toast.error("Agent run failed",{
            description: data.error,
          })

          // Call onComplete callback if provided
          if (onComplete) {
            onComplete(false, 0)
          }

          // Close the connection
          eventSource.close()
          eventSourceRef.current = null
        }
      } catch (error) {
        console.error("Error parsing event data:", error)
      }
    }

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error)

      setResult({
        success: false,
        resultsCount: 0,
        error: "Connection error. Please try again.",
      })
      setIsRunning(false)

      toast.error( "Connection error",{
        description: "Lost connection to the server. Please try again.",
      })

      // Call onComplete callback if provided
      if (onComplete) {
        onComplete(false, 0)
      }

      // Close the connection
      eventSource.close()
      eventSourceRef.current = null
    }
  }

  const cancelRun = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setIsRunning(false);
    // setRunResult({
    //   success: false,
    //   summary: "",
    //   resultsCount: 0,
    //   error: "Agent run cancelled by user",
    // });

    // Update run history
    // if (currentRunIdRef.current) {
    //   setRunHistory((prevHistory) => {
    //     const currentRunIndex = prevHistory.findIndex(
    //       (run) => run.id === currentRunIdRef.current
    //     );
    //     if (currentRunIndex >= 0) {
    //       const updatedHistory = [...prevHistory];
    //       updatedHistory[currentRunIndex] = {
    //         ...updatedHistory[currentRunIndex],
    //         completedAt: new Date(),
    //         success: false,
    //         error: "Agent run cancelled by user",
    //       };
    //       return updatedHistory;
    //     }
    //     return prevHistory;
    //   });
    // }

    setIsRunning(false)
    setResult({
      success: false,
      resultsCount: 0,
      error: "Agent run cancelled by user",
    })

    toast.error("Run cancelled",{
      description: "Agent run was cancelled",
    })

    // Call onComplete callback if provided
    if (onComplete) {
      onComplete(false, 0)
    }
  }

  return (
    <div className="w-full space-y-2">
      {!isRunning && !result ? (
        <Button variant="default" size="sm" className="w-fit" onClick={runAgent}>
          <Play className="mr-2 h-3 w-3" />
          Run Agent
        </Button>
      ) : (
        <div className="space-y-2">
          {isRunning && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Running agent...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-1.5"/>
              <Button variant="ghost" size="sm" className="w-full h-7 text-xs" onClick={cancelRun}>
                <XCircle className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </motion.div>
          )}

          {!isRunning && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between">
              {result.success ? (
                <>
                  <div className="flex items-center text-xs">
                    <CheckCircle className="mr-1 h-3 w-3 text-green-500" />
                    <span>Found {result.resultsCount} results</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={runAgent}>
                    Run Again
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center text-xs">
                    <AlertCircle className="mr-1 h-3 w-3 text-red-500" />
                    <span className="truncate max-w-[120px]">{result.error || "Failed to run"}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={runAgent}>
                    Retry
                  </Button>
                </>
              )}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
